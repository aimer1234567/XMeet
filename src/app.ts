import express from "express";
import "reflect-metadata";
import userRouter from "./routes/userRouter";
import expressOasGenerator from "express-oas-generator";
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

async function init() {
  await AppDataSource.initialize()
  .then(() => {
    console.log("数据库初始化");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });
  await mediaService.createWorkers(); //初始化mediasoup工作线程
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
  import("./routes/meetRoomRouter").then((meetRoomRouter)=>{
    app.use("/meetRoom",meetRoomRouter.default)
  })
  app.use(errorHandler);
  let server;
  if (config.webServer.isHttps) {
    server = https.createServer(options, app);
  } else {
    server = http.createServer(app);
  }
  const wss = new WebSocket.Server({ server });
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

init();
