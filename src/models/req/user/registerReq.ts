export default class UserRegisterReq {
    constructor(
        public email:string,
        public captcha:number,
        public userName:string,
        public password:string,
    ){}
}