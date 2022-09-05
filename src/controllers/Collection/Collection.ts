import { Request, Response } from 'express';
import { TypedRequestBody } from '../../express';
import { APILogger } from '../../logger/api';
import { AuthTokenRepository } from '../../repository/authtoken';
import { CollectionRepository } from '../../repository/collection';
import { Collection } from '../../models/collection';
import { TokenStatus } from '../../models/authtoken';
import { lang, crypto, fetch } from 'pact-lang-api';

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
      console.log(token);
        return await this.authTokenRespository.findToken(token);
    }


    addCollection(req: Request, res: Response) {
        const tokenU = req.headers['x-auth-token'];
        var token: string = "";
        if(tokenU){
          if (typeof tokenU == "string"){
            token = tokenU;
          } else {
            token = tokenU[0];
          }
        }
        if(token == ""){
          res.status(403).json({message: 'auth-token missing'});
        } else {
          this.findToken(token).then(d => {if(Object.keys(d).length == 0)
                                                                  res.status(400).send({error: "Token Not found"});
                                                                else if (d["status"] == TokenStatus.DISABLED)
                                                                  res.status(400).send({error: "Token is Disabled"});
                                                                else {
                                                                    this.collectionRepository.createCollection(req.body);
                                                                    const expression = lang.mkExp("mintit-market.create-nft-collection"
                                                                                                      , req.body.creator
                                                                                                      , req.body.description
                                                                                                      , req.body.name
                                                                                                      , req.body.type
                                                                                                      , req.body["provenance-hash"]
                                                                                                      , req.body["mint-starts"]
                                                                                                      , req.body["premint-ends"]
                                                                                                      , req.body["premint-whitelist"]
                                                                                                      , req.body["max-size"]
                                                                                                      , req.body["mint-price"]
                                                                                                      , req.body["init-price"]
                                                                                                      , req.body["mint-royalties"]
                                                                                                      , req.body["sale-royalties"]
                                                                                                      , req.body["init-royalties"]
                                                                                                      )
                                                                    const kp = {publicKey: 'd46967fd03942c50f0d50edc9c35d018fe01166853dc79f62e2fdf72689e0484', secretKey: 'cb9132eea7c2f7bee3b4d272f5fd43a34b33198f6bd56637b2640ce2bf9bfa93'};
                                                                    //const signedExp = crypto.sign(expression, kp);
                                                                    const cmd = { keyPairs: kp
                                                                                , pactCode: expression
                                                                                };

                                                                    fetch.local(cmd, "http://localhost:9999").then(d => console.log("data receieve", d)).catch(e => console.log("error", e));
                                                                    res.status(200).json({});
                                                                }
                                                              });
      }
  }
}
