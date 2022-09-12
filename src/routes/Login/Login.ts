import express, { Request, Response } from "express";
import { loginController } from "../../controllers";

export const router = express.Router({
  strict: true,
});

router.post("/", (req: Request, res: Response) => {
  loginController.login(req, res);
});

router.delete("/", (req: Request, res: Response) => {
  loginController.logout(req, res);
});
