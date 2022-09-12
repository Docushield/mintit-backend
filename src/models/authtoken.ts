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
  tableName: "authTokens",
})
export class AuthToken extends Model {
  @PrimaryKey
  @Column
  id: string;

  @Column
  token: string;

  @Column
  account: string;

  @CreatedAt
  @Column
  createdAt: string;

  @Column(DataType.STRING)
  status: TokenStatus;
}

export enum TokenStatus {
  ACTIVE,
  DISABLED,
}
