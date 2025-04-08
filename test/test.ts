  import AppDataSource from "../src/common/config/database";
  import MeetRoomDao from "../src/dao/meetRoomDao";
  import sourceMapSupport from "source-map-support";
import MeetRoom from "../src/models/entity/meetRoom";
import meetRoomRecordDao from "../src/dao/meetRoomRecordDao";
import MeetRoomRecord from "../src/models/entity/meetRoomRecord";
import MeetSpeechDao from "../src/dao/MeetSpeechDao";
async function name() {
  sourceMapSupport.install(); //在运行js文件时可以直接调试ts文件
  await AppDataSource.initialize()
    .then(() => {
      console.log("数据库初始化");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });
    let jg=await MeetSpeechDao.findSpeechesByRoomAndLang("e32bec5a-e1e5-41b7-951e-0eb3f7eddc4a","zh")
    console.log(jg);
}
name()