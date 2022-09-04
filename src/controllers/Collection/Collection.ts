import { Request, Response } from 'express';
import { TypedRequestBody } from '../../express';
import { APILogger } from '../../logger/api';
import { AuthTokenRepository } from '../../repository/authtoken';
import { CollectionRepository } from '../../repository/collection';
import { Collection } from '../../models/collection';
import { TokenStatus } from '../../models/authtoken';

export class CollectionController {
    private authTokenRespository: AuthTokenRepository;
    private collectionRepository: CollectionRepository;
    private logger: APILogger;

    constructor() {
        this.authTokenRespository = new AuthTokenRepository();
        this.collectionRepository = new CollectionRepository();
        this.logger = new APILogger()
    }

    async findToken(token: string) {
        return await this.authTokenRespository.findToken(token);
    }


    addCollection(req: Request, res: Response) {
        console.log(req.headers['x-auth-token']);
        // FIXME: add validation on the above header
        this.findToken(req.header['x-auth-token']).then(d => {if(Object.keys(d).length == 0)
                                                                res.status(400).send({error: "Token Not found"});
                                                              else if (d["status"] == TokenStatus.DISABLED)
                                                                res.status(400).send({error: "Token is Disabled"});
                                                              else {
                                                                  this.collectionRepository.createCollection(req.body);
                                                                  // FIXME: Convert the JSON to a smart contract call (free.mintit-policy.init-nft-collection ...) and sign using app private keys
                                                                  res.status(200).json({});
                                                              }
                                                             });
    }
}
