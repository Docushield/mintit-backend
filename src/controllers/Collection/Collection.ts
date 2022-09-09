import { Request, Response } from 'express';
import { TypedRequestBody } from '../../express';
import { APILogger } from '../../logger/api';
import { AuthTokenRepository } from '../../repository/authtoken';
import { CollectionRepository } from '../../repository/collection';
import { Collection } from '../../models/collection';
import { TokenStatus } from '../../models/authtoken';
import { lang, crypto } from 'pact-lang-api';
import Pact from 'pact-lang-api';

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


    async addCollection(req: Request, res: Response) {
        let tokenU = req.headers['x-auth-token'];
        let d = await this.authTokenRespository.validateToken(tokenU, res);
        if(d != null){
          this.collectionRepository.createCollection(req.body);
          let tokenListHashes = req.body["token-list"].map(val => {
            return val.hash;
          });
          let expression = `(free.z74plc.init-nft-collection {"creator": ${JSON.stringify(req.body.creator)}, "description": ${JSON.stringify(req.body.description)}, "name" : ${JSON.stringify(req.body.name)}, "type": ${JSON.stringify(req.body.type)}, "provenance-hash": ${JSON.stringify(req.body["provenance-hash"])}, "mint-starts": (time ${JSON.stringify(req.body["mint-starts"])}), "premint-ends": (time ${JSON.stringify(req.body["premint-ends"])}), "premint-whitelist": ${JSON.stringify(req.body["premint-whitelist"])}, "size": ${req.body.size}, "mint-price": ${req.body["mint-price"].toFixed(2)}, "sale-royalties": ${JSON.stringify(req.body["sale-royalties"])}, "mint-royalties": ${JSON.stringify(req.body["mint-royalties"])}, "fungible": coin, "token-list": ${JSON.stringify(tokenListHashes)}})`;
          console.log(expression);
          let kp =  { publicKey: process.env.PUBLIC_KEY
                    , secretKey: process.env.SECRET_KEY
                    };
          let api_host = process.env.API_HOST || "https://api.testnet.chainweb.com";
          let networkId = process.env.NETWORK_ID || "testnet04";
          let chainId = process.env.CHAIN_ID || "1";
          let metaInfo = lang.mkMeta("k:" + kp.publicKey, chainId, 0.0001, 1000, Math.floor(new Date().getTime() / 1000), 28800);
          let cmd = [{ keyPairs: kp
                      , pactCode: expression
                      , meta: metaInfo
                      , networkId: networkId
                      }];

          Pact.fetch.send(cmd, api_host + "/chainweb/0.0/" + networkId + "/chain/" + chainId + "/pact")
              .then(d => { console.log("data receieve", d);
                          res.status(200).json({response: d});
                        }
                  )
              .catch(e => { console.log("error", e);
                            res.status(500).json({error: e});
                          }
                    );
       }
    }
}
