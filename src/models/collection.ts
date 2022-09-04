import { CreatedAt, Table, Column, Model, Default, HasMany, PrimaryKey, DataType } from 'sequelize-typescript'

@Table({
  tableName: 'collections'
})
export class Collection extends Model {

  @PrimaryKey
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

  @Column(DataType.DATE)
  "mint-starts": string

  @Column(DataType.DATE)
  "premint-ends": string

  @Column(DataType.ARRAY(DataType.STRING))
  "premint-whitelist": [string]

  @Column
  size: number

  @Column
  "mint-price": number

  @Column(DataType.ARRAY(DataType.STRING))
  "token-list": [string]

  @CreatedAt
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
