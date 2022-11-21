import express, { Request, Response } from "express";
import { collectionController } from "../../controllers";
import multer from "multer";
//const upload = multer({ dest: "uploads/" });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1000000000, files: 2, fieldSize: 25 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload a valid image file"));
    }
    cb(null, true);
  },
});

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

router.get("/tokens", (req: Request, res: Response) => {
  collectionController.getMintedNFTTokens(req, res);
});

router.get("/:slug", (req: Request, res: Response) => {
  collectionController.getCollection(req, res);
});

router.get("/profile/:account", (req: Request, res: Response) => {
  collectionController.getProfileCollection(req, res);
});

router.post("/profile/count-tokens", (req: Request, res: Response) => {
  collectionController.countProfileTokens(req, res);
});

router.get("/", (req: Request, res: Response) => {
  collectionController.getCollections(req, res);
});

router.get("/:slug/tokens", (req: Request, res: Response) => {
  collectionController.getNFTTokens(req, res);
});

router.get("/:slug/tokenHashes", (req: Request, res: Response) => {
  collectionController.getNFTHashes(req, res);
});

router.get("/:slug/tokens/:hash", (req: Request, res: Response) => {
  collectionController.getNFTTokenByHash(req, res);
});

router.get("/retry/:name", (req: Request, res: Response) => {
  collectionController.chunkAndAdd(req, res);
});


router.post("/get-status", (req: Request, res: Response) => {
  collectionController.getStatus(req, res);
});

router.post("/update-status", (req: Request, res: Response) => {
  collectionController.updateStatus(req, res);
});
