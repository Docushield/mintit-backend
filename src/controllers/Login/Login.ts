import { Request, Response } from 'express';
import { TypedRequestBody } from '../../express';
import { APILogger } from '../../logger/api';
import { AuthTokenRepository } from '../../repository/authtoken';
import { AuthToken } from '../../models/authtoken';

export class LoginController {
  private authTokenRespository: AuthTokenRepository;
    private logger: APILogger;

    constructor() {
        this.authTokenRespository = new AuthTokenRepository();
        this.logger = new APILogger()
    }

    async createAuthToken(authToken: AuthToken) {
        this.logger.info('Controller: createAuthToken', authToken);
        return await this.authTokenRespository.createToken(authToken);
    }

    login(req: TypedRequestBody<{ account: string, command: {cmd: string}, signature: string }>, res: Response) {
        // FIXME: Add logic for validation and return valid token.
        return res.status(200).json({ "token": "ABCD" });
    }

    logout(req: Request, res: Response) {
        console.log(req.headers['X-Auth-Token']);
        // FIXME: add validation on the above header
        return res.status(200).json({});
    }
}
