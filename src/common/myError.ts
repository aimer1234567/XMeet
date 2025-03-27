export default class MyError extends Error {
  constructor(message: string) {
    super(message); // 传递给父类 Error 的 message 属性
    this.name = "MyError"; // 自定义错误名
  }
}
