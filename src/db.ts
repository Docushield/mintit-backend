import { Sequelize } from 'sequelize-typescript'
import { AuthToken } from './models/authtoken';
import { Collection } from './models/collection';
import { NFT } from './models/nft';

export const connect = () => {

    const hostName = process.env.HOST;
    const userName = process.env.USER || "cloud";
    const password = process.env.PASSWORD;
    const database = process.env.DB || "db";
    const dialect = 'postgres';

    console.log('dialect  ', dialect)

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
            idle: 5000
        }
    });

    sequelize.addModels([AuthToken, Collection, NFT]);

    const db: any = {};
    db.Sequelize = Sequelize;
    db.sequelize = sequelize;

    return db;

}
