function generateNumericCaptcha() {
    const captcha = Math.floor(1000 + Math.random() * 9000); // 生成一个 1000 到 9999 之间的数字
    return captcha;
  }
  
  console.log(generateNumericCaptcha()); // 输出随机四位数字验证码，例如：4762
  