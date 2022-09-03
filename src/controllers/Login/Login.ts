import { Request, Response } from 'express';
import { TypedRequestBody } from '../../express';
import { APILogger } from '../../logger/api';
import { AuthTokenRepository } from '../../repository/authtoken';
import { AuthToken } from '../../models/authtoken';
import { v4 as uuidv4 } from 'uuid';

export class LoginController {
  private authTokenRespository: AuthTokenRepository;
    private logger: APILogger;

    constructor() {
        this.authTokenRespository = new AuthTokenRepository();
        this.logger = new APILogger()
    }

    async createAuthToken(authToken: {account: string, token: string}) {
        this.logger.info('Controller: createAuthToken', authToken);
        return await this.authTokenRespository.createToken(authToken);
    }

    login(req: TypedRequestBody<{ account: string, command: {cmd: string}, signature: string }>, res: Response) {
        // FIXME: Add logic for validation.
        const token= uuidv4();
        this.createAuthToken({account: req.body.account, token: token});
        return res.status(200).json({ "token": token });
    }

    logout(req: Request, res: Response) {
        console.log(req.headers['X-Auth-Token']);
        // FIXME: add validation on the above header
        return res.status(200).json({});
    }
}
