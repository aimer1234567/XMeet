import AppDataSource from "../common/config/database";
import MyError from "../common/myError";
import User from "../models/entity/user";
export default class UserDao {
  private userRepository = AppDataSource.getRepository(User);
  async selectByUsername(username: string) {
    return await this.userRepository.findOneBy({ userName: username });
  }
  async selectById(id: string){
    const user= await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new MyError(`User with id ${id} not found`);
    }
    return user;
  }
}
