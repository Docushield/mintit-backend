import { Collection } from "../models/collection"
import { mkCap, mkCmd, send } from "./kadena"

const contractName = process.env.CONTRACT_NAME || "free.z74plc"

export const revealNft = async (
  collection: Collection,
  token: {
    hash: string,
    spec: object,
    contentUri: { scheme: string, data: string}
  }
) => {
  // TODO: Add correct index 
  const tokenName = `${collection.name} #1234`;
  const marmaladeTokenId = `t:${token.hash}`;

  const pactCode = `(${contractName}.reveal-nft {
    'name: "${tokenName}",
    'description: "${collection.description} token description",
    'content-hash: "${token.hash}",
    'spec: "${JSON.stringify(token.spec)}",
    'collection-name: "${collection.name}",
    'content-uri: (kip.token-manifest.uri 
      "${token["content-uri"].scheme}" 
      "${token["content-uri"].data}"
    ),
    'marmalade-token-id: "${marmaladeTokenId}",
    'edition: 1,
    'creator: "${collection.creator}"
  })`;

  // TODO: Replace with the minted token holder's account
  const tokenOwner = "k:047bc663e6cdaccb268e224765645dd11573091f9ff2ac083508b46a0647ace0";

  const data = null;

  const caps = [
    mkCap("Gas Payer", "Gas Payer", "coin.GAS", []),
    mkCap("Marmalade Mint", "Marmalade Mint", "marmalade.ledger.MINT", [
      marmaladeTokenId,
      tokenOwner,
      1
    ])
  ];

  const cmd = mkCmd(pactCode, data, caps);

  const payload = {"cmds": [cmd]};

  return send(payload);
}