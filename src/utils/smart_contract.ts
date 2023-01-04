import { Collection, Token } from "../models/collection";
import {
  cut,
  send,
  localTx,
  mkCap,
  mkCmd,
  chainId,
  networkId,
  apiHost,
  listenTx,
} from "./kadena";
import { NFTRepository } from "../repository/nft";
import { CollectionRepository } from "../repository/collection";
import Pact from "pact-lang-api";
import { copyObjectWithSortedKeys } from "./serialize";

export const contractNamespace = process.env.CONTRACT_NAMESPACE || "free";
export const contractName = process.env.CONTRACT_NAME || "z74plc";

const mintTrackingBatchSize =
  parseInt(process.env.MINT_TRACKING_BATCH_SIZE || "10") || 10;
const initBlockHeight =
  parseInt(process.env.INIT_BLOCK_HEIGHT || "2572069") || 2572069;

const pollInterval = parseInt(process.env.POLL_INTERVAL_SECONDS || "30") || 30;
const revealPollInterval =
  parseInt(process.env.REVEAL_POLL_INTERVAL_SECONDS || "600") || 600;

  export const revealNft = async (
    collection: Collection,
    token: {
      hash: string;
      spec: object;
      contentUri: { scheme: string; data: string };
      index: number;
      owner: string;
    }
  ) => {
    const tokenName = `${collection.name} ${token.index}`;
    const specString =  JSON.stringify(copyObjectWithSortedKeys(token.spec));
  
    // create manifest to get marmalade token id, also use this manifest in reveal token
    const pactCode = `(${contractNamespace}.${contractName}.create-manifest {
      "name": "${tokenName}",
      "description": "${collection.description}",
      "content-hash": "${token.hash}",
      "spec": ${specString},
      "collection-name" :"${collection.name}",
      "content-uri": (kip.token-manifest.uri 
          "${token.contentUri.scheme}" 
          "${token.contentUri.data}"
        ),
      "edition": 1,
      "creator": "${collection.creator}"
    })`;
    const resp = await localTx(pactCode);
    if (resp && resp.result && resp.result.data) {
      const token_manifest = resp.result.data;
      const marmaladeTokenId = `t:${token_manifest.hash}`;
      await nftRepository.updateNameAndTokenId(
        tokenName,
        marmaladeTokenId,
        token.hash,
        collection.id
      );
      const manifestString = JSON.stringify(token_manifest);
      if (token.hash === Pact.crypto.hash(specString)) {
        const pactCode = `(${contractNamespace}.${contractName}.reveal-nft {
          "name": "${tokenName}",
          "description": "${collection.description}",
          "content-hash": "${token.hash}",
          "spec": ${specString},
          "marmalade-token-id": "${marmaladeTokenId}",
          "collection-name" :"${collection.name}",
          "content-uri": (kip.token-manifest.uri 
              "${token.contentUri.scheme}" 
              "${token.contentUri.data}"
            ),
          "edition": 1,
          "creator": "${collection.creator}"
        } ${manifestString})`;
        const tokenOwner = token.owner;
        const caps = [
          mkCap("Gas Payer", "Gas Payer", "coin.GAS", []),
          mkCap("Marmalade Mint", "Marmalade Mint", "marmalade.ledger.MINT", [
            marmaladeTokenId,
            tokenOwner,
            1,
          ]),
        ];
        const data = null;
        const command = mkCmd(pactCode, data, caps);
        return send({ cmds: [command] });
      } else {
        console.log(
          "hash mismatched while calling reveal, expected: " +
            token.hash +
            " got: " +
            Pact.crypto.hash(specString)
        );
        return;
      }
    }else{
      return;
    }
  };

const nftRepository = new NFTRepository();
const collectionRepository = new CollectionRepository();
let lastBlockHeight = initBlockHeight;

export const checkMintTokenOnChain = async () => {
  try {
    const latestBlockHeight = await nftRepository.findLatestMintAt();
    const blockFrom = Math.max(
      initBlockHeight,
      latestBlockHeight == 0
        ? lastBlockHeight
        : Math.min(lastBlockHeight, latestBlockHeight)
    );
    const cutResp = await cut();
    let chainBlockHeight = blockFrom + mintTrackingBatchSize;
    if (cutResp.hashes) {
      chainBlockHeight = Math.min(
        cutResp.hashes[`${chainId}`]["height"] || Number.MAX_SAFE_INTEGER,
        chainBlockHeight
      );
    }
    const blockTo = chainBlockHeight;
    console.log(
      "started listening on blockchain for latest mint events from: " +
        blockFrom +
        " to: " +
        blockTo
    );
    const data = await Pact.event.range(
      chainId,
      blockFrom,
      blockTo,
      networkId,
      apiHost
    );
    console.log("Found " + data.length + " events from blockchain");
    await Promise.all(
      data.map(async function (p) {
        if (
          (p.module.name == contractName ||
            p.module.name == "mintit-policy-v2") && // this check is required for backward compatibility
          p.module.namespace == contractNamespace &&
          p.name == "MINT_NFT_EVENT" &&
          p.params
        ) {
          console.log("Found our mint nft event: ", JSON.stringify(p));
          const obj = p.params[0];
          console.log("Found NFT to be revealed", JSON.stringify(obj));
          const collection = await collectionRepository.findCollectionByName(
            obj["collection-name"]
          );
          if (collection) {
            console.log("collection found: ", collection);
            const nft = await nftRepository.updateMintedAtAndIndexWithOwner(
              collection.id,
              obj["content-hash"],
              obj["mint-index"]["int"],
              obj["current-owner"],
              p.height
            );
            if (nft) {
              if (nft[0] >= 1) {
                console.log(
                  "Updated minted at for nft with hash: ",
                  obj["content-hash"],
                  " with value: ",
                  p.height
                );
                if (nft[1][0].revealedAt) {
                  console.log("Already revealed token: ", obj["content-hash"]);
                  return;
                }
                if (
                  new Date().getTime() >=
                  new Date(collection["reveal-at"]).getTime()
                ) {
                  console.log(
                    "calling reveal for token with content hash: ",
                    obj["content-hash"]
                  );
                  const txResponse = await revealNft(collection, nft[1][0]);
                  let requestKeys: string[] = new Array();
                  if (
                    txResponse == null ||
                    (txResponse.status && txResponse.status == "timeout") ||
                    !txResponse.requestKeys
                  ) {
                    console.log(
                      "error occurred while calling reveal for token: ",
                      obj["content-hash"]
                    );
                  } else {
                    console.log(txResponse["requestKeys"]);
                    requestKeys = requestKeys.concat(txResponse["requestKeys"]);
                  }
                  for (const requestKey of requestKeys) {
                    const listenTxResponse = await listenTx(requestKey);
                    if (
                      listenTxResponse &&
                      listenTxResponse.result &&
                      listenTxResponse.result.data
                    ) {
                      nftRepository.updateRevealedAt(
                        nft[1][0].id,
                        listenTxResponse.metaData.blockHeight
                      );
                    } else {
                      console.log(
                        "error occurred while reveal nft: ",
                        listenTxResponse
                      );
                      if (
                        listenTxResponse &&
                        listenTxResponse.result &&
                        listenTxResponse.result.error &&
                        listenTxResponse.result.error.message ===
                          "EXC_NFT_ALREADY_REVEALED"
                      ) {
                        console.log(
                          "Already revealed hence updating the revealedAt to current block"
                        );
                        const updatedNft = await nftRepository.updateRevealedAt(
                          nft[1][0].id,
                          nft[1][0].mintedAt
                        );
                      }
                    }
                  }
                }
                const numMinted = await getCollection(collection.name);
                if (numMinted)
                  await collectionRepository.updateNumMinted(
                    collection.id,
                    numMinted
                  );
              } else {
                console.log(
                  "No token found with the hash: ",
                  obj["content-hash"]
                );
              }
            }
          } else {
            console.log(
              "No Collection found for the slug: ",
              obj["collection-name"].replaceAll(" ", "-")
            );
          }
        }
      })
    );
    lastBlockHeight = blockTo;
  } catch (err) {
    console.log("Exception occurred while listening on minting: ", err);
  }
  setTimeout(checkMintTokenOnChain, pollInterval * 1000);
};

export const checkRevealTime = async () => {
  try {
    const collections =
      (await collectionRepository.findCollectionLessThanReveal(
        new Date().toString()
      )) || [];
    for (const collection of collections) {
      const nfts =
        (await nftRepository.findNFTByCollectionIdAndNullReveal(
          collection.id
        )) || [];
      for (const nft of nfts) {
        if (nft.mintedAt) {
          const txResponse = await revealNft(collection, nft);
          let requestKeys: string[] = new Array();
          if (txResponse == null) {
            console.log(
              "error occurred while calling reveal for token: ",
              nft.hash
            );
          } else {
            console.log(txResponse["requestKeys"]);
            requestKeys = requestKeys.concat(txResponse["requestKeys"]);
          }
          for (const requestKey of requestKeys) {
            const listenTxResponse = await listenTx(requestKey);
            if (
              listenTxResponse &&
              listenTxResponse.result &&
              listenTxResponse.result.data
            ) {
              const updatedNft = await nftRepository.updateRevealedAt(
                nft.id,
                listenTxResponse.metaData.blockHeight
              );
            } else {
              console.log(
                "error occurred while reveal nft: ",
                listenTxResponse
              );
              if (
                listenTxResponse &&
                listenTxResponse.result &&
                listenTxResponse.result.error &&
                listenTxResponse.result.error.message ===
                  "EXC_NFT_ALREADY_REVEALED"
              ) {
                console.log(
                  "Already revealed hence updating the revealedAt to current block"
                );
                const updatedNft = await nftRepository.updateRevealedAt(
                  nft.id,
                  nft.mintedAt
                );
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.log("Exception occurred while checking reveal time: ", err);
  }
  setTimeout(checkRevealTime, revealPollInterval * 1000);
};

export const getCollection = async (collectionName: string) => {
  const pactCode = `(${contractNamespace}.${contractName}.get-nft-collection "${collectionName}")`;

  console.log(pactCode);
  const resp = await localTx(pactCode);
  if (resp && resp.result && resp.result.data) {
    console.log("Response from local: ", resp.result.data["num-minted"].int);
    return resp.result.data["num-minted"].int;
  } else {
    console.log(
      "Error occurred while reading nft information: ",
      resp.result.error
    );
    return;
  }
};
