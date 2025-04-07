import AppDataSource from "../common/config/database";
import MyError from "../common/myError";
import MeetRoom from "../models/entity/meetRoom";
import { QueryFailedError } from "typeorm";
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
      if(err instanceof QueryFailedError){
          throw new MyError(err.message)
      }
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
        if (err instanceof QueryFailedError) {
          console.log(err.driverError);
          throw new MyError(err.message);
        }
      }
    }
}
export default new MeetRoomDao();
