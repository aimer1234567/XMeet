import AppDataSource from "../src/config/database";
import User from "../src/models/entity/user";

const user = new User("aimer@luoxiaoying.online","1234qwerASDF","aimer");
async function test(user:User){
  await AppDataSource.initialize()
    .then(() => {
      console.log("数据库初始化");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });
    const user_id = await AppDataSource.manager.save(user);
    console.log(user);
}
test(user)
