import { Table, Column, Model, HasMany, CreatedAt, PrimaryKey, Default } from 'sequelize-typescript'
import { v4 as uuidv4 } from 'uuid';

@Table({
  tableName: 'authTokens'
})
export class AuthToken extends Model {

  @PrimaryKey
  @Default(uuidv4())
  @Column
  id: string

  @Column
  token: string

  @Column
  account: string

  @CreatedAt
  @Column
  createdAt: string;

}
