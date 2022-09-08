import { connect } from "../db";
import { APILogger } from '../logger/api';
import { AuthToken, TokenStatus } from "../models/authtoken";
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';

export class AuthTokenRepository {

    private logger: APILogger;
    private db: any = {};
    private authTokenRespository: any;

    constructor() {
        this.db = connect();
        this.authTokenRespository = this.db.sequelize.getRepository(AuthToken);
        this.logger = new APILogger();
    }

    async validateToken(tokenU: string| string[]| undefined, res: Response){
        var token: string = "";
        if(tokenU){
          if (typeof tokenU == "string"){
            token = tokenU;
          } else {
            token = tokenU[0];
          }
        }
        if(token == ""){
          res.status(403).send({error: "auth token missing in headers"});
          return null;
        } else {
          let d = await this.findToken(token);
          console.log(d);
          if(Object.keys(d || {}).length == 0){
            res.status(400).send({error: "Token Not found in DB"});
            return null;
          } else if (d["status"] == TokenStatus.DISABLED){
            res.status(400).send({error: "Token is Disabled"});
            return null;
          }
          else return d;
        }
    }

    async createToken(authToken: {account: string, token: string}) {
        let data = {};
        try {
            authToken["createdAt"] = new Date().toISOString();
            authToken["id"] = uuidv4();
            authToken["status"] = TokenStatus.ACTIVE;
            data = await this.authTokenRespository.create(authToken);
        } catch(err) {
            this.logger.error('Error::' + err);
        }
        return data;
    }

    async findToken(authToken: string){
        let data = {};
        try {
            data = await this.authTokenRespository.findOne({
                where: {
                    token: authToken
                }
            });
        } catch(err) {
            this.logger.error('Error::' + err);
        }
        return data;
    }

    async deleteAuthToken(authToken: string) {
        let data = {};
        try {
            data = await this.authTokenRespository.update({ status: TokenStatus.DISABLED }, {
                where: {
                    token: authToken
                }
            });
        } catch(err) {
            this.logger.error('Error::' + err);
        }
        return data;
    }
}
