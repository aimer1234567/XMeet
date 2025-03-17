  import AppDataSource from "../src/common/config/database";
  import MeetRoomDao from "../src/dao/meetRoomDao";
  import sourceMapSupport from "source-map-support";
import MeetRoom from "../src/models/entity/meetRoom";
async function name() {
  sourceMapSupport.install(); //在运行js文件时可以直接调试ts文件
  await AppDataSource.initialize()
    .then(() => {
      console.log("数据库初始化");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });
  const a=await new MeetRoomDao().addMeetRoom(new MeetRoom("1", new Date(), 1, "1", "1", false, false, false, "1"));
  console.log(a);
}
name()