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
      [
        "creator",
        "description",
        "name",
        "type",
        "provenance-hash",
        "mint-starts",
        "premint-ends",
        "premint-whitelist",
        "size",
        "mint-price",
        "token-list",
        "mint-royalties",
        "sale-royalties",
      ].forEach((field) => {
        if (!collection[field]) {
          res.status(400).json({ error: `Missing mandatory field ${field}` });
          return null;
        }
      });
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
