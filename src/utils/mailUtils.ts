import nodemailer from "nodemailer";
import config from "../common/config/config";
const mailUtilsParameter = config.mailUtils;
export default class MailUtils {
  private mailTransporter: nodemailer.Transporter;
  constructor() {
    this.mailTransporter = nodemailer.createTransport({
      host: mailUtilsParameter.host,
      port: mailUtilsParameter.port,
      secure: mailUtilsParameter.secure, // 使用 SSL
      auth: {
        user: mailUtilsParameter.user, // 发件人邮箱
        pass: mailUtilsParameter.pass, // 发件人邮箱授权码
      },
    });
  }
  async sendCaptcha(toMail: string, captcha: number) {
    const mailOptions = {
      from: mailUtilsParameter.user, // 发件人
      to: toMail, // 收件人
      subject: mailUtilsParameter.captchaMail.subject, // 邮件主题
      text: `验证码:${captcha}`, // 邮件文本内容
    };
    try {
      const info = await this.mailTransporter.sendMail(mailOptions);
      return JSON.stringify(info);
    } catch (e) {
      throw new Error("发送邮件失败");
    }
  }
}
