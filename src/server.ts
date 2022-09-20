// Importing module
import express from "express";
import cors from "cors";
import * as bodyParser from "body-parser";
import { loginRouter, collectionRouter } from "./routes";
import multer from "multer";

const app = express();
const PORT: Number = 8080;

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
