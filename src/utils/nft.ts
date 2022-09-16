import { Collection } from "../models/collection";
import { TypedRequestBody } from "../express";

export const initNFTExpression = (
  req: TypedRequestBody<{
    body: {
      "token-list": object;
      "premint-ends": string;
      "mint-starts": string;
    };
  }>,
  collection: Collection
) => {
  let tokenListHashes = req.body!["token-list"].map((val) => {
    return val.hash;
  });
  let expression = `(free.z74plc.init-nft-collection {"creator": "${
    collection.creator
  }", "description": "${collection.description}", "name" : "${
    collection.name
  }", "type": "${collection.type}", "provenance-hash": "${
    collection["provenance-hash"]
  }", "mint-starts": (time "${
    req.body!["mint-starts"]
  }"), "premint-ends": (time "${
    req.body!["premint-ends"]
  }"), "premint-whitelist": ${JSON.stringify(
    collection["premint-whitelist"]
  )}, "size": ${collection.size}, "mint-price": ${collection[
    "mint-price"
  ].toFixed(2)}, "sale-royalties": ${JSON.stringify(
    collection["sale-royalties"]
  )}, "mint-royalties": ${JSON.stringify(
    collection["mint-royalties"]
  )}, "fungible": coin, "token-list": ${JSON.stringify(tokenListHashes)}})`;
  console.log(expression);
  return expression;
};

export const revealNFTExpression = (
  collection: Collection,
  token: {
    hash: string;
    spec: object;
    content_uri: { scheme: string; data: string };
  }
) => {
  let expression = `(free.z74plc.reveal-nft { "name": "${
    collection.name
  }", "description": "${collection.description}", "content-hash": "${
    token.hash
  }", "spec": ${JSON.stringify(token.spec)}, "collection-name": "${
    collection.name
  }", "content-uri": (kip.token-manifest.uri "${
    token["content_uri"].scheme
  }" "${token["content_uri"].data}"), "marmalade-token-id": "t:${
    token.hash
  }", "edition": 1, "creator": "${collection.creator}" })`;
  console.log(expression);
  return expression;
};
