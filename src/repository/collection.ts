import { connect } from "../db";
import { APILogger } from "../logger/api";
import { Collection } from "../models/collection";
import { v4 as uuidv4 } from "uuid";

export class CollectionRepository {
  private logger: APILogger;
  private db: any = {};
  private collectionsRespository: any;

  constructor() {
    this.db = connect();
    this.collectionsRespository = this.db.sequelize.getRepository(Collection);
    this.logger = new APILogger();
  }

  async createCollection(collections: Collection) {
    let data: Collection | null = null;
    try {
      collections["createdAt"] = new Date().toISOString();
      collections["id"] = uuidv4();
      data = await this.collectionsRespository.create(collections);
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }
}
