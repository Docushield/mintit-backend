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
      var missingFields = new Array();
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
      collection["createdAt"] = new Date().toISOString();
      collection["id"] = uuidv4();
      collection["status"] = "pending";
      return await this.collectionsRespository.create(collection);
    } catch (err) {
      this.logger.error("Error::" + err);
      res
        .status(500)
        .json({ error: "error occurred while creating collection: ", err });
      return;
    }
  }

  async updateStatus(id: string, status: string, res: Response) {
    let data = {};
    try {
      data = await this.collectionsRespository.update(
        { status: status },
        {
          where: {
            id: id,
          },
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
}
