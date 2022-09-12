import { connect } from "../db";
import { APILogger } from "../logger/api";
import { Collection } from "../models/collection";
import { v4 as uuidv4 } from "uuid";
import { Response } from "express";

export class CollectionRepository {
  private logger: APILogger;
  private db: any = {};
  private collectionsRespository: any;

  constructor() {
    this.db = connect();
    this.collectionsRespository = this.db.sequelize.getRepository(Collection);
    this.logger = new APILogger();
  }

  async createCollection(collection: Collection, res: Response) {
    try {
      if (
        !collection.creator ||
        !collection.description ||
        !collection.name ||
        !collection.type ||
        !collection["provenance-hash"] ||
        !collection["mint-starts"] ||
        !collection["premint-ends"] ||
        !collection["premint-whitelist"] ||
        !collection.size ||
        !collection["mint-price"] ||
        !collection["token-list"] ||
        !collection["mint-royalties"] ||
        !collection["sale-royalties"]
      ) {
        console.log("BAD_REQUEST, fields of collection can't be null");
        res.status(400).json({ error: "Missing mandatory fields." });
        return null;
      }
      collection["createdAt"] = new Date().toISOString();
      collection["id"] = uuidv4();
      return await this.collectionsRespository.create(collection);
    } catch (err) {
      this.logger.error("Error::" + err);
      res
        .status(500)
        .json({ error: "error occurred while creating collection: ", err });
      return;
    }
  }
}
