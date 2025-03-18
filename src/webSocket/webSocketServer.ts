import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as httpsServer } from "https";
import { Server as httpServer } from "http";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../common/config/config";
import MyError from "../common/myError";
import { ErrorEnum } from "../common/enums/errorEnum";

export class WebSocketServer {
  io?: SocketIOServer;
  wsList: Map<string, Socket> = new Map(); // 存储用户ID对应的socket实例
  isInit: boolean = false;

  init(server: httpsServer | httpServer) {
    this.io = new SocketIOServer(server, {
      cors: { origin: "*" }, // 允许跨域
    });
    this.isInit = true;

    // 认证中间件
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token; // 通过 auth 获取 token
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      try {
        const decoded = jwt.verify(token, config.jwt, {
          ignoreExpiration: false,
          algorithms: ["HS256"],
        }) as JwtPayload;
        if (decoded && decoded.userId) {
          socket.data.userId = decoded.userId; // 存储用户ID
          this.wsList.set(decoded.userId, socket); // 记录用户的 socket
          return next();
        }
      } catch (err) {
        return next(new Error("Unauthorized"));
      }
    });

    this.io.on("connection", (socket) => {
      console.log(`${socket.data.userId} socket 连接成功`);

      socket.on("disconnect", () => {
        console.log(`${socket.data.userId} 断开连接`);
        this.wsList.delete(socket.data.userId);
      });

      socket.on("message", (data) => {
        console.log(`收到来自 ${socket.data.userId} 的消息:`, data);
        socket.emit("message", `服务器收到你的消息: ${data}`);
      });
    });
  }

  send(userId: string,api:string , data: any) {
    if (!this.isInit) throw new MyError(ErrorEnum.WebSocketServerNotInit);

    const socket = this.wsList.get(userId);
    if (!socket) {
      throw new MyError(ErrorEnum.UserIsNone);
    }
    socket.emit(api,data); // 使用 socket.io 发送消息
  }
}

const webSocketServer = new WebSocketServer();
export { webSocketServer };
