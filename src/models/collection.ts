import {
  CreatedAt,
  Table,
  Column,
  Model,
  Default,
  HasMany,
  PrimaryKey,
  DataType,
  Unique,
  AllowNull,
} from "sequelize-typescript";

@Table({
  tableName: "collections",
})
export class Collection extends Model {
  @PrimaryKey
  @Column
  id: string;

  @Column
  creator: string;

  @Column
  description: string;

  @Unique
  @AllowNull(false)
  @Column
  name: string;

  @Column
  type: string;

  @Unique
  @AllowNull(false)
  @Column
  "provenance-hash": string;

  @Column(DataType.DATE)
  "mint-starts": string;

  @Column(DataType.DATE)
  "premint-ends": string;

  @Column(DataType.ARRAY(DataType.STRING))
  "premint-whitelist": [string];

  @Column
  size: number;

  @Column
  "mint-price": number;

  @Column(DataType.ARRAY(DataType.JSONB))
  "token-list": [Token];

  @CreatedAt
  @Column
  createdAt: string;

  @Column(DataType.JSONB)
  "mint-royalties": object;

  @Column(DataType.JSONB)
  "sale-royalties": object;

  @Column
  status: string;

  @Column
  statusMessage: string;

  @Column
  imageUrl: string;

  @Column
  bannerImageUrl: string;

  @Unique
  @AllowNull(false)
  @Column
  slug: string;
}

type MintRoyalties = {
  description: string;
  stakeholder: string;
  "stakeholder-guard": object;
  rate: number;
};

export type Token = {
  spec: object;
  hash: string;
  content_uri: { scheme: string; data: string };
};
