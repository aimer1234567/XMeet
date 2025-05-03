import AppDataSource from "../common/config/database";
import { ErrorEnum } from "../common/enums/errorEnum";
import MyError from "../common/myError";
import MeetRoom from "../models/entity/meetRoom";
import { QueryFailedError,LessThanOrEqual } from "typeorm";
class MeetRoomDao {
  private meetRoomRepository = AppDataSource.getRepository(MeetRoom);
  async addMeetRoom(meetRoom: MeetRoom) {
    try{
          const meetRoomQueryBuilder= this.meetRoomRepository.createQueryBuilder();
          const { identifiers }=await meetRoomQueryBuilder.insert().into(MeetRoom).values(meetRoom).execute();
          return identifiers
    }catch(err){
      if(err instanceof QueryFailedError){
          console.log(err.driverError)
          throw new MyError(err.message)
      }
    }
  }

  async getMeetRoomById(id:string){
    let meetRoom
    try{
      meetRoom=await this.meetRoomRepository.findOneBy({id:id})
    }catch(err){
      console.log(err);
      throw new MyError(ErrorEnum.SQLError);
    }
    return meetRoom!
  }

    // 修改会议室的 isOver 字段为 true
    async updateIsOver(roomId: string) {
      try {
        // 使用 QueryBuilder 来更新 isOver 字段为 true
        const result = await this.meetRoomRepository
          .createQueryBuilder()
          .update(MeetRoom)
          .set({ isOver: true })
          .where("id = :id", { id: roomId })
          .execute();
        return result;
      } catch (err) {
        console.log(err);
        throw new MyError(ErrorEnum.SQLError);
      }
    }

    async getAppointMeetNumber(creatorId:string) {
      try {
        const count = await this.meetRoomRepository.count({
          where: {
            creatorId,
            isInstant: false,
            isOver: false
          }
        });
        return count;
      } catch (err) {
        console.log(err);
        throw new MyError(ErrorEnum.SQLError);
      }
    }

    async getAppointMeets(creatorId: string) {
      try {
        const appointMeets = await this.meetRoomRepository.find({
          where: {
            creatorId,
            isInstant: false,
            isOver: false
          }
        });
        return appointMeets;
      } catch (err) {
        console.log(err);
        throw new MyError(ErrorEnum.SQLError);
      }
    }

    async getAllAppointMeets() {
      try {
        const appointMeets=await this.meetRoomRepository.find({
          where: {
            isInstant: false,
            isOver: false,
            isStart:false,
            startTime: LessThanOrEqual(new Date()),
          }
        });
        return appointMeets;
      } catch (err) {
        console.log(err);
        throw new MyError(ErrorEnum.SQLError);
      }
    }
    async getAllNotOverMeets() {
      try {
        const meetings = await this.meetRoomRepository
          .createQueryBuilder('meet')
          .where('meet.is_start = :isStart', { isStart: 1 })
          .andWhere('meet.is_over = :isOver', { isOver: 0 })
          .andWhere('DATE_ADD(meet.start_time, INTERVAL meet.duration_minutes MINUTE) <= NOW()')
          .getMany(); // 使用 getMany 获取实体对象
    
        return meetings;
      } catch (err) {
        console.error('Error querying meetings that should be over:', err);
        throw new MyError(ErrorEnum.SQLError);
      }
    }
    async updateIsStarted(ids: string[]){
      await this.meetRoomRepository
      .createQueryBuilder()
      .update(MeetRoom) // 表名或实体类名都可以
      .set({ isStart: true })
      .whereInIds(ids)
      .execute();
    }
    
    async updateListIsOver(ids: string[]) {
      await this.meetRoomRepository
      .createQueryBuilder()
      .update(MeetRoom) // 表名或实体类名都可以
      .set({ isOver: true })
      .whereInIds(ids)
      .execute();
    }
}
export default new MeetRoomDao();
