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

export const contractNamespace = process.env.CONTRACT_NAMESPACE || "free";
export const contractName = process.env.CONTRACT_NAME || "z74plc";

const mintTrackingBatchSize =
  parseInt(process.env.MINT_TRACKING_BATCH_SIZE || "10") || 10;
const initBlockHeight =
  parseInt(process.env.INIT_BLOCK_HEIGHT || "2572069") || 2572069;

export const revealNft = (
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
  const marmaladeTokenId = `t:${token.hash}`;

  const pactCode = `(${contractNamespace}.${contractName}.reveal-nft {
      "name": "${tokenName}",
      "description": "${collection.description} token description",
      "content-hash": "${token.hash}",
      "spec": ${JSON.stringify(token.spec)},
      "collection-name" :"${collection.name}",
      "content-uri": (kip.token-manifest.uri 
          "${token.contentUri.scheme}" 
          "${token.contentUri.data}"
        ),
      "marmalade-token-id": "${marmaladeTokenId}",
      "edition": 1,
      "creator": "${collection.creator}"
    })`;

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
};

const nftRepository = new NFTRepository();
const collectionRepository = new CollectionRepository();
let lastBlockHeight = initBlockHeight;

export const checkMintTokenOnChain = async () => {
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
  lastBlockHeight = blockTo;
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
        p.module.name == contractName &&
        p.module.namespace == contractNamespace &&
        p.name == "MINT_NFT_EVENT" &&
        p.params
      ) {
        console.log("Found our mint nft event: ", JSON.stringify(p));
        const obj = p.params[0];
        const nft = await nftRepository.updateMintedAtAndIndexWithOwner(
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
            const collection = await collectionRepository.findCollection(
              nft[1][0].collectionId
            );
            if (
              collection &&
              new Date().toISOString().split(".")[0] + "Z" >=
                collection["reveal-at"]
            ) {
              console.log(
                "calling reveal for token with content hash: ",
                obj["content-hash"]
              );
              const txResponse = await revealNft(collection, nft[1][0]);
              let requestKeys: string[] = new Array();
              if (txResponse == null) {
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
                  listenTxResponse.response.data
                ) {
                  nftRepository.updateRevealedAt(
                    nft[1][0].id,
                    listenTxResponse.metaData.blockHeight
                  );
                }
              }
            }
            if (collection) {
              const numMinted = await getCollection(collection.name);
              await collectionRepository.updateNumMinted(
                collection.id,
                numMinted
              );
            }
          } else {
            console.log("No token found with the hash: ", obj["content-hash"]);
          }
        }
      }
    })
  );
};

export const checkRevealTime = async () => {
  const collections =
    (await collectionRepository.findCollectionLessThanReveal(
      new Date().toString()
    )) || [];
  for (const collection of collections) {
    const nfts =
      (await nftRepository.findNFTByCollectionIdAndNullReveal(collection.id)) ||
      [];
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
            listenTxResponse.response.data
          ) {
            const updatedNft = await nftRepository.updateRevealedAt(
              nft.id,
              listenTxResponse.metaData.blockHeight
            );
          }
        }
      }
    }
  }
};

export const getCollection = async (collectionName: string) => {
  const pactCode = `(${contractNamespace}.${contractName}.get-nft-collection "${collectionName}")`;

  console.log(pactCode);
  const resp = await localTx(pactCode);
  console.log("Response from local: ", resp.result.data["num-minted"].int);
  return resp.result.data["num-minted"].int;
};
