import { Table, Column, Model, Default, HasMany, PrimaryKey, DataType } from 'sequelize-typescript'
import { v4 as uuidv4 } from 'uuid';

@Table({
  tableName: 'collections'
})
export class Collection extends Model {

  @PrimaryKey
  @Default(uuidv4())
  @Column
  id: string

  @Column
  creator: string

  @Column
  description: string

  @Column
  name: string

  @Column
  type: string

  @Column
  "provenance-hash": string

  @Column
  "mint-starts": Date

  @Column
  "premint-ends": Date

  @Column(DataType.ARRAY(DataType.STRING))
  "premint-whitelist": [string]

  @Column
  size: number

  @Column
  "mint-price": number

  @Column(DataType.ARRAY(DataType.STRING))
  "token-list": [string]

  @Column
  createdAt: string;

  @Column(DataType.ARRAY(DataType.JSONB))
  "mint-royalities": [object]

  @Column(DataType.ARRAY(DataType.JSONB))
  "sale-royalities": [object]

  @Column(DataType.ARRAY(DataType.JSONB))
  tokens: [object];
}

type MintRoyalties = {
  description: string
  stakeholder: string
  "stakeholder-guard": object
  rate: number
}
