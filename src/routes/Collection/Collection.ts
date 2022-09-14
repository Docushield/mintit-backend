import express, { Request, Response } from "express";
import { collectionController } from "../../controllers";

export const router = express.Router({
  strict: true,
});

router.post("/", (req: Request, res: Response) => {
  collectionController.addCollection(req, res);
});

router.get("/status/:id", (req: Request, res: Response) => {
  collectionController.getCollectionStatus(req, res);
});

router.get("/reveal/:id", (req: Request, res: Response) => {
  collectionController.revealNFT(req, res);
});
