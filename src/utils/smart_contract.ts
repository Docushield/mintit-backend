import { Collection, Token } from "../models/collection";
import { send, mkCap, mkCmd, chainId, networkId, apiHost } from "./kadena";
import { NFTRepository } from "../repository/nft";
import Pact from "pact-lang-api";

const contractNamespace = process.env.CONTRACT_NAMESPACE || "free";
const contractName = process.env.CONTRACT_NAME || "z74plc";

const mintTrackingBatchSize = parseInt(process.env.MINT_TRACKING_BATCH_SIZE || "10") || 10;
const initBlockHeight =
  parseInt(process.env.INIT_BLOCK_HEIGHT || "2572069") || 2572069;  

export const revealNft = (
  collection: Collection,
  token: {
    hash: string;
    spec: object;
    content_uri: { scheme: string; data: string };
  }
) => {
  const tokenName = `${collection.name} #1234`;
  const marmaladeTokenId = `t:${token.hash}`;

  const pactCode = `(${contractNamespace}.${contractName}.reveal-nft {
      "name": "${tokenName}",
      "description": "${collection.description} token description",
      "content-hash": "${token.hash}",
      "spec": ${JSON.stringify(token.spec)},
      "collection-name" :"${collection.name}",
      "content-uri": (kip.token-manifest.uri 
          "${token["content-uri"].scheme}" 
          "${token["content-uri"].data}"
        ),
      "marmalade-token-id": "${marmaladeTokenId}",
      "edition": 1,
      "creator": "${collection.creator}"
    })`;

  // TODO: Use token owner from minted token
  const tokenOwner =
    "k:f6abd552229466ae01216368864b475481d8d222665e3f533825b399653bc41d";

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

export const checkMintTokenOnChain = async () => {
  const latestBlockHeight = await nftRepository.findLatestMintAt();
  const blockFrom = Math.max(initBlockHeight, latestBlockHeight);
  const blockTo = blockFrom + mintTrackingBatchSize;
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
        const nft = await nftRepository.updateMintedAt(
          obj["content-hash"],
          p.height
        );
        console.log(
          "Updated minted at for nft with hash: ",
          obj["content-hash"],
          " with value: ",
          p.height
        );
      }
    })
  );
};
