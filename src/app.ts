import express from "express";
import "reflect-metadata";
import userRouter from "./routes/userRouter";
import expressOasGenerator, { init } from "express-oas-generator";
import swaggerUi from "swagger-ui-express";
import AppDataSource from "./common/config/database";
import errorHandler from "./middlewares/errorHandler";
import sourceMapSupport from "source-map-support";
import WebSocket = require("ws");
import https from "https";
import http from "http";
import { MediaService, mediaService } from "./services/mediaService";
import mediaRouter from "./routes/mediaRouter";
import verifyHandler from "./middlewares/verifyHandler";
import cors from "cors";
import fs from "fs";
import config from "./common/config/config";
import { webSocketServer } from "./webSocket/webSocketServer";
import { speechRecognitionUtil } from "./utils/speechRecognitionUtil";
import initTranslationProcess from "./utils/initTranslationProcess";
import path from 'path'

async function initApp() {
  // const voskLibPath = path.resolve(__dirname, "../../node_modules/vosk/lib/win-x86_64");
  // process.env.PATH += `;${voskLibPath}`;   //因为要在work线程中使用vosk，但是work线程不能找到其dll，已经在系统中设置好了环境变量
  // console.log("Vosk DLL 路径:", voskLibPath);
  //initTranslationProcess(); //初始化语音识别进程
  speechRecognitionUtil.initTranslationService(); //初始化语音识别，加载语音识别模型
  await AppDataSource.initialize() //初始化数据库
    .then(() => {
      console.log("数据库初始化成功");
    })
    .catch((err) => {
      console.error("数据库初始化失败", err);
    });
  await mediaService.init(); //初始化mediasoup工作线程
  const options = {
    key: fs.readFileSync(config.webServer.https.key, "utf-8"),
    cert: fs.readFileSync(config.webServer.https.cert, "utf-8"),
  };
  sourceMapSupport.install(); //在运行js文件时可以直接调试ts文件
  const app = express(); //创建express实例
  expressOasGenerator.init(app); // 设置 Swagger UI 来展示 API 文档
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        url: "/api-spec", // OpenAPI 文档的路径
      },
    })
  );
  app.use(cors());
  app.use(express.json());
  app.use(verifyHandler);
  app.use("/media", mediaRouter);
  app.use("/user", userRouter);
  await import("./routes/meetRoomRouter").then((meetRoomRouter) => {
    app.use("/meetRoom", meetRoomRouter.default);
    console.log("meetRoomRouter loaded");
  });
  console.log("errorHandler loaded");
  app.use(errorHandler);
  let server;
  if (config.webServer.isHttps) {
    server = https.createServer(options, app);
    webSocketServer.init(server);
  } else {
    server = http.createServer(app);
    webSocketServer.init(server);
  }
  server.listen(config.webServer.port, config.webServer.host, () => {
    console.log(
      `server is running on ${
        config.webServer.isHttps
          ? `https://${config.webServer.host}:${config.webServer.port}`
          : `https://${config.webServer.host}:${config.webServer.port}`
      }`
    );
  });
}

initApp();
