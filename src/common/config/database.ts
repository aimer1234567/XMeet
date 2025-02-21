import { DataSource } from "typeorm";
import User from "../../models/entity/user";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "123456",
  database: "xmeet",
  synchronize: true, // 开发环境可以设置为 true，生产环境应设置为 false
  logging: false,
  entities: [User], // 将所有实体放到数组中
  migrations: [],
});

export default AppDataSource;
