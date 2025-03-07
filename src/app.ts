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
import http from "http"
import {MediaService,mediaService} from './services/mediaService'
import mediaRouter from "./routes/mediaRouter";
import verifyHandler from "./middlewares/verifyHandler";
import cors from "cors";
import fs from "fs";
import Room from "./models/media/room";

async function init() {
  await mediaService.createWorkers();
  new Room("room1", mediaService.getMediasoupWorker(), "user1");
  const options = {
    key: fs.readFileSync("./ssl/key.pem", "utf-8"),
    cert: fs.readFileSync("./ssl/cert.pem", "utf-8"),
  };
  sourceMapSupport.install(); //在运行js文件时可以直接调试ts文件
  const app = express(); //创建express实例
  app.use(cors());
  expressOasGenerator.init(app);
  app.use(express.json());
  // 设置 Swagger UI 来展示 API 文档
  app.get("/f", (req, res) => {
    res.json("sadawdwqad");
  });
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        url: "/api-spec", // OpenAPI 文档的路径
      },
    })
  );
  app.use(verifyHandler);
  app.use("/media", mediaRouter);
  app.use("/user", userRouter);
  app.use(errorHandler);
  AppDataSource.initialize()
    .then(() => {
      console.log("数据库初始化");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });
  const server = http.createServer( app); //创建http服务器
  const wss = new WebSocket.Server({ server });
  server.listen(443, '0.0.0.0',() => {
    console.log("server is running on port 443");
  });
}

init();


