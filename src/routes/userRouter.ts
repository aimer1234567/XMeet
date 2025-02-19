import express from "express";
import UserController from "../controllers/userController";
/**
 * 用户行为路由
 */
const userRouter = express.Router();
const userController = new UserController();
userRouter.post("/getMailCaptcha",(req, res,next) => userController.getMailCaptcha(req, res,next));
userRouter.post("/verifyCaptcha", (req, res) => userController.register(req, res));
userRouter.post("/test",async (req, res,next) => userController.test(req, res,next));

export default userRouter;