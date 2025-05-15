import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
import { LessThanOrEqual } from "typeorm";
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
    @Column({name:"is_instant"})
    isInstant:boolean
    @Column({name:"num_limit"})
    numLimit:number
    @Column({name:"is_over"})
    isOver:boolean
    @Column({name:"is_start"})
    isStart:boolean
    constructor(creatorId:string,startTime:Date,durationMinutes:number,name:string,remark:string,isInstant:boolean,numLimit:number,isOver:boolean,isStart:boolean) {
        this.creatorId = creatorId;
        this.startTime = startTime;
        this.durationMinutes = durationMinutes;
        this.name = name;
        this.remark = remark;
        this.isInstant = isInstant;
        this.numLimit = numLimit;
        this.isOver = isOver;
        this.isStart= isStart;
    }
}

export default MeetRoom