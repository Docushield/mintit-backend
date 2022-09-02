import { Table, Column, Model, HasMany, DataType, ForeignKey } from 'sequelize-typescript'
import { Collections } from './collection'

@Table({
  tableName: 'nft'
})
export class NFT extends Model {

  @ForeignKey (() => Collections)
  @Column
  collection_id: number

  @Column
  owner: string


  @Column(DataType.JSONB)
  spec: object;

}
