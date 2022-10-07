//app-signal
const { Appsignal } = require("@appsignal/nodejs");

const appsignal = new Appsignal({
  active: true,
  name: "tnm-docs",
  pushApiKey: "97fcea79-cd4f-4ec3-88d9-b387ec410662",
});

// Importing module
import express from "express";
import cors from "cors";
import * as bodyParser from "body-parser";
import { loginRouter, collectionRouter } from "./routes";
import multer from "multer";
import Pact from "pact-lang-api";
import * as Kadena from "./utils/kadena";
import { checkMintTokenOnChain, checkRevealTime } from "./utils/smart_contract";
import compression = require("compression");
const { expressMiddleware, expressErrorHandler } = require("@appsignal/express");

const app = express();
const PORT: Number = 8080;
const pollInterval = parseInt(process.env.POLL_INTERVAL_SECONDS || "30") || 30;
const revealPollInterval =
  parseInt(process.env.REVEAL_POLL_INTERVAL_SECONDS || "600") || 600;

// required for connect with testnet.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// TODO: Update to env variables with real server hosts
const allowedOrigins = process.env.ALLOWED_ORIGIN || "*";
const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins,
};

const shouldCompress = (req, res) => {
  if (req.headers["x-no-compression"]) {
    // Will not compress responses, if this header is present
    return false;
  }
  // Resort to standard compression
  return compression.filter(req, res);
};

app.use(compression({ filter: shouldCompress }));
app.options("*", cors());
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(expressMiddleware(appsignal));
app.use(expressErrorHandler(appsignal));

app.use("/api/auth", loginRouter);
app.use("/api/collections", collectionRouter);


// Handling GET / Request
app.get("/", (req, res) => {
  res.send("Welcome to typescript backend!");
});

app.get("/throw", (req, res) => {
  throw new Error('Throw makes it go boom!')
  res.send("Welcome to typescript backend!");
});


// Server setup
app.listen(PORT, () => {
  console.log(
    "The application is listening " + "on port http://localhost:" + PORT
  );
});

// Listening on the blockchain for the events.
setInterval(checkMintTokenOnChain, pollInterval * 1000);

// Loop to check for any old tokens yet to be revealed and reveal them.
setInterval(checkRevealTime, revealPollInterval * 1000);
