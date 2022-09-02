import { Table, Column, Model, Default, HasMany, PrimaryKey } from 'sequelize-typescript'
import { v4 as uuidv4 } from 'uuid';

@Table({
  tableName: 'collections'
})
export class Collections extends Model {

  @PrimaryKey
  @Default(uuidv4())
  @Column
  id: number

  @Column
  creator: string

  @Column
  description: string

  @Column
  name: string

  @Column
  type: string

  @Column({field: 'provenance-hash'})
  provenanceHash: string

  @Column({field: 'mint-starts'})
  mintStarts: Date

  @Column({field: 'premint-ends'})
  premintEnds: Date

  @Column({field: 'premint-whitelist'})
  premintWhitelist: [string]

  @Column
  size: number

  @Column({field: 'mint-price'})
  mintPrice: number

  @Column({field: 'token-list'})
  tokenList: [string]

  @Column
  createdAt: string;
}
