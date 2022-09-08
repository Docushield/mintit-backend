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
      console.log(token);
        return await this.authTokenRespository.findToken(token);
    }


    addCollection(req: Request, res: Response) {
        let tokenU = req.headers['x-auth-token'];
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
          this.findToken(token).then(d => {
            if(Object.keys(d).length == 0)
              res.status(400).send({error: "Token Not found"});
            else if (d["status"] == TokenStatus.DISABLED)
              res.status(400).send({error: "Token is Disabled"});
            else {
              let nftData = { ...req.body};
              nftData["fungible"] = Pact.coin;
              //nftData["fungible"] = {"refName": {"name": "coin",
                                                  //"namespace": null
                                                //},
                                      //"refSpec": [
                                                  //{
                                                    //"name": "fungible-v2",
                                                    //"namespace": null
                                                  //}
                                                //]
                                    //};
              console.log(nftData);
              this.collectionRepository.createCollection(req.body);
              let expression = lang.mkExp("free.z74plc.init-nft-collection"
                                          , nftData
                                            );
              let kp =  { publicKey: 'd46967fd03942c50f0d50edc9c35d018fe01166853dc79f62e2fdf72689e0484'
                          , secretKey: 'cb9132eea7c2f7bee3b4d272f5fd43a34b33198f6bd56637b2640ce2bf9bfa93'
                          };
              let api_host = process.env.API_HOST || "https://api.testnet.chainweb.com";
              let networkId = process.env.NETWORK_ID || "testnet04";
              let chainId = process.env.CHAIN_ID || "1";
              let metaInfo = lang.mkMeta("k:" + kp.publicKey, chainId, 0.0001, 100, Math.floor(new Date().getTime() / 1000), 28800);
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
          });
      }
  }
}
