import { Request, Response, NextFunction } from "express";
import Result from "../common/result";
import UserService from "../services/userService";
import {UserRegisterReq,LoginReq} from "../models/req/userReq";
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
  register(req: Request, res: Response) {
    let userRegisterReq = new UserRegisterReq(
      req.body.email,
      req.body.captcha,
      req.body.userName,
      req.body.password,
      req.body.name,
      req.body.lang
    );
    res.json(this.userService.register(userRegisterReq));
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
}
