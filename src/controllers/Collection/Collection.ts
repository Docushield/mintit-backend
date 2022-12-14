import { Request, Response } from "express";
import { TypedRequestBody } from "../../express";
import { APILogger } from "../../logger/api";
import { AuthTokenRepository } from "../../repository/authtoken";
import { CollectionRepository } from "../../repository/collection";
import { AdminRepository } from "../../repository/admin";
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
  private adminRepository: AdminRepository;
  private nftRepository: NFTRepository;
  private logger: APILogger;

  constructor() {
    this.authTokenRespository = new AuthTokenRepository();
    this.collectionRepository = new CollectionRepository();
    this.adminRepository = new AdminRepository();
    this.nftRepository = new NFTRepository();
    this.logger = new APILogger();
  }

  async getStatus(req: Request, res: Response) {
    const status = await this.adminRepository.getStatus();
    if (!status) {
      res.status(400).json({ error: "No data found." });
      return;
    }
    res.status(200).json({ minting: status["minting"], collection: status['collection'] });
    return;
  }

  updateStatus(req: TypedRequestBody<{
    minting: string,
    collection: string,
    token: string
  }>, res: Response) {
    const { minting, collection, token} = req.body;
    this.adminRepository.updateStatus(minting,collection,token,res);
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
    const all = req.query["count"];
    if (all == "true") {
      const response = await this.collectionRepository.getCountOfCollections();
      return res.status(200).json({ count: response });
    }
    await this.getAllCollections(req, res);
    return;
  }

  async getAllCollections(req: Request, res: Response) {
    let limit = 20;
    let offset = 0;
    if (typeof req.query["limit"] == "string")
      limit = parseInt(req.query["limit"]) || 20;
    if (typeof req.query["offset"] == "string")
      offset = parseInt(req.query["offset"]) || 0;
    const nfts =
      (await this.collectionRepository.findAllCollections(limit, offset)) || [];
    nfts.map(function (nft) {
      nft["imageUrl"] = s3.buildUrl(nft["imageUrl"]);
      nft["bannerImageUrl"] = s3.buildUrl(nft["bannerImageUrl"]);
      nft["token-list"] = [];
    });
    res.status(200).json(nfts);
    return;
  }

  async countProfileTokens(req: Request, res: Response) {
    const account = req.body.account;
    const slug = req.body.slug;
    const nft = await this.collectionRepository.findCollectionBySlug(slug);
    if (!nft) {
      res.status(400).json({ error: "No Collection found." });
      return;
    }
    const nftTokens = await this.nftRepository.countTokenByOwnerInCollection(nft.id,account);
    res.status(200).json(nftTokens);
    return;
  }

  async getProfileCollection(req: Request, res: Response) {
    const account = req.params["account"];
    const collections =
      (await this.collectionRepository.findCollectionByAccount(account)) || [];
    collections.map(function (collection) {
      collection["imageUrl"] = s3.buildUrl(collection["imageUrl"]);
      collection["bannerImageUrl"] = s3.buildUrl(collection["bannerImageUrl"]);
      collection["token-list"] = [];
    });
    const nfts = await this.nftRepository.findNFTByAccount(account);
    res.status(200).json({ collections: collections, nfts: nfts });
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

  async getNFTHashes(req: Request, res: Response) {
    const id = req.params["slug"];
    const nft = await this.collectionRepository.findCollectionBySlug(id);
    if (!nft) {
      res.status(400).json({ error: "No Collection found." });
      return;
    }
    const nftHashes = nft["token-list"].map((t) => t.hash);
    res.status(200).json(nftHashes);
    return;
  }

  async getMintedNFTTokens(req: Request, res: Response) {
    let limit = 10;
    let offset = 0;
    if (typeof req.query["limit"] == "string")
      limit = parseInt(req.query["limit"]) || 10;
    if (typeof req.query["offset"] == "string")
      offset = parseInt(req.query["offset"]) || 10;
    const nfts = await this.nftRepository.findAllMintedNFTs(offset, limit);
    res.status(200).json(nfts);
    return;
  }

  async getNFTTokenByHash(req: Request, res: Response) {
    const slug = req.params["slug"];
    const hash = req.params["hash"];
    const collection = await this.collectionRepository.findCollectionBySlug(
      slug
    );
    if (!collection) {
      res.status(400).json({ error: "No Collection found." });
      return;
    }
    const token = await this.nftRepository.findNFTByCollectionIdAndHash(
      collection.id,
      hash
    );
    if (!token) {
      res.status(400).json({ error: "No token found." });
      return;
    }
    res.status(200).json(token);
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
        const image_name = `image-${req.body.slug}`
        resp = await s3.uploadFileByPath(collectionImage,image_name);
      }
      if (files["collection_banner"].length > 0) {
        const bannerImage = files["collection_banner"][0];
        const banner_name = `banner-${req.body.slug}`
        bannerResp = await s3.uploadFileByPath(bannerImage,banner_name);
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
      const image_name = `image-${req.body.slug}`
      const bannerImage = files["collection_banner"][0];
      const banner_name = `banner-${req.body.slug}`
      resp = await s3.uploadFileByPath(collectionImage,image_name);
      bannerResp = await s3.uploadFileByPath(bannerImage,banner_name);
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
        res,
        req.body.minting_limit
      );
    }
    if (collection == null) return;
    const tokens = sliceIntoChunks(collection["token-list"], batch);
    console.log("sliced the tokens into " + tokens.length + " batches");
    collection["token-list"] = tokens[0];
    console.log(
      "creating the collection with " + tokens[0].length + " tokens."
    );
    const expression = NFT.initNFTExpression(req.body, collection);
    const txResponse = await Kadena.sendTx(expression.expr, expression.env);
    if (
      !txResponse ||
      (txResponse.status && txResponse.status == "timeout") ||
      !txResponse.requestKeys
    ) {
      res.status(500).json({
        error: "error while sending transaction to blockchain: ",
      });
      return;
    }
    if (txResponse["requestKeys"]) {
      await this.collectionRepository.updateRequestKey(
        collection.id,
        txResponse["requestKeys"][0]
      );
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
        if (!nftCollection) {
          const updatedCollection =
            await this.collectionRepository.updateStatus(
              collection.id,
              "failure",
              "unable to create nft with hash: " + token.hash
            );
          console.log(
            "Updated the status to: ",
            "failure",
            " for: ",
            collection.id
          );
          return;
        }
      }
      // This will be happening async and try to init collection and update status
      // based on the response.rom blockchain
      const listenTxResponse = await Kadena.listenTx(txResponse.requestKeys[0]);
      let resp = listenTxResponse;
      if (listenTxResponse.result.error) {
        const updatedCollection = await this.collectionRepository.updateStatus(
          collection.id,
          resp.result.status,
          resp.result.error.message
        );
        if (!updatedCollection) return;

        console.log(
          "Updated the status to: ",
          listenTxResponse.result.status,
          " for: ",
          collection!.id
        );
        return;
      }
      for (var i = 1; i < tokens.length; i++) {
        resp = await this.sendAddTokenAndListen(collection, tokens[i]);
      }
      console.log(
        "final response after successfully init the collection: ",
        resp
      );
      if (resp && resp.result) {
        const updatedCollection = await this.collectionRepository.updateStatus(
          collection.id,
          resp.result.status,
          resp.result.error ? resp.result.error.message : "true"
        );
        if (!updatedCollection) return;

        console.log(
          "Updated the status to: ",
          listenTxResponse.result.status,
          " for: ",
          collection.id
        );
      } else {
        const updatedCollection = await this.collectionRepository.updateStatus(
          collection.id,
          "failure",
          "unable to init nft on chain"
        );
        console.log(
          "Updated the status to: ",
          "failure",
          " for: ",
          collection.id
        );
      }
      return;
    } else {
      const updatedCollection = await this.collectionRepository.updateStatus(
        collection.id,
        "failure",
        "not able to connect to chain"
      );
      if (!updatedCollection) return;

      console.log(
        "Updated the status to: ",
        "failure",
        " for: ",
        collection.id
      );
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
      return this.sendAddTokenAndListen(collection, tokens);
    }
  };

  chunkAndAdd = async (req: Request, res: Response) => {
    const collectionName = req.params["name"];
    const collection = await this.collectionRepository.findCollectionByName(
      collectionName
    );
    if (!collection) {
      console.log("collection not found in DB.");
      res.status(400).json({ error: "No collection found in DB" });
      return;
    }
    const tokens = sliceIntoChunks(collection["token-list"], batch);
    console.log("sliced the tokens into " + tokens.length + " batches");
    let resp;
    for (var i = 0; i < tokens.length; i++) {
      resp = await this.sendAddTokenAndListenDummy(collection, tokens[i]);
      console.log("Response recieved for batch: " + i + " is: " + resp);
    }
    console.log(
      "final response after successfully init the collection: ",
      resp
    );
    res.status(200).json({ message: "Added batches for collection." });
  };

  sendAddTokenAndListenDummy = async (
    collection: Collection,
    tokens: [Token]
  ) => {
    const expr = NFT.addNFTTokens(collection.name, tokens);
    const txResponse = await Kadena.sendTx(expr);
    if (txResponse["requestKeys"]) {
      const listenTxResponse = await Kadena.listenTx(txResponse.requestKeys[0]);
      return listenTxResponse;
    } else {
      console.log("Didn't found requestKeys in add tokens, hence retrying... ");
      return this.sendAddTokenAndListenDummy(collection, tokens);
    }
  };
}
