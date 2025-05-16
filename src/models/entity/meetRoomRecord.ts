import { Entity, Column,PrimaryColumn,OneToMany} from "typeorm"
import MeetUser from "./meetUser";
@Entity('meet_record')
class MeetRoomRecord {
  @PrimaryColumn()
  id: string;
  @Column({name:'name'})
  name: string;
  @Column({name:'creator_id',type:'bigint'})
  creatorId: string;
  @Column({name:'duration_pie_chart',type:'json', nullable: true })
  durationPieChart?: any;
  @Column({name:'word_cloud',type:'json', nullable: true })
  wordCloud?: {
      lang: string;
      wordFrequencyArray: { value: string; count: number }[];
    }[];
  @Column()
  time: number;
  @Column({name:'start_time',type:'datetime'})
  startTime: Date;
  @Column({name:'summary',type:'json', nullable: true })
  summary?: { lang: string; summary: string }[];
  @Column({name:'chat_heat_map',type:'json',nullable: true })
  chatHeatMap?: any;
  @OneToMany(() => MeetUser, (meetUser) => meetUser.meeting)
  users?: MeetUser[]; 
  constructor(id:string,startTime: Date,time: number,name:string,creatorId:string) {
    this.id = id;
    this.startTime = startTime;
    this.time = time;
    this.name = name;
    this.creatorId = creatorId;
  }
}

export default MeetRoomRecord; 