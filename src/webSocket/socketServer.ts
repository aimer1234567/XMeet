import mediasoup from "mediasoup";
import config from "../common/config/config";
import { types } from "mediasoup";
import { Server } from "ws";

// export function MediaService(server: Server) {
//   server.on("connection", (socket) => {
//     socket.on("createRoom", async ({ room_id }, callback) => {
//       if (roomList.has(room_id)) {
//         callback({
//           code: 1,
//           msg: "房间已存在",
//         });
//       }
//     });
//   });
// }
