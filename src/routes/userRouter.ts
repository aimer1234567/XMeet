import express from "express";
import UserController from "../controllers/userController";
/**
 * 用户行为路由
 */
const userRouter = express.Router();
const userController = new UserController();
userRouter.post("/getMailCaptcha",(req, res,next) => userController.getMailCaptcha(req, res,next));
userRouter.post("/verifyCaptcha", (req, res,next) => userController.register(req, res,next));
userRouter.post("/login",async (req, res,next) => userController.login(req, res,next));
userRouter.post("/updateUserInfo",async (req,res,next)=>userController.updateUserInfo(req,res,next))
userRouter.get("/getUserInfo",async (req,res,next)=>userController.getUserInfo(req,res,next))
userRouter.post('/isOnlyUserName',async(req,res,next)=>userController.isOnlyUserName(req,res,next))
export default userRouter;