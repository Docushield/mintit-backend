import { Collection } from './collection'
import { Table, Column, Model, Default, HasMany, PrimaryKey, DataType, ForeignKey } from 'sequelize-typescript'

@Table({
  tableName: 'nfts'
})
export class NFT extends Model {

  @PrimaryKey
  @Column
  id: string

  @ForeignKey (() => Collection)
  @Column
  collection_id: number

  @Column
  owner: string


  @Column(DataType.JSONB)
  spec: object;

}
