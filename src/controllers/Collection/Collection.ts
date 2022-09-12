import { Request, Response } from "express";
import { TypedRequestBody } from "../../express";
import { APILogger } from "../../logger/api";
import { AuthTokenRepository } from "../../repository/authtoken";
import { CollectionRepository } from "../../repository/collection";
import { NFTRepository } from "../../repository/nft";
import { Collection } from "../../models/collection";
import { TokenStatus } from "../../models/authtoken";
import { lang, crypto } from "pact-lang-api";
import Pact from "pact-lang-api";
import * as Kadena from "../../utils/kadena";

export class CollectionController {
  private authTokenRespository: AuthTokenRepository;
  private collectionRepository: CollectionRepository;
  private nftRepository: NFTRepository;
  private logger: APILogger;

  constructor() {
    this.authTokenRespository = new AuthTokenRepository();
    this.collectionRepository = new CollectionRepository();
    this.nftRepository = new NFTRepository();
    this.logger = new APILogger();
  }

  async findToken(token: string) {
    return await this.authTokenRespository.findToken(token);
  }

  async getNFTCollectionStatus(id: string, res: Response) {
    let nft = await this.nftRepository.findNFTCollection(id);
    if (!nft) {
      res.status(400).json({ error: "No NFT Collection found." });
      return;
    }
    res.status(200).json({ id: id, status: nft["status"] });
    return;
  }

  async addCollection(req: Request, res: Response) {
    let tokenU = req.headers["x-auth-token"];
    let isAuthenticated = await this.authTokenRespository.validateToken(
      tokenU,
      res
    );
    if (!isAuthenticated) {
      res.status(500).json({ error: "unable to create the collection" });
      return;
    }
    let collection = await this.collectionRepository.createCollection(req.body);
    if (collection != null) {
      let tokenListHashes = req.body["token-list"].map((val) => {
        return val.hash;
      });
      let expression = `(free.z74plc.init-nft-collection {"creator": ${JSON.stringify(
        collection.creator
      )}, "description": ${JSON.stringify(
        collection.description
      )}, "name" : ${JSON.stringify(collection.name)}, "type": ${JSON.stringify(
        collection.type
      )}, "provenance-hash": ${JSON.stringify(
        collection["provenance-hash"]
      )}, "mint-starts": (time ${JSON.stringify(
        req.body["mint-starts"]
      )}), "premint-ends": (time ${JSON.stringify(
        req.body["premint-ends"]
      )}), "premint-whitelist": ${JSON.stringify(
        collection["premint-whitelist"]
      )}, "size": ${collection.size}, "mint-price": ${collection[
        "mint-price"
      ].toFixed(2)}, "sale-royalties": ${JSON.stringify(
        collection["sale-royalties"]
      )}, "mint-royalties": ${JSON.stringify(
        collection["mint-royalties"]
      )}, "fungible": coin, "token-list": ${JSON.stringify(tokenListHashes)}})`;
      try {
        var txResponse = await Kadena.sendTx(expression);
        console.log("response recieved from sendTx: ", txResponse);
        if (txResponse["requestKeys"]) {
          var nftCollection = await this.nftRepository.createNFTCollection({
            collection_id: collection!.id,
            request_key: txResponse.requestKeys[0],
            owner: collection!.creator,
            spec: collection!["token-list"][0]["spec"],
          });
          if (nftCollection != null) {
            Kadena.listenTx(txResponse.requestKeys[0]).then((d) => {
              console.log("data recieved from listen: ", d);
              this.nftRepository.updateStatus(
                nftCollection!.id,
                d.result.status
              );
              console.log(
                "Updated the status to: ",
                d.result.status,
                " for: ",
                nftCollection!.id
              );
            });
            res.status(200).json({ id: nftCollection!.id });
          } else {
            res
              .status(500)
              .json({ error: "unable to create the nft collection" });
          }
        } else {
          res
            .status(500)
            .json({ error: "couldn't find the request key in repsonse" });
        }
        return;
      } catch (e) {
        console.log("exception occurred while creating collection flow: ", e);
        res.status(500).json({ error: e });
        return;
      }
    }
  }
}
