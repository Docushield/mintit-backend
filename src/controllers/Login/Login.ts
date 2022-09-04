import { Request, Response } from 'express';
import { TypedRequestBody } from '../../express';
import { APILogger } from '../../logger/api';
import { AuthTokenRepository } from '../../repository/authtoken';
import { AuthToken } from '../../models/authtoken';
import { v4 as uuidv4 } from 'uuid';
import { crypto } from 'pact-lang-api';

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

    async removeAuthToken(token: string){
        return await this.authTokenRespository.deleteAuthToken(token);
    }

    getPublicKey(account: string): string {
        if (account.startsWith("k:")) {
            return account.slice(2);
        } else {
            throw `Only k: accounts are supported, got: ${account}`;
        }
    }

    verifySignature(account: string, command: string, signature: string): boolean {
        const pubKey = this.getPublicKey(account);
        console.log(command);
        const commandJSON = JSON.parse(command);
        console.log(commandJSON);
        // Unfortunate consequence of X-Wallet signing a triple-jsonified datetime
        const nonce = JSON.parse(JSON.parse(commandJSON.nonce));
        console.log(nonce);

        // Check that the nonce is not older than 60 seconds
        if (Date.now() - Date.parse(nonce) > 60000) {
            throw `Nonce in signed command is older than 60 seconds ago, received: ${nonce}`
        }

        return crypto.verifySignature(command, signature, pubKey);
    }

    login(req: TypedRequestBody<{ account: string, command: string, signature: string }>, res: Response) {
        const { account, command, signature } = req.body;

        if (this.verifySignature(account, command, signature)) {
            const token = uuidv4();
            this.createAuthToken({account: account, token: token});
            return res.status(200).json({ "token": token });
        } else {
            return res.status(401).json({ "error": "signature validation failed" });
        }
    }

    logout(req: Request, res: Response) {
        console.log(req.headers['X-Auth-Token']);
        this.removeAuthToken(req.header['X-Auth-Token']);
        // FIXME: add validation on the above header
        return res.status(200).json({});
    }
}
