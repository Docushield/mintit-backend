import { Request, Response } from 'express';
import { TypedRequestBody } from '../../express';

export function login(req: TypedRequestBody<{ account: string, command: {cmd: string}, signature: string }>, res: Response) {
  // FIXME: Add logic for validation and return valid token.
  return res.status(200).json({ "token": "ABCD" });
}

export function logout(req: Request, res: Response) {
  console.log(req.headers['X-Auth-Token']);
  // FIXME: add validation on the above header
  return res.status(200).json({});
}
