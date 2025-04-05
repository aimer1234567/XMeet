import AppDataSource from "../common/config/database";
import MyError from "../common/myError";
import MeetUser from "../models/entity/meetUser";
class MeetUserDao {
    private meetUserRepository = AppDataSource.getRepository(MeetUser);
  /**
   * 批量插入用户到会议
   * 注意：insert 不会自动调用实体的构造函数（所以传对象即可）
   */
  async insertUsersToMeet(meetId: string, userIds: string[]) {
    const data = userIds.map(userId => ({
      meetId,
      userId
    }));

    await this.meetUserRepository
      .createQueryBuilder()
      .insert()
      .into(MeetUser)
      .values(data)
      .orIgnore() // 避免唯一索引冲突时抛错（可选）
      .execute();
  }
}

export default new MeetUserDao();