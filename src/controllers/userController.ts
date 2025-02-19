import { Request, Response, NextFunction } from "express";
import Result from "../common/result";
import UserService from "../services/userService";
import UserRegisterReq from "../models/req/registerReq";
import { channel } from "diagnostics_channel";
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
      req.body.password
    );
    res.json(this.userService.register(userRegisterReq));
  }
}
