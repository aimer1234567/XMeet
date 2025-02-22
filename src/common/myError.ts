export default class MyError extends Error {
  constructor(public msg: string) {
    super(msg);
    this.name = "myError";
  }
}
