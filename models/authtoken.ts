import { Table, Column, Model, HasMany, CreatedAt, PrimaryKey, Default } from 'sequelize-typescript'
import { v4 as uuidv4 } from 'uuid';

@Table({
  tableName: 'authToken'
})
export class AuthTokens extends Model {

  @PrimaryKey
  @Default(uuidv4())
  @Column
  id: number

  @Column
  token: string

  @Column
  account: string

  @CreatedAt
  @Column
  createdAt: string;

}
