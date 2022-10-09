import { connect } from "../db";
import { APILogger } from "../logger/api";
import { NFT } from "../models/nft";
import { v4 as uuidv4 } from "uuid";
import { Response } from "express";
import { Sequelize, Op } from "sequelize";

export class NFTRepository {
  private logger: APILogger;
  private db: any = {};
  private nftRepository: any;

  constructor() {
    this.db = connect();
    this.nftRepository = this.db.sequelize.getRepository(NFT);
    this.logger = new APILogger();
  }

  async createNFT(nft: {
    collectionId: string;
    owner: string | null;
    spec: object;
    hash: string;
    contentUri: object;
  }) {
    try {
      nft["createdAt"] = new Date().toISOString();
      nft["id"] = uuidv4();
      nft["status"] = "PENDING";
      return await this.nftRepository.create(nft);
    } catch (err) {
      this.logger.error(
        "errors occurred while inserting nft:" + JSON.stringify(err.errors)
      );
      return;
    }
  }

  async updateMintedAtAndIndexWithOwner(
    hash: string,
    index: number,
    owner: string,
    mintedAt: number
  ) {
    try {
      const data = await this.nftRepository.update(
        { mintedAt: mintedAt, index: index, owner: owner },
        {
          where: {
            hash: hash,
          },
          returning: true,
        }
      );
      return data;
    } catch (err) {
      this.logger.error("Error::" + JSON.stringify(err));
      return null;
    }
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
          returning: true,
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
          mintedAt: {
            [Op.ne]: null,
          },
        },
      });
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }

  async findNFTByCollectionIdAndHash(id: string, hash: string) {
    let data: NFT | null = null;
    try {
      data = await this.nftRepository.findOne({
        where: {
          collectionId: id,
          hash: hash,
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
          returning: true,
        }
      );
    } catch (err) {
      this.logger.error("Error while updating reveledAt: " + err);
    }
    return data;
  }
  async updateNameAndTokenId(name: string, tokenId: string, hash: string) {
    try {
      const data = await this.nftRepository.update(
        { name: name, "marmalade-token-id": tokenId },
        {
          where: {
            hash: hash,
          },
          returning: true,
        }
      );
      return data;
    } catch (err) {
      this.logger.error("Error::" + JSON.stringify(err));
      return null;
    }
  }
}
