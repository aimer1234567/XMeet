import { Request, Response, NextFunction } from "express";
import Result from "../common/result";
import UserService from "../services/userService";
import {UserRegisterReq,LoginReq} from "../models/req/userReq";
import { plainToClass, plainToInstance } from "class-transformer";
export default class UserController {
  userService: UserService = new UserService();
  async getMailCaptcha(req: Request, res: Response, next: NextFunction) {
    let mail = req.body.mail;
    try {
      await this.userService.getMailCaptcha(mail);
      res.json(Result.succuss());
    } catch (err) {
      next(err);
    }
  }
  async register(req: Request, res: Response,next: NextFunction) {
    try{
    let userRegisterReq=plainToInstance(UserRegisterReq,req.body as object)
    let result=await this.userService.register(userRegisterReq)
    res.json(result);
    }catch(err){
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    let loginReq = new LoginReq(req.body.username, req.body.password);
    try {
      let token = await this.userService.login(loginReq);
      res.json(Result.succuss(token));
    } catch (err) {
      next(err);
    }
  }
  async updateUserInfo(req: Request, res: Response, next: NextFunction) {
    try{
      let userId = req.headers["userId"] as string;
      let name = req.body.name;
      let lang = req.body.lang;
      let result=await this.userService.updateUserInfo(userId, name, lang);
      res.json(result);
    }catch(err){
      next(err)
    }
  }
  async getUserInfo(req: Request, res: Response, next: NextFunction) {
    try{
      let userId = req.headers["userId"] as string;
      let result=await this.userService.getUserInfo(userId);
      res.json(result);
    }catch(err){
      next(err)
    }
  }
  async isOnlyUserName(req: Request, res: Response, next: NextFunction){
    try{
      let username = req.body.username as string;
      let result=await this.userService.isOnlyUserName(username);
      res.json(result);
    }catch(err){
      next(err)
    }
  }
}
