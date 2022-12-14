import { Sequelize } from "sequelize-typescript";
import { AuthToken } from "./models/authtoken";
import { Admin } from "./models/admin";
import { Collection } from "./models/collection";
import { NFT } from "./models/nft";

export const connect = () => {
  const hostName = process.env.HOST || "localhost";
  const userName = process.env.USER || "galactus";
  const password = process.env.PASSWORD || "galactus";
  const database = process.env.DB || "galactusdb";
  const dialect = "postgres";

  console.log("dialect  ", dialect);

  const operatorsAliases: any = false;

  const sequelize = new Sequelize(database, userName, password, {
    host: hostName,
    dialect,
    operatorsAliases,
    repositoryMode: true,
    pool: {
      max: 10,
      min: 1,
      acquire: 20000,
      idle: 5000,
    },
    logging: true,
  });

  sequelize.addModels([AuthToken, Collection, NFT, Admin]);

  const db: any = {};
  db.Sequelize = Sequelize;
  db.sequelize = sequelize;
  //sequelize.sync();

  return db;
};
