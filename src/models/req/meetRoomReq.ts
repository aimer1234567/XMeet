import { Type,Expose } from "class-transformer";
export class CreateMeetRoomReq{
    @Type(()=>Date)
    startTime:Date
    durationMinutes:number
    name:string
    remark:string
    inviteOnly:boolean
    isPassword:boolean
    isInstant:string
    password:string
    constructor(
        startTime:Date,
        durationMinutes:number,
        name:string,
        remark:string,
        inviteOnly:boolean,
        isPassword:boolean,
        isInstant:string,
        password:string
    ){
        this.startTime=startTime;
        this.durationMinutes=durationMinutes;
        this.name=name;
        this.remark=remark;
        this.inviteOnly=inviteOnly;
        this.isPassword=isPassword;
        this.isInstant=isInstant;
        this.password=password;
    }
}

export class CreateMeetRoomReqInstant{
    constructor(
        public name:string,
        public remark:string,
        public password:string
    ){}
}