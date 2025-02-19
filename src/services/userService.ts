import cache from "memory-cache";
import MailUtils from "../common/mailUtils";
import Result from "../common/result";
import generateCaptcha from "../common/generateCaptcha";
import UserRegisterReq from "../models/req/registerReq";
import AppDataSource from "../config/database";
import User from "../models/entity/user";
export default class UserService {
  cache = cache;
  mailUtils: MailUtils = new MailUtils();
  async getMailCaptcha(mail: string) {
    let captcha = generateCaptcha();
    try {
      await this.mailUtils.sendCaptcha(mail, captcha);
      this.cache.put(mail, captcha, 60000);
    } catch (err) {
      throw err;
    }
  }
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
      );
      await AppDataSource.manager.save(user);
      return Result.succuss();
    }
  }
}
