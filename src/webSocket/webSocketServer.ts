import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as httpsServer } from "https";
import { Server as httpServer } from "http";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../common/config/config";
import MyError from "../common/myError";
import { ErrorEnum } from "../common/enums/errorEnum";
import { speechRecognitionUtil } from "../ai/speechRecognition";
import userStatusManager from "../services/userStatusManager";
import { userDao } from "../dao/userDao";
import { roomStatusManager } from "../services/roomStatusManager";
type MESSAGE_EVENT = "speech";
export class WebSocketServer {
  private io?: SocketIOServer;
  userDao = userDao;
  userStatusManager = userStatusManager;
  isInit: boolean = false;
  private disconnectFunction: Array<(userId: string) => void> = new Array();
  private messageFunction: Map<string, (ws: Socket) => void> = new Map();
  init(server: httpsServer | httpServer) {
    this.io = new SocketIOServer(server, {
      cors: { origin: "*" }, // 允许跨域
    });
    this.isInit = true;

    // 认证中间件
    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth?.token; // 通过 auth 获取 token
      if (!token) {
        return next(new MyError(ErrorEnum.VerifyError));
      }
      try {
        const decoded = jwt.verify(token, config.jwt, {
          ignoreExpiration: false,
          algorithms: ["HS256"],
        }) as JwtPayload;
        if (decoded && decoded.userId) {
          const userId = decoded.userId;
          socket.data.userId = userId; // 存储用户ID
          if (this.userStatusManager.hasUser(userId)) {
            //当新用户登录的时候，移除当前登录的用户
            if (this.userStatusManager.userHasRoom(userId)) {
              const roomId = this.userStatusManager.getUserRoomId(userId);
              roomStatusManager.roomDeleteUser(roomId, userId);
              const username = userStatusManager.getUserName(userId);
              roomStatusManager.getRoomUserSetIng(roomId).forEach((userId) => {
                //广播给房间中的用户，同步客户端房间用户信息，有用户退出房间
                webSocketServer.send(userId, "peerExec", { username });
              });
            }
            this.send(socket.data.userId, "userIdExist", null);
          }
          await this.userStatusManager.addUser(userId, socket);
          socket.data.sessionId = userStatusManager.getUserSession(userId);
          return next();
        }
      } catch (err) {
        return next(new Error(ErrorEnum.VerifyError));
      }
    });

    this.io.on("connection", (socket) => {
      this.send(
        socket.data.userId,
        "sessionId",
        this.userStatusManager.getUserSession(socket.data.userId)
      );
      console.log(`${socket.data.userId} socket 连接成功`);
      socket.on("disconnect", () => {
        try {
          console.log(`${socket.data.userId} 断开连接`);
          this.disconnectFunction.forEach((func) => {
            func(socket.data.userId);
          });
          if (
            socket.data.sessionId ===
            this.userStatusManager.getUserSession(socket.data.userId)
          ) {
            this.userStatusManager.deleteUser(socket.data.userId);
          }
        } catch (err) {
          console.log(err);
        }
      });
      socket.on("speech", (speech) => {
        speechRecognitionUtil.rec(socket.data.userId, speech);
      });
    });
  }

  send(userId: string, api: string, data: any) {
    if (!this.isInit) throw new MyError(ErrorEnum.WebSocketServerNotInit);
    try{
        const socket = this.userStatusManager.getUserWebSocket(userId);
        if (!socket) {
          throw new MyError(ErrorEnum.UserIsNone);
        }
        socket.emit(api, data); // 使用 socket.io 发送消息
    }catch(err){
      console.log(err);
    }
  }

  OnDisconnect(func: (userId: string) => void) {
    this.disconnectFunction.push(func);
  }
  OnMessage(message: MESSAGE_EVENT, func: (ws: Socket) => void) {
    this.messageFunction.set(message, func);
  }
}

const webSocketServer = new WebSocketServer();
export { webSocketServer };
