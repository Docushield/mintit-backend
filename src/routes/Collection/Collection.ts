import express, { Request, Response } from "express";
import { collectionController } from "../../controllers";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

export const router = express.Router({
  strict: true,
});

router.post(
  "/",
  upload.fields([
    { name: "collection_image", maxCount: 1 },
    { name: "collection_banner", maxCount: 1 },
  ]),
  (req: Request, res: Response) => {
    collectionController.addCollection(req, res);
  }
);

router.put(
  "/",
  upload.fields([
    { name: "collection_image", maxCount: 1 },
    { name: "collection_banner", maxCount: 1 },
  ]),
  (req: Request, res: Response) => {}
);

router.get("/status/:id", (req: Request, res: Response) => {
  collectionController.getCollectionStatus(req, res);
});

router.get("/reveal/:id", (req: Request, res: Response) => {
  collectionController.revealNFT(req, res);
});

router.get("/:slug", (req: Request, res: Response) => {
  collectionController.getCollection(req, res);
});
