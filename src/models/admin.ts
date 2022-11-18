import { bool } from "aws-sdk/clients/signer";
import {
  Table,
  DataType,
  Column,
  Model,
  HasMany,
  CreatedAt,
  PrimaryKey,
  Default,
} from "sequelize-typescript";

@Table({
  tableName: "admin",
})
export class Admin extends Model {
  @PrimaryKey
  @Column
  id: string;

  @Column
  username: string;

  @Column
  password: string;

  @Column
  minting: boolean;

  @Column
  collection: boolean;

  @Column
  token: string;

  @CreatedAt
  @Column
  createdAt: string;
}
