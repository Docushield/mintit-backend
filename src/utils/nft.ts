import { Collection, Token } from "../models/collection";
import { TypedRequestBody } from "../express";
import { objCustomStringify } from "./serialize";

export const initNFTExpression = (
  body: {
    "token-list": [Token];
    "premint-ends": string;
    "mint-starts": string;
  },
  collection: Collection
) => {
  let tokenListHashes = body["token-list"].map((val) => {
    return val.hash;
  });
  const mintRoyaltyData = buildGuards(collection["mint-royalties"]["rates"]);
  const saleRoyaltyData = buildGuards(collection["sale-royalties"]["rates"]);
  const data = { ...mintRoyaltyData, ...saleRoyaltyData };
  let expression = `(free.z74plc.init-nft-collection {"creator": "${
    collection.creator
  }", "description": "${collection.description}", "name" : "${
    collection.name
  }", "type": "${collection.type}", "provenance-hash": "${
    collection["provenance-hash"]
  }", "mint-starts": (time "${body["mint-starts"]}"), "premint-ends": (time "${
    body!["premint-ends"]
  }"), "premint-whitelist": ${JSON.stringify(
    collection["premint-whitelist"]
  )}, "size": ${collection.size}, "mint-price": ${collection[
    "mint-price"
  ].toFixed(2)}, "sale-royalties": ${objCustomStringify(
    collection["sale-royalties"]
  )}, "mint-royalties": ${objCustomStringify(
    collection["mint-royalties"]
  )}, "fungible": coin, "token-list": ${JSON.stringify(tokenListHashes)}})`;
  console.log(expression);
  return { expr: expression, env: data };
};

export const buildGuards = (
  royalty: [
    {
      description: string;
      "stakeholder-guard": { pred: string; keys: [string] };
    }
  ]
) => {
  let output = {};
  royalty.map(function (e) {
    output[e.description + "-guard"] = e["stakeholder-guard"];
  });
  return output;
};

export const modifyRoyalty = (royalty: [{ description: string }]) => {
  royalty.map(function (e) {
    e["stakeholder-guard"] = `(read-msg ${e.description}-guard)`;
  });
  return royalty;
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
