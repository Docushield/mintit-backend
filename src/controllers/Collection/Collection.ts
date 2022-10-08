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
import * as SmartContract from "../../utils/smart_contract";
import * as NFT from "../../utils/nft";
import fs from "fs";
import * as s3 from "../../utils/s3";
import { sliceIntoChunks } from "../../utils/serialize";

const batch = parseInt(process.env.BATCH_SIZE || "1000") || 1000;

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
    const id = req.params["id"];
    const nft = await this.collectionRepository.findCollection(id);
    if (!nft) {
      res.status(400).json({ error: "No Collection found." });
      return;
    }
    res.status(200).json({ id: id, status: nft["status"] });
    return;
  }

  async getCollections(req: Request, res: Response) {
    const hash = req.query["hash"];
    if (typeof hash == "string") {
      const nft =
        await this.collectionRepository.findCollectionByProvenanceHash(hash);
      if (!nft) {
        res.status(400).json({ error: "No Collection found." });
        return;
      }
      nft["imageUrl"] = s3.buildUrl(nft["imageUrl"]);
      nft["bannerImageUrl"] = s3.buildUrl(nft["bannerImageUrl"]);
      nft["token-list"] = [];
      res.status(200).json(nft);
      return;
    }
    await this.getAllCollections(req, res);
    return;
  }

  async getAllCollections(req: Request, res: Response) {
    const nfts = (await this.collectionRepository.findAllCollections()) || [];
    nfts.map(function (nft) {
      nft["imageUrl"] = s3.buildUrl(nft["imageUrl"]);
      nft["bannerImageUrl"] = s3.buildUrl(nft["bannerImageUrl"]);
      nft["token-list"] = [];
    });
    res.status(200).json(nfts);
    return;
  }

  async getCollection(req: Request, res: Response) {
    const id = req.params["slug"];
    const nft = await this.collectionRepository.findCollectionBySlug(id);
    if (!nft) {
      res.status(400).json({ error: "No Collection found." });
      return;
    }
    nft["imageUrl"] = s3.buildUrl(nft["imageUrl"]);
    nft["bannerImageUrl"] = s3.buildUrl(nft["bannerImageUrl"]);
    nft["token-list"] = [];
    res.status(200).json(nft);
    return;
  }

  async getNFTTokens(req: Request, res: Response) {
    const id = req.params["slug"];
    const nft = await this.collectionRepository.findCollectionBySlug(id);
    if (!nft) {
      res.status(400).json({ error: "No Collection found." });
      return;
    }
    const nftTokens = await this.nftRepository.findNFTByCollectionId(nft.id);
    res.status(200).json(nftTokens);
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
    const tokens = (await this.nftRepository.findNFTByCollectionId(id)) || [];
    for (const token of tokens) {
      const txResponse = await SmartContract.revealNft(collection, token);

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

  async putCollection(req: Request, res: Response) {
    const tokenU = req.headers["x-auth-token"];
    const isAuthenticated = await this.authTokenRespository.validateToken(
      tokenU,
      res
    );
    if (!isAuthenticated) {
      return;
    }
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let bannerResp: string | null = null;
      let resp: string | null = null;
      if (files["collection_image"].length > 0) {
        const collectionImage = files["collection_image"][0];
        resp = await s3.uploadFileByPath(collectionImage);
      }
      if (files["collection_banner"].length > 0) {
        const bannerImage = files["collection_banner"][0];
        bannerResp = await s3.uploadFileByPath(bannerImage);
      }
      this.collectionRepository.updateCollectionImages(
        req.body.slug,
        resp,
        bannerResp,
        res
      );
    }
    res.status(200).json({ message: "Updated successfully." });
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
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const collectionImage = files["collection_image"][0];
      const bannerImage = files["collection_banner"][0];
      resp = await s3.uploadFileByPath(collectionImage);
      bannerResp = await s3.uploadFileByPath(bannerImage);
    }
    console.log("Response for uploading collection banner image: ", bannerResp);
    console.log("Response for uploading collection image: ", resp);
    const existingCollection =
      await this.collectionRepository.findCollectionBySlug(req.body.slug);
    let collection;
    if (existingCollection) {
      if (existingCollection.status === "failure") {
        const collectionE =
          await this.collectionRepository.updateWholeCollection(
            req.body,
            resp,
            bannerResp,
            existingCollection.id,
            res
          );
        collection = collectionE[1][0];
      } else {
        res
          .status(400)
          .json({ error: "collection already exists with same slug" });
        return;
      }
    } else {
      collection = await this.collectionRepository.createCollection(
        req.body,
        resp,
        bannerResp,
        res
      );
    }
    if (collection == null) return;
    const tokens = sliceIntoChunks(collection["token-list"], batch);
    collection["token-list"] = tokens[0];
    const expression = NFT.initNFTExpression(req.body, collection);
    const txResponse = await Kadena.sendTx(expression.expr, expression.env);
    if (!txResponse) {
      res
        .status(500)
        .json({ error: "error while sending transaction to blockchain" });
      return;
    }
    if (txResponse["requestKeys"]) {
      res.status(200).json({ slug: collection!.slug });
      for (const token of collection["token-list"]) {
        const nftCollection = await this.nftRepository.createNFT({
          collectionId: collection.id,
          owner: null,
          spec: token["spec"],
          hash: token.hash,
          contentUri: token["content_uri"],
        });
        console.log("here: ", nftCollection);
        if (!nftCollection) return;
      }
      // This will be happening async and try to init collection and update status
      // based on the response.rom blockchain
      const listenTxResponse = await Kadena.listenTx(txResponse.requestKeys[0]);
      if (!listenTxResponse) {
        res.status(500).json({
          error: "error while listening on transaction to blockchain",
        });
        return;
      }
      let resp = listenTxResponse;
      for (var i = 1; i < tokens.length; i++) {
        resp = this.sendAddTokenAndListen(collection, tokens[i]);
      }
      if (resp) {
        const updatedCollection = this.collectionRepository.updateStatus(
          collection.id,
          resp.result.status,
          resp.result.error ? resp.result.error.message : resp.result.data,
          res
        );
        if (!updatedCollection) return;

        console.log(
          "Updated the status to: ",
          listenTxResponse.result.status,
          " for: ",
          collection!.id
        );
      }

      return;
    } else {
      const updatedCollection = this.collectionRepository.updateStatus(
        collection.id,
        "failure",
        "not able to connect to chain",
        res
      );
      if (!updatedCollection) return;

      console.log(
        "Updated the status to: ",
        "failure",
        " for: ",
        collection!.id
      );
      res.status(500).json({ error: "unable to create the nft collection" });
    }
    return;
  }

  sendAddTokenAndListen = async (collection: Collection, tokens: [Token]) => {
    const expr = NFT.addNFTTokens(collection.name, tokens);
    const txResponse = await Kadena.sendTx(expr);
    if (txResponse["requestKeys"]) {
      for (const token of tokens) {
        const nftCollection = await this.nftRepository.createNFT({
          collectionId: collection.id,
          owner: null,
          spec: token["spec"],
          hash: token.hash,
          contentUri: token["content_uri"],
        });
      }
      const listenTxResponse = await Kadena.listenTx(txResponse.requestKeys[0]);
      return listenTxResponse;
    } else {
      console.log("Didn't found requestKeys in add tokens, hence retrying... ");
      this.sendAddTokenAndListen(collection, tokens);
    }
  };
}
