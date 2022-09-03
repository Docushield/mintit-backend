import { connect } from "../db";
import { APILogger } from '../logger/api';
import { AuthToken } from "../models/authtoken";

export class AuthTokenRepository {

    private logger: APILogger;
    private db: any = {};
    private authTokenRespository: any;

    constructor() {
        this.db = connect();
        this.authTokenRespository = this.db.sequelize.getRepository(AuthToken);
        this.logger = new APILogger();
    }

    async createToken(authToken: {account: string, token: string}) {
        let data = {};
        try {
            authToken["createdAt"] = new Date().toISOString();
            data = await this.authTokenRespository.create(authToken);
        } catch(err) {
            this.logger.error('Error::' + err);
        }
        return data;
    }

    async deleteAuthToken(authTokenName: string) {
        let data = {};
        try {
            data = await this.authTokenRespository.destroy({
                where: {
                    name: authTokenName
                }
            });
        } catch(err) {
            this.logger.error('Error::' + err);
        }
        return data;
    }

}
