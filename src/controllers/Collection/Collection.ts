import { Request, Response } from 'express';
import { TypedRequestBody } from '../../express';
import { APILogger } from '../../logger/api';
import { AuthTokenRepository } from '../../repository/authtoken';
import { CollectionRepository } from '../../repository/collection';
import { Collection } from '../../models/collection';

export class CollectionController {
    private authTokenRespository: AuthTokenRepository;
    private collectionRepository: CollectionRepository;
    private logger: APILogger;

    constructor() {
        this.authTokenRespository = new AuthTokenRepository();
        this.collectionRepository = new CollectionRepository();
        this.logger = new APILogger()
    }


    addCollection(req: Request, res: Response) {
        console.log(req.headers['X-Auth-Token']);
        // FIXME: add validation on the above header
        this.collectionRepository.createCollection(req.body);
        // FIXME: Convert the JSON to a smart contract call (free.mintit-policy.init-nft-collection ...) and sign using app private keys
        return res.status(200).json({});
    }
}
