import express, { Request, Response } from "express";
import { collectionController } from "../../controllers";

export const router = express.Router({
  strict: true,
});

router.post("/", (req: Request, res: Response) => {
  collectionController.addCollection(req, res);
});
