import NodeCache from "node-cache";
import MailUtils from "../utils/mailUtils";
import Result from "../common/result";
import generateCaptcha from "../utils/generateCaptcha";
import AppDataSource from "../common/config/database";
import User from "../models/entity/user";
import { LoginReq, UserRegisterReq } from "../models/req/userReq";
import {userDao ,UserDao} from "../dao/userDao";
import { ErrorEnum } from "../common/enums/errorEnum";
import jwt from "jsonwebtoken";
import config from "../common/config/config";
import MyError from "../common/myError";
export default class UserService {
  cache = new NodeCache();
  mailUtils: MailUtils = new MailUtils();
  userDao: UserDao = userDao;
  isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
  return emailRegex.test(email);
}
isValidName(username: string): boolean {
  const pattern = /^[\u4e00-\u9fa5a-zA-Z0-9_]{1,10}$/;
  return pattern.test(username);
}
isValidUsernameAndPassword(str: string): boolean {
  return /^[a-zA-Z0-9]{5,10}$/.test(str);
}
  async getMailCaptcha(mail: string) {
    let captcha = generateCaptcha();
    if (!this.isValidEmail(mail)) {
      throw new MyError("邮箱格式错误");
    }
    try {
      await this.mailUtils.sendCaptcha(mail, captcha);
      this.cache.set(mail, captcha, 150000);
    } catch (err) {
      if(err instanceof Error) {
        throw new MyError(`发送验证码失败:${err.message}`)
      }else{
        throw new MyError(`发送验证码失败`)
      }
    }
    return Result.succuss();
  }
  // TODO: 优化，防止多次注册，防止邮箱重复，账号重复要反馈错误
  async register(userRegisterReq: UserRegisterReq) {
    const captchaVerify = this.cache.get(userRegisterReq.mail);
    if (!this.isValidUsernameAndPassword(userRegisterReq.userName)) {
      throw new MyError("用户名格式错误");
    }
    if (!this.isValidUsernameAndPassword(userRegisterReq.password)) {
      throw new MyError("密码格式错误");
    }
    if (!this.isValidName(userRegisterReq.name)) {
      throw new MyError("名称格式错误");
    }
    if (await userDao.isOnlyByUsername(userRegisterReq.userName) === false) {
      throw new MyError("用户名已存在");
    }
    if (captchaVerify === null) {
      return Result.error("验证码已过期");
    } else if (captchaVerify !== Number(userRegisterReq.captcha)) {
      return Result.error("验证码错误");
    } else {
      let user = new User(
        userRegisterReq.mail,
        userRegisterReq.password,
        userRegisterReq.userName,
        userRegisterReq.name,
        userRegisterReq.lang
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
    } else {
      let token = jwt.sign({ userId: user.id }, config.jwt, {
        expiresIn: "30D",
        algorithm: "HS256",
      } as jwt.SignOptions);
      return token;
    }
  }

  async updateUserInfo(userId:string,name:string,lang:string){
    let name10=name.slice(0,10)
    if (lang!="zh" &&lang!="en"){
      lang="zh"
    }
    this.userDao.updateUserInfo(userId,name10,lang)
    return Result.succuss()
  }

  async getUserInfo(userId:string){
    let user=await this.userDao.selectById(userId)
    return Result.succuss({name:user.name,lang:user.lang})
  }
  async isOnlyUserName(username:string){
    let isOnly=await this.userDao.isOnlyByUsername(username)
    if(!isOnly){
      throw new MyError("用户名已存在")
    }
    return Result.succuss()
  }
}
