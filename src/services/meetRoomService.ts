import meetRoomDao from "../dao/meetRoomDao";
import { userDao, UserDao } from "../dao/userDao";
import {
  CreateMeetRoomReq,
  CreateMeetRoomInstantReq,
  QueryMeetRoomRecordReq,
} from "../models/req/meetRoomReq";
import MeetRoom from "../models/entity/meetRoom";
import { plainToInstance } from "class-transformer";
import Result from "../common/result";
import userStatusManager from "./userStatusManager";
import { ErrorEnum } from "../common/enums/errorEnum";
import MyError from "../common/myError";
import meetRoomRecordDao from "../dao/meetRoomRecordDao";
export default class meetRoomService {
  meetRoomDao = meetRoomDao;
  userDao: UserDao = userDao;
  meetRoomRecordDao=meetRoomRecordDao;
  // TODO: 没有房间关闭这个状态！在数据库查询到房间关闭了，就要标记，不再让用户进来
  // TODO: 因为有些发起会议的用户可能意外退出，导致其创建的房间没有被删除，但是其又不是那个房间的成员。所以需要定时任务来删除没有被使用的房间。
  // TODO: 同时当用户要再次创建房间时，需要判断是否已经存在他创建的房间（roomOwner）正在运行
  async createMeetRoomInstant(userId: string, data: CreateMeetRoomInstantReq) {
    if (userStatusManager.userHasRoom(userId)) {
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
    let meetRoomId = identifiers![0].id;
    return Result.succuss({ meetRoomId });
  }

  async joinMeetRoom(userId: string, meetRoomId: string) {
    if (userStatusManager.userHasRoom(userId)) {
      throw new MyError(ErrorEnum.UserInRoom);
    }
    const meetRoom = await this.meetRoomDao.getMeetRoomById(meetRoomId);
    if (!meetRoom) {
      throw new MyError(ErrorEnum.RoomNotExist);
    }
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

  async getMeetRoomRecord(userId: string, data: QueryMeetRoomRecordReq) {
    const  params={
      userId:userId,
      name:data.meetRoomName,
      startTimeStart: data.startTime,
      startTimeEnd: data.endTime,
      page: data.page, // 当前页码
      pageSize:data.pageSize // 每页大小
    }
    const queryResult= await this.meetRoomRecordDao.queryMeetRecords(params);
    return Result.succuss(queryResult)
  }
}
