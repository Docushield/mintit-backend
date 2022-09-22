// Importing module
import express from "express";
import cors from "cors";
import * as bodyParser from "body-parser";
import { loginRouter, collectionRouter } from "./routes";
import multer from "multer";
import Pact from "pact-lang-api";
import * as Kadena from "./utils/kadena";

const app = express();
const PORT: Number = 8080;
const mintInterval = parseInt(process.env.MINT_INTERVAL_SECONDS || "30") || 30;

// required for connect with testnet.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// TODO: Update to env variables with real server hosts
const allowedOrigins = process.env.ALLOWED_ORIGIN || "*";
const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins,
};

app.options("*", cors());
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use("/api/auth", loginRouter);
app.use("/api/collections", collectionRouter);

// Handling GET / Request
app.get("/", (req, res) => {
  res.send("Welcome to typescript backend!");
});

// Server setup
app.listen(PORT, () => {
  console.log(
    "The application is listening " + "on port http://localhost:" + PORT
  );
});

// Listening on the blockchain for the events.
setInterval(Kadena.checkMintTokenOnChain, mintInterval * 1000);
