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
  collection_id: string;

  @Column
  request_key: string;

  @Column
  owner: string;

  @Column(DataType.JSONB)
  spec: object;

  @Column
  status: string;

  @CreatedAt
  @Column
  createdAt: string;
}
