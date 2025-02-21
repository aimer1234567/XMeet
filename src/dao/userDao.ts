import AppDataSource from "../common/config/database";
import User from "../models/entity/user";
export default class UserDao {
  private userRepository = AppDataSource.getRepository(User);
  async selectByUsername(username: string) {
    return await this.userRepository.findOneBy({ userName: username });
  }
}
