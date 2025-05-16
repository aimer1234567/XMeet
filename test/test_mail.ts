import UserService from "../src/services/userService";

async function main() {
    let userService = new UserService();
    await userService.getMailCaptcha("1979565460@qq.com")
    console.log("验证码已发送");
}
main()