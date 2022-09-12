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
import * as NFT from "../../utils/nft";

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
      return;
    }
    let collection = await this.collectionRepository.createCollection(
      req.body,
      res
    );
    if (!collection) return;
    let expression = NFT.initNFTExpression(req, collection);
    try {
      var txResponse = await Kadena.sendTx(expression);
      console.log("response recieved from sendTx: ", txResponse);
      if (txResponse["requestKeys"]) {
        var nftCollection = await this.nftRepository.createNFTCollection(
          {
            collection_id: collection.id,
            request_key: txResponse.requestKeys[0],
            owner: collection.creator,
            spec: collection["token-list"][0]["spec"],
          },
          res
        );
        if (!nftCollection) return;
        var listenTxResponse = await Kadena.listenTx(txResponse.requestKeys[0]);
        console.log("data recieved from listen: ", listenTxResponse);
        var updatedNFT = this.nftRepository.updateStatus(
          nftCollection.id,
          listenTxResponse.result.status,
          res
        );
        if (!updatedNFT) return;
        console.log(
          "Updated the status to: ",
          listenTxResponse.result.status,
          " for: ",
          nftCollection!.id
        );
        res.status(200).json({ id: nftCollection!.id });
      } else {
        res.status(500).json({ error: "unable to create the nft collection" });
      }
      return;
    } catch (e) {
      console.log("exception occurred while creating collection flow: ", e);
      res.status(500).json({ error: e });
      return;
    }
  }
}
