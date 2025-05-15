import AppDataSource from "../common/config/database";
import MyError from "../common/myError";
import User from "../models/entity/user";
export class UserDao {
  private userRepository = AppDataSource.getRepository(User);
  async selectByUsername(username: string) {
    const user=await this.userRepository.findOneBy({ userName: username });
    if (!user) {
      throw new MyError(`User with id ${username} not found`);
    }
    return user;
  }
  async selectById(id: string){
    const user= await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new MyError(`User with id ${id} not found`);
    }
    return user;
  }
  async updateUserInfo(id:string,name:string,lang:string){
    const user=await this.userRepository.findOneBy({id:id})
    if(!user){
      throw new MyError(`User with id ${id} not found`);
    }
    user.name=name
    user.lang=lang
    await this.userRepository.save(user)
    return user
  }
}
const userDao = new UserDao();
export { userDao };
