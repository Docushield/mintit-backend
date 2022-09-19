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
import fs from "fs";
import * as s3 from "../../utils/s3";

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

  async getCollection(req: Request, res: Response) {
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
    res.status(200).json(nft);
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
    let requestKeys = [];
    for (const token of collection["token-list"]) {
      const expression = NFT.revealNFTExpression(collection, token);
      const cap = Pact.lang.mkCap(
        "Marmalade mint",
        "Capability to mint the token on Marmalade",
        "marmalade.ledger.MINT",
        ["t:" + token.hash, collection.creator, 1.0]
      );
      const txResponse = await Kadena.sendTx(expression, cap);
      if (txResponse == null) {
        console.log("error occurred while sending tx for token: ", token.hash);
      } else {
        console.log(txResponse["requestKeys"]);
        requestKeys = requestKeys.concat(txResponse["requestKeys"]);
      }
    }
    console.log("request keys: ", requestKeys);
    res.status(200).json({ message: "Reveal of tokens succeeded." });
    for (const requestKey of requestKeys) {
      const listenTxResponse = await Kadena.listenTx(requestKey);
      //if (!listenTxResponse) {
      //res.status(500).json({
      //error: "error while listening on transaction to blockchain",
      //});
      //allFinished = false;
      //break;
      //}
    }
    return;
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
    let resp = "NO_URL";
    let bannerResp = resp;
    if (req.files) {
      const collectionImage = req.files["collection_image"][0];
      const bannerImage = req.files["collection_banner"][0];
      const imageData = fs.readFileSync(collectionImage.path);
      resp = await s3.uploadFile({
        key: collectionImage.originalname,
        content: imageData,
        type: collectionImage.mimetype,
      });
      const bannerData = fs.readFileSync(bannerImage.path);
      bannerResp = await s3.uploadFile({
        key: bannerImage.originalname,
        content: imageData,
        type: bannerImage.mimetype,
      });
    }
    console.log("Response for uploading collection banner image: ", bannerResp);
    console.log("Response for uploading collection image: ", resp);
    const collection = await this.collectionRepository.createCollection(
      req.body,
      resp,
      bannerResp,
      res
    );
    if (collection == null) return;
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
