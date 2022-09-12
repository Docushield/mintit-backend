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
  }"), "premint-whitelist": "${collection["premint-whitelist"]}", "size": "${
    collection.size
  }", "mint-price": "${collection["mint-price"].toFixed(
    2
  )}", "sale-royalties": "${
    collection["sale-royalties"]
  }", "mint-royalties": "${
    collection["mint-royalties"]
  }", "fungible": coin, "token-list": "${tokenListHashes}"})`;
  return expression;
};
