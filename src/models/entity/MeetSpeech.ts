import {Entity,PrimaryColumn,PrimaryGeneratedColumn,Column} from 'typeorm'

@Entity({name:"meet_speech"})
export default class MeetSpeech{
    @PrimaryColumn({type:"bigint"})
    id!:string
    @Column({name:"speech_text",type:"varchar"})
    speechText:string
    @Column({type:"datetime"})
    timestamp:Date
    @Column({name:'user_id',type:"bigint"})
    userId:string
    @Column({name:'meet_id',type:"varchar"})
    meetId:string
    @Column()
    lang:string
    constructor(speechText:string,timestamp:Date,userId:string,meetId:string,lang:string){
        this.speechText=speechText;
        this.timestamp=timestamp;
        this.userId=userId;
        this.meetId=meetId;
        this.lang=lang;
    }
}