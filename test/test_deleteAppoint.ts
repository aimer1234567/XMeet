import MeetRoomService from "../src/services/meetRoomService";
  import AppDataSource from "../src/common/config/database";
let meetRoomService=new MeetRoomService();

async function main() {
  await AppDataSource.initialize()
    .then(() => {
      console.log("数据库初始化");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });
    meetRoomService.deleteAppointMeet("9","27c29023-c236-4925-a2d0-8ec7fc319728")
}

main();