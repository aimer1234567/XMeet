export default function generateNumericCaptcha():number {
    const captcha = Math.floor(1000 + Math.random() * 9000); // 生成一个 1000 到 9999 之间的数字
    return captcha;
  }