import express from "express";
import "reflect-metadata";
import userRouter from "./routes/userRouter";
import expressOasGenerator from "express-oas-generator";
import swaggerUi from "swagger-ui-express";
import AppDataSource from "./config/database";
import errorHandler from "./middlewares/errorHandler";
import sourceMapSupport from 'source-map-support'
sourceMapSupport.install(); //在运行js文件时可以直接调试ts文件
const app = express();
expressOasGenerator.init(app);
app.use(express.json());
// 设置 Swagger UI 来展示 API 文档
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: "/api-spec", // OpenAPI 文档的路径
    },
  })
);
app.post("/", async(req, res) => {
  res.send("dqd")
});
app.use("/user", userRouter);
app.use(errorHandler);
AppDataSource.initialize()
  .then(() => {
    console.log("数据库初始化");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });

app.listen(8080, () => {
  console.log("server is running on port 8080");
});
