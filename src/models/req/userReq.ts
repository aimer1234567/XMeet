export class UserRegisterReq {
    constructor(
        public email:string,
        public captcha:number,
        public userName:string,
        public password:string,
        public name:string,
        public lang:string
    ){}
}

export class LoginReq{
    constructor(
        public username:string,
        public password:string,
    ){}
}