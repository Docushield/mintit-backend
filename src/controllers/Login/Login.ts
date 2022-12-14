import { Request, Response } from "express";
import { TypedRequestBody } from "../../express";
import { APILogger } from "../../logger/api";
import { AuthTokenRepository } from "../../repository/authtoken";
import { AdminRepository } from "../../repository/admin";
import { v4 as uuidv4 } from "uuid";
import { crypto } from "pact-lang-api";

export class LoginController {
  private authTokenRespository: AuthTokenRepository;
  private adminRespository: AdminRepository;
  private logger: APILogger;

  constructor() {
    this.authTokenRespository = new AuthTokenRepository();
    this.adminRespository = new AdminRepository();
    this.logger = new APILogger();
  }

  async validateAdmin(
    req: TypedRequestBody<{
      username: string,
      password: string,
    }>,
    res: Response,

  ) {
    const { username, password } = req.body;
    return await this.adminRespository.validateAdmin(username, password, res);
  }

  async createAuthToken(
    authToken: { account: string; token: string },
    res: Response
  ) {
    return await this.authTokenRespository.createToken(authToken, res);
  }

  async removeAuthToken(token: string) {
    return await this.authTokenRespository.deleteAuthToken(token);
  }

  getPublicKey(account: string): string {
    if (account.startsWith("k:")) {
      return account.slice(2);
    } else {
      throw `Only k: accounts are supported, got: ${account}`;
    }
  }

  verifySignature(
    account: string,
    command: string,
    signature: string
  ): boolean {
    const pubKey = this.getPublicKey(account);
    const commandJSON = JSON.parse(command);
    let nonce = JSON.parse(commandJSON.nonce);
    try {
      // Unfortunate consequence of X-Wallet signing a triple-jsonified datetime
      nonce = JSON.parse(nonce);
    } catch (err) {}

    // Check that the nonce is not older than 3600 seconds
    const now = Date.now();

    if (now - Date.parse(nonce) > 3600000) {
      throw `Nonce in signed command is older than 3600 seconds ago, received: ${nonce} (${Date.parse(
        nonce
      )}), server time: ${now}`;
    }

    return crypto.verifySignature(command, signature, pubKey);
  }

  async login(
    req: TypedRequestBody<{
      account: string;
      command: string;
      signature: string;
    }>,
    res: Response
  ) {
    try {
      const { account, command, signature } = req.body;
      console.log(" Request for login: ", req.body);
      if (this.verifySignature(account, command, signature)) {
        const token = uuidv4();
        const authToken = await this.createAuthToken(
          { account: account, token: token },
          res
        );
        if (authToken == null) {
          res.status(400).json({ error: "Auth token is null" });
          return;
        }
        res.status(200).json({ token: token });
        return;
      } else {
        res.status(401).json({ error: "signature validation failed" });
        return;
      }
    } catch (err) {
      console.log("Exception occurred in login flow: ", err);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
      return;
    }
  }

  logout(req: Request, res: Response) {
    console.log(req.headers["x-auth-token"]);
    this.removeAuthToken(req.header["x-auth-token"]);
    // FIXME: add validation on the above header
    return res.status(200).json({});
  }
}
