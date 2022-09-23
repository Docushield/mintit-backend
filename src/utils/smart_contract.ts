import { Collection, Token } from "../models/collection";
import { send, mkCap, mkCmd } from "./kadena";

const contractNamespace = process.env.CONTRACT_NAMESPACE || "free";
const contractName = process.env.CONTRACT_NAME || "z74plc";

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
    const tokenOwner = "k:f6abd552229466ae01216368864b475481d8d222665e3f533825b399653bc41d"

    const caps = [
      mkCap("Gas Payer", "Gas Payer", "coin.GAS", []),
      mkCap("Marmalade Mint", "Marmalade Mint", "marmalade.ledger.MINT", [
        marmaladeTokenId,
        tokenOwner,
        1
      ])
    ]

    const data = null;

    const command = mkCmd(pactCode, data, caps);

    return send({cmds: [command]});
  }