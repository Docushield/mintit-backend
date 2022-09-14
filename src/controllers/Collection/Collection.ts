import { Request, Response } from "express";
import { TypedRequestBody } from "../../express";
import { APILogger } from "../../logger/api";
import { AuthTokenRepository } from "../../repository/authtoken";
import { CollectionRepository } from "../../repository/collection";
import { NFTRepository } from "../../repository/nft";
import { Collection, Token } from "../../models/collection";
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

  async getCollectionStatus(req: Request, res: Response) {
    const tokenU = req.headers["x-auth-token"];
    const isAuthenticated = await this.authTokenRespository.validateToken(
      tokenU,
      res
    );
    if (!isAuthenticated) {
      return;
    }
    const id = req.params["id"];
    const nft = await this.collectionRepository.findCollection(id);
    if (!nft) {
      res.status(400).json({ error: "No Collection found." });
      return;
    }
    res.status(200).json({ id: id, status: nft["status"] });
    return;
  }

  async revealNFT(req: Request, res: Response) {
    const tokenU = req.headers["x-auth-token"];
    const isAuthenticated = await this.authTokenRespository.validateToken(
      tokenU,
      res
    );
    if (!isAuthenticated) {
      return;
    }
    const id = req.params["id"];
    const collection = await this.collectionRepository.findCollection(id);
    if (!collection) {
      res.status(400).json({ error: "No Collection found." });
      return;
    }
    for (const token of collection["token-list"]) {
      const expression = NFT.revealNFTExpression(collection, token);
      const txResponse = await Kadena.sendTx(expression);
      if (!txResponse) {
        res.status(500).json({
          error: "error while sending reveal transaction to blockchain",
        });
        return;
      }
      if (txResponse["requestKeys"]) {
      } else {
        res.status(500).json({ error: "unable to reveal the nft collection" });
      }
    }
    res.status(200);
  }

  async addCollection(req: Request, res: Response) {
    const tokenU = req.headers["x-auth-token"];
    const isAuthenticated = await this.authTokenRespository.validateToken(
      tokenU,
      res
    );
    if (!isAuthenticated) {
      return;
    }
    const collection = await this.collectionRepository.createCollection(
      req.body,
      res
    );
    if (!collection) return;
    const expression = NFT.initNFTExpression(req, collection);
    const txResponse = await Kadena.sendTx(expression);
    if (!txResponse) {
      res
        .status(500)
        .json({ error: "error while sending transaction to blockchain" });
      return;
    }
    if (txResponse["requestKeys"]) {
      for (const token of collection["token-list"]) {
        const nftCollection = await this.nftRepository.createNFTCollection(
          {
            collection_id: collection.id,
            request_key: txResponse.requestKeys[0],
            owner: collection.creator,
            spec: token["spec"],
          },
          res
        );
        if (!nftCollection) return;
      }
      res.status(200).json({ id: collection!.id });
      // This will be happening async and try to init collection and update status
      // based on the response.rom blockchain
      const listenTxResponse = await Kadena.listenTx(txResponse.requestKeys[0]);
      if (!listenTxResponse) {
        res.status(500).json({
          error: "error while listening on transaction to blockchain",
        });
        return;
      }

      const updatedCollection = this.collectionRepository.updateStatus(
        collection.id,
        listenTxResponse.result.status,
        res
      );
      if (!updatedCollection) return;

      console.log(
        "Updated the status to: ",
        listenTxResponse.result.status,
        " for: ",
        collection!.id
      );
      return;
    } else {
      res.status(500).json({ error: "unable to create the nft collection" });
    }
    return;
  }
}
