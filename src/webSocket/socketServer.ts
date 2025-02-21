import mediasoup from "mediasoup";
import config from "../common/config/config";
import { types } from "mediasoup";
import { Server } from "ws";

let workers = [];
let nextMediasoupWorkerIdx = 0;
async function createWorkers() {
  let { numWorkers } = config.mediasoup; //从配置文件中获取工作线程数

  for (let i = 0; i < numWorkers; i++) {
    let worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel as types.WorkerLogLevel,
      logTags: config.mediasoup.worker.logTags as types.WorkerLogTag[],
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });

    worker.on("died", () => {
      console.error(
        "mediasoup worker died, exiting in 2 seconds... [pid:%d]",
        worker.pid
      );
      setTimeout(() => process.exit(1), 2000);
    });
    workers.push(worker);

    // log worker resource usage
    /*setInterval(async () => {
              const usage = await worker.getResourceUsage();
  
              console.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
          }, 120000);*/
  }
}
let roomList = new Map();

export function MediaService(server: Server) {
  server.on("connection", (socket) => {
    socket.on("createRoom", async ({ room_id }, callback) => {
      if (roomList.has(room_id)) {
        callback({
          code: 1,
          msg: "房间已存在",
        });
      }
    });
  });
}
