import { connect } from "../db";
import { APILogger } from '../logger/api';
import { NFT } from "../models/nft";
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';

export class NFTRepository {

    private logger: APILogger;
    private db: any = {};
    private nftRepository: any;

    constructor() {
        this.db = connect();
        this.nftRepository = this.db.sequelize.getRepository(NFT);
        this.logger = new APILogger();
    }

    async createNFT(nft: {collection_id: string, request_key: string, owner: string, spec: object}) {
        let data: NFT | null = null;
        try {
            nft["createdAt"] = new Date().toISOString();
            nft["id"] = uuidv4();
            nft["status"] = "PENDING";
            data = await this.nftRepository.create(nft);
        } catch(err) {
            this.logger.error('Error::' + err);
        }
        return data;
    }

    async updateStatus(id: string, status: string) {
        let data = {};
        try {
            data = await this.nftRepository.update({ status: status }, {
                where: {
                  id: id
                }
            });
        } catch(err) {
            this.logger.error('Error::' + err);
        }
        return data;
    }
}
