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
      this.logger.error("errors occurred while inserting nft:" + err.errors);
      res
        .status(500)
        .json({ error: "error occurred while creating nft collection: ", err });
      return;
    }
  }

  async updateMintedAtAndIndexWithOwner(
    hash: string,
    index: number,
    owner: string,
    mintedAt: number
  ) {
    let data: [NFT] | null = null;
    try {
      data = await this.nftRepository.update(
        { mintedAt: mintedAt, index: index, owner: owner },
        {
          where: {
            hash: hash,
          },
          returning: true,
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

  async findNFTByCollectionIdAndNullReveal(id: string) {
    let data: [NFT] | null = null;
    try {
      data = await this.nftRepository.findAll({
        where: {
          collectionId: id,
          revealedAt: null,
        },
      });
    } catch (err) {
      this.logger.error("Error::" + err);
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

  async updateRevealedAt(id: string, revealedAt: number) {
    let data = {};
    try {
      data = await this.nftRepository.update(
        { revealedAt: revealedAt },
        {
          where: {
            id: id,
          },
        }
      );
    } catch (err) {
      this.logger.error("Error while updating reveledAt: " + err);
    }
    return data;
  }
}
