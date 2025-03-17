import NodeCache from "node-cache";
import MailUtils from "../common/utils/mailUtils";
import Result from "../common/result";
import generateCaptcha from "../common/utils/generateCaptcha";
import AppDataSource from "../common/config/database";
import User from "../models/entity/user";
import {LoginReq,UserRegisterReq} from "../models/req/userReq";
import UserDao from "../dao/userDao";
import { ErrorEnum } from "../common/enums/errorEnum";
import jwt from "jsonwebtoken";
import config from "../common/config/config";
export default class UserService {
  cache = new NodeCache();
  mailUtils: MailUtils = new MailUtils();
  userDao: UserDao = new UserDao();
  /// TODO: 优化，防止多次获取验证码
  async getMailCaptcha(mail: string) {
    let captcha = generateCaptcha();
    try {
      await this.mailUtils.sendCaptcha(mail, captcha);
      this.cache.set(mail, captcha, 60000);
    } catch (err) {
      throw err;
    }
  }
  // TODO: 优化，防止多次注册，防止邮箱重复，账号重复要反馈错误
  async register(userRegisterReq: UserRegisterReq) {
    const captchaVerify = this.cache.get(userRegisterReq.email);
    if (captchaVerify === null) {
      return Result.error("验证码已过期");
    } else if (captchaVerify !== userRegisterReq.captcha) {
      return Result.error("验证码错误");
    } else {
      let user = new User(
        userRegisterReq.email,
        userRegisterReq.password,
        userRegisterReq.userName
        ,userRegisterReq.name
      );
      await AppDataSource.manager.save(user);
      return Result.succuss();
    }
  }
  //TODO:
  async login(loginReq: LoginReq) {
    let user = await this.userDao.selectByUsername(loginReq.username);
    if (user === null) {
      throw new Error(ErrorEnum.UserIsNone);
    } else if (user.password !== loginReq.password) {
      throw new Error(ErrorEnum.PasswordError);
    }else{
      let token=jwt.sign({userId:user.id},config.jwt,{expiresIn:'30D',algorithm:"HS256"} as jwt.SignOptions)
      return token
    }
  }
}
