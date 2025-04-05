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
          throw new Error(err.message)
      }
    }
    return meetRoom!
  }
}
export default new MeetRoomDao();
