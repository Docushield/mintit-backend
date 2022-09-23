import { connect } from "../db";
import { APILogger } from "../logger/api";
import { NFT } from "../models/nft";
import { v4 as uuidv4 } from "uuid";
import { Response } from "express";
import { Sequelize } from "sequelize";

export class NFTRepository {
  private logger: APILogger;
  private db: any = {};
  private nftRepository: any;

  constructor() {
    this.db = connect();
    this.nftRepository = this.db.sequelize.getRepository(NFT);
    this.logger = new APILogger();
  }

  async createNFT(
    nft: {
      collectionId: string;
      owner: string | null;
      spec: object;
      hash: string;
      contentUri: object;
    },
    res: Response
  ) {
    try {
      nft["createdAt"] = new Date().toISOString();
      nft["id"] = uuidv4();
      nft["status"] = "PENDING";
      return await this.nftRepository.create(nft);
    } catch (err) {
      this.logger.error("Error::" + err);
      res
        .status(500)
        .json({ error: "error occurred while creating nft collection: ", err });
      return;
    }
  }

  async updateMintedAtAndIndex(hash: string, index: number, mintedAt: number) {
    let data = {};
    try {
      data = await this.nftRepository.update(
        { mintedAt: mintedAt, index: index },
        {
          where: {
            hash: hash,
          },
        }
      );
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }

  async updateStatus(id: string, status: string, res: Response) {
    let data = {};
    try {
      data = await this.nftRepository.update(
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
        error: "error occurred while updating nft collection status: ",
        err,
      });
    }
    return data;
  }

  async findNFTByCollectionId(id: string) {
    let data: [NFT] | null = null;
    try {
      data = await this.nftRepository.findAll({
        where: {
          collectionId: id,
        },
      });
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }

  async findLatestMintAt() {
    let data = 0;
    try {
      data = await this.nftRepository.findAll({
        attributes: [Sequelize.fn("MAX", Sequelize.col("mintedAt"))],
      });
      if (isNaN(data)) {
        data = 0;
      }
    } catch (err) {
      this.logger.error(
        "Error occurred while finding latest mint block height: " + err
      );
    }
    return data;
  }
}
