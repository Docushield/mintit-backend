import { Collection } from "./collection";
import {
  Table,
  Column,
  Model,
  Default,
  HasMany,
  PrimaryKey,
  DataType,
  ForeignKey,
  CreatedAt,
  AllowNull,
  Unique,
} from "sequelize-typescript";

@Table({
  tableName: "nfts",
})
export class NFT extends Model {
  @PrimaryKey
  @Column
  id: string;

  @ForeignKey(() => Collection)
  @Column
  collectionId: string;

  @Column
  owner: string;

  @Column(DataType.JSONB)
  spec: object;

  @Column
  status: string;

  @CreatedAt
  @Column
  createdAt: string;

  @Column
  mintedAt: number;

  @Column
  revealedAt: number;

  @Unique
  @AllowNull(false)
  @Column
  hash: string;

  @Column(DataType.JSONB)
  contentUri: object;
}
