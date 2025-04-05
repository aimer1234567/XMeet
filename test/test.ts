  import AppDataSource from "../src/common/config/database";
  import MeetRoomDao from "../src/dao/meetRoomDao";
  import sourceMapSupport from "source-map-support";
import MeetRoom from "../src/models/entity/meetRoom";
import meetRoomRecordDao from "../src/dao/meetRoomRecordDao";
import MeetRoomRecord from "../src/models/entity/meetRoomRecord";
async function name() {
  sourceMapSupport.install(); //在运行js文件时可以直接调试ts文件
  await AppDataSource.initialize()
    .then(() => {
      console.log("数据库初始化");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });
    let jg=await meetRoomRecordDao.queryMeetRecords({userId:"6",name:'h',page:1,pageSize:10})
    console.log(jg);
}
name()