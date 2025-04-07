import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
@Entity({name:'meet'})
class MeetRoom{
    @PrimaryGeneratedColumn("uuid")
    id!: string
    @Column({type:"bigint",name:"creator_id"})
    creatorId:string
    @Column({type:"datetime",name:"start_time"})
    startTime:Date
    @Column({name:"duration_minutes"})
    durationMinutes:number
    @Column()
    name:string
    @Column()
    remark:string
    @Column({name:"invite_only"})
    inviteOnly:boolean
    @Column({name:"is_password"})
    isPassword:boolean
    @Column({name:"is_instant"})
    isInstant:boolean
    @Column()
    password:string
    @Column({name:"is_over"})
    isOver:boolean
    constructor(creatorId:string,startTime:Date,durationMinutes:number,name:string,remark:string,inviteOnly:boolean,isPassword:boolean,isInstant:boolean,password:string,isOver:boolean) {
        this.creatorId = creatorId;
        this.startTime = startTime;
        this.durationMinutes = durationMinutes;
        this.name = name;
        this.remark = remark;
        this.inviteOnly = inviteOnly;
        this.isPassword = isPassword;
        this.isInstant = isInstant;
        this.password = password;
        this.isOver = isOver;
    }
}

export default MeetRoom