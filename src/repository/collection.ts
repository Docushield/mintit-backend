import { connect } from "../db";
import { APILogger } from "../logger/api";
import { Collection } from "../models/collection";
import { v4 as uuidv4 } from "uuid";
import { Response } from "express";
import { Op } from "sequelize";

const restructureFields = (collection: Collection) => {
  if (typeof collection["mint-royalties"] === "string") {
    collection["mint-royalties"] = JSON.parse(collection["mint-royalties"]);
  }
  if (typeof collection["sale-royalties"] === "string") {
    collection["sale-royalties"] = JSON.parse(collection["sale-royalties"]);
  }
  if (typeof collection["token-list"] === "string") {
    collection["token-list"] = JSON.parse(collection["token-list"]);
  }
  if (typeof collection["premint-whitelist"] === "string") {
    collection["premint-whitelist"] = JSON.parse(
      collection["premint-whitelist"]
    );
  }
  return collection;
};

export class CollectionRepository {
  private logger: APILogger;
  private db: any = {};
  private collectionsRespository: any;

  constructor() {
    this.db = connect();
    this.collectionsRespository = this.db.sequelize.getRepository(Collection);
    this.logger = new APILogger();
  }

  async createCollection(
    collection: Collection,
    imageUrl: string,
    bannerImageUrl: string,
    res: Response
  ) {
    try {
      var missingFields = new Array();
      [
        "creator",
        "description",
        "name",
        "type",
        "provenance-hash",
        "mint-starts",
        "premint-ends",
        "reveal-at",
        "premint-whitelist",
        "size",
        "mint-price",
        "token-list",
        "mint-royalties",
        "sale-royalties",
      ].forEach((field) => {
        if (!collection[field]) {
          missingFields.push(field);
          //res.status(400).json({ error: `Missing mandatory field ${field}` });
          //return null;
        }
      });
      if (missingFields.length > 0) {
        res.status(400).json({
          error: `Missing mandatory fields: ${JSON.stringify(missingFields)}`,
        });
        return;
      }
      collection = restructureFields(collection);
      collection["createdAt"] = new Date().toISOString();
      collection["id"] = uuidv4();
      collection["status"] = "pending";
      collection["imageUrl"] = imageUrl;
      collection["bannerImageUrl"] = bannerImageUrl;
      collection["numMinted"] = 0;
      if (!collection["premint-price"])
        collection["premint-price"] = collection["mint-price"];
      return await this.collectionsRespository.create(collection);
    } catch (err) {
      this.logger.error("Error::" + err);
      res
        .status(500)
        .json({ error: "error occurred while creating collection: ", err });
      return;
    }
  }

  async updateCollectionImages(
    slug: string,
    imageUrl: string | null,
    bannerImageUrl: string | null,
    res: Response
  ) {
    let data = {};
    let imageObj,
      bannerImageObj = {};
    if (imageUrl != null) imageObj = { imageUrl: imageUrl };
    if (bannerImageUrl != null)
      bannerImageObj = { bannerImageUrl: bannerImageUrl };
    try {
      data = await this.collectionsRespository.update(
        { ...imageObj, ...bannerImageObj },
        {
          where: {
            slug: slug,
          },
          returning: true,
        }
      );
    } catch (err) {
      this.logger.error("Error::" + err);
      res.status(500).json({
        error: "error occurred while updating collection status: ",
        err,
      });
    }
    return data;
  }

  async updateStatus(id: string, status: string, statusMessage: string) {
    let data = {};
    try {
      data = await this.collectionsRespository.update(
        { status: status, statusMessage: statusMessage },
        {
          where: {
            id: id,
          },
          returning: true,
        }
      );
    } catch (err) {
      this.logger.error(
        "error occurred while updating status: " + JSON.stringify(err.errors)
      );
    }
    return data;
  }

  async findCollection(id: string) {
    let data: Collection | null = null;
    try {
      data = await this.collectionsRespository.findOne({
        where: {
          id: id,
        },
      });
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }

  async findCollectionByAccount(account: string) {
    let data: [Collection] | null = null;
    try {
      data = await this.collectionsRespository.findAll({
        where: {
          creator: account,
        },
      });
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }

  async findCollectionBySlug(slug: string) {
    let data: Collection | null = null;
    try {
      data = await this.collectionsRespository.findOne({
        where: {
          slug: slug,
        },
      });
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }

  async findCollectionByName(name: string) {
    let data: Collection | null = null;
    try {
      data = await this.collectionsRespository.findOne({
        where: {
          name: name,
        },
      });
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }
  async findCollectionByProvenanceHash(hash: string) {
    let data: Collection | null = null;
    try {
      data = await this.collectionsRespository.findOne({
        where: {
          "provenance-hash": hash,
        },
      });
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }

  async findCollectionLessThanReveal(revealAt: string) {
    let data: [Collection] | null = null;
    try {
      data = await this.collectionsRespository.findAll({
        where: {
          "reveal-at": {
            [Op.lte]: revealAt,
          },
        },
      });
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }

  async findAllCollections() {
    let data: [Collection] | null = null;
    try {
      data = await this.collectionsRespository.findAll({});
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }

  async updateNumMinted(id: string, numMinted: number) {
    let data = {};
    try {
      data = await this.collectionsRespository.update(
        { numMinted: numMinted },
        {
          where: {
            id: id,
          },
          returning: true,
        }
      );
    } catch (err) {
      this.logger.error(
        "error occurred while updating num minted: " + err.errors
      );
    }
    return data;
  }

  async updateWholeCollection(
    collection: Collection,
    imageUrl: string,
    bannerImageUrl: string,
    id: string,
    res: Response
  ) {
    let data = {};
    collection = restructureFields(collection);
    collection["status"] = "pending";
    collection["imageUrl"] = imageUrl;
    collection["bannerImageUrl"] = bannerImageUrl;
    try {
      data = await this.collectionsRespository.update(collection, {
        where: {
          id: id,
        },
        returning: true,
      });
    } catch (err) {
      this.logger.error(
        "error occurred while updating whole collection: " +
          JSON.stringify(err.errors)
      );
      res
        .status(500)
        .json({ error: "error occurred while updating collection: ", err });
    }
    return data;
  }

  async updateRequestKey(id: string, requestKey: string) {
    let data = {};
    try {
      data = await this.collectionsRespository.update(
        { requestKey: requestKey },
        {
          where: {
            id: id,
          },
          returning: true,
        }
      );
    } catch (err) {
      this.logger.error(
        "error occurred while updating requestKey: " +
          requestKey +
          " for collectionid: " +
          id +
          " with error: " +
          JSON.stringify(err.errors) || err
      );
    }
    return data;
  }
}
