import { Collection } from './collection'
import { Table, Column, Model, Default, HasMany, PrimaryKey, DataType, ForeignKey } from 'sequelize-typescript'
import { v4 as uuidv4 } from 'uuid';

@Table({
  tableName: 'nfts'
})
export class NFT extends Model {

  @PrimaryKey
  @Default(uuidv4())
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
