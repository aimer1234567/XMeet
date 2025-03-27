import MeetRoomDao from "../dao/meetRoomDao";
import UserDao from "../dao/userDao";
import {
  CreateMeetRoomReq,
  CreateMeetRoomReqInstant,
} from "../models/req/meetRoomReq";
import MeetRoom from "../models/entity/meetRoom";
import { plainToInstance } from "class-transformer";
import Result from "../common/result";
import userStatusManager from "./userStatusManager";
import { ErrorEnum } from "../common/enums/errorEnum";
import MyError from "../common/myError";
export default class meetRoomService {
  meetRoomDao: MeetRoomDao = new MeetRoomDao();
  userDao: UserDao = new UserDao();
  async createMeetRoomInstant(userId: string, data: CreateMeetRoomReqInstant) {
    if(userStatusManager.userHasRoom(userId)){
      throw new MyError(ErrorEnum.UserInRoom);
    }
    const meetRoom = plainToInstance(MeetRoom, {});
    meetRoom.creatorId = userId;
    meetRoom.startTime = new Date();
    meetRoom.durationMinutes = 90;
    const { name } = await this.userDao.selectById(userId);
    if (!data.name) {
      meetRoom.name = `${name}的临时会议`;
    } else {
      meetRoom.name = data.name;
    }
    meetRoom.inviteOnly = false;
    meetRoom.isInstant = true;
    if (!data.password) {
      meetRoom.isPassword = false;
    } else {
      meetRoom.isPassword = true;
    }
    meetRoom.password = data.password;
    meetRoom.remark = data.remark;
    const identifiers = await this.meetRoomDao.addMeetRoom(meetRoom);
    return Result.succuss({ meetRoomId: identifiers![0].id });
  }

  async joinMeetRoom(userId: string, meetRoomId: string) {
    if(userStatusManager.userHasRoom(userId)){
      throw new MyError(ErrorEnum.UserInRoom);
    }
    const meetRoom = await this.meetRoomDao.getMeetRoomById(meetRoomId);
    return Result.succuss({
      isPassword: meetRoom.isPassword,
      inviteOnly: meetRoom.inviteOnly,
    });
  }

  async createMeetRoom(userId: string, data: CreateMeetRoomReq) {
    const meetRoom = plainToInstance(MeetRoom, data);
    meetRoom.creatorId = userId;
    const identifiers = await this.meetRoomDao.addMeetRoom(meetRoom);
    return Result.succuss({ roomId: identifiers![0].id });
  }
}
