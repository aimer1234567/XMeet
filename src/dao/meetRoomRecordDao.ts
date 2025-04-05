import AppDataSource from "../common/config/database";
import MyError from "../common/myError";
import MeetRoomRecord from "../models/entity/meetRoomRecord";
import { QueryFailedError } from "typeorm";
interface QueryParams {
  userId: string;
  name?: string;
  startTimeStart?: Date;
  startTimeEnd?: Date;
  page?: number; // 当前页码
  pageSize?: number; // 每页大小
}

class MeetRoomRecordDao {
  private meetRoomRecordRepository =
    AppDataSource.getRepository(MeetRoomRecord);
  async addMeetRoomRecord(meetRoomRecord: MeetRoomRecord) {
      const identifiers = await this.meetRoomRecordRepository.save(
        meetRoomRecord
      );
      return identifiers;
  }
  async queryMeetRecords(params: QueryParams) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const qb = this.meetRoomRecordRepository
      .createQueryBuilder("record")
      .leftJoin("record.users", "mu") // 关联 meet_user 表
      .where("mu.user_id = :userId", { userId: params.userId });
    // 如果有 name，则模糊匹配
    if (params.name) {
      qb.andWhere("record.name LIKE :name", { name: `%${params.name}%`} );
    }

    // 如果有时间区间
    if (params.startTimeStart && params.startTimeEnd) {
      qb.andWhere("record.start_time BETWEEN :start AND :end", {
        start: params.startTimeStart,
        end: params.startTimeEnd,
      });
    } else if (params.startTimeStart) {
      qb.andWhere("record.start_time >= :start", {
        start: params.startTimeStart,
      });
    } else if (params.startTimeEnd) {
      qb.andWhere("record.start_time <= :end", { end: params.startTimeEnd });
    }
    // 加分页
    qb.skip((page - 1) * pageSize).take(pageSize);

    // 最后执行
    const [list, total]= await qb
      .orderBy("record.startTime", "DESC")
      .getManyAndCount();
      return {
        list,
        total,
        page,
        pageSize,
      }
  }
}
const meetRoomRecordDao = new MeetRoomRecordDao();
export default meetRoomRecordDao;
