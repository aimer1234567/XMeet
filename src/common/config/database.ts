import { DataSource } from "typeorm";
import fs from "fs";
import path from "path";

const entityPath = path.resolve(__dirname, "../../models/entity");
const entities = fs
  .readdirSync(entityPath)
  .filter(file => file.endsWith(".ts") || file.endsWith(".js"))
  .map(file => require(path.join(entityPath, file)).default);
export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "123456",
  database: "xmeet",
  synchronize: false, // 
  logging: false,
  entities, // 将所有实体放到数组中
  migrations: [],
});
console.log(entities);
export default AppDataSource;
