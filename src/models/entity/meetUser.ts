import { Entity, Column, PrimaryGeneratedColumn ,ManyToOne,JoinColumn} from "typeorm"
import MeetRoomRecord from "./meetRoomRecord"
@Entity({name:"meet_user"})
export default class MeetUser {
    @PrimaryGeneratedColumn({type:'bigint'})
    id!: string;
    @Column({name:'meet_id'})
    meetId: string;
    @Column({name:'user_id'})
    userId: string;
    @ManyToOne(() => MeetRoomRecord, (meeting) => meeting.users)
    @JoinColumn({ name: 'meet_id' }) // 外键字段名
    meeting?: MeetRoomRecord;
    constructor(meetId: string, userId: string) {
        this.meetId = meetId;
        this.userId = userId;
    }
}