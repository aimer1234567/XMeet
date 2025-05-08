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
import { roomStatusManager } from "./roomStatusManager";
import config from "../common/config/config";
export default class MeetRoomService {
  meetRoomDao = meetRoomDao;
  userDao: UserDao = userDao;
  meetRoomRecordDao = meetRoomRecordDao;
  //
  async createMeetRoomInstant(userId: string, data: CreateMeetRoomInstantReq) {
    if (userStatusManager.userHasRoom(userId)) {
      throw new MyError(ErrorEnum.UserInRoom);
    }
    if (roomStatusManager.isInstantRoomOwner(userId)) {
      throw new MyError(ErrorEnum.UserIsRoomOwner);
    }
    const meetRoom = plainToInstance(MeetRoom, {});
    meetRoom.creatorId = userId;
    meetRoom.startTime = new Date();
    meetRoom.durationMinutes = 90;
    meetRoom.isOver = false;
    meetRoom.isStart = true;
    if (!data.name) {
      const { name } = await this.userDao.selectById(userId);
      meetRoom.name = `${name}的临时会议`;
    } else {
      meetRoom.name = data.name;
    }
    meetRoom.isInstant = true;
    if (!data.password) {
      meetRoom.isPassword = false;
    } else {
      meetRoom.isPassword = true;
    }
    meetRoom.password = data.password;
    meetRoom.remark = data.remark;
    const identifiers = await this.meetRoomDao.addMeetRoom(meetRoom);
    const meetRoomId = identifiers![0].id;
    return Result.succuss({ meetRoomId });
  }

  async joinMeetRoom(userId: string, meetRoomId: string) {
    if (userStatusManager.userHasRoom(userId)) {
      throw new MyError(ErrorEnum.UserInRoom);
    }
    const meetRoom = await this.meetRoomDao.getMeetRoomById(meetRoomId);
    if (!meetRoom || meetRoom.isOver) {
      //判断房间是否存在或者关闭
      throw new MyError(ErrorEnum.RoomNotExist);
    }
    return Result.succuss({
      isPassword: meetRoom.isPassword,
    });
  }

  async createAppointMeet(userId: string, data: CreateMeetRoomReq) {
    const appointMeetNumber = await meetRoomDao.getAppointMeetNumber(userId);
    if (appointMeetNumber >= config.meetServer.maxAppointMeetNumber) {
      //判断预约会议数量有没有超过限制
      throw new MyError(ErrorEnum.AppointMeetNumberLimit);
    }
    const meetRoom = plainToInstance(MeetRoom, data);
    if (!meetRoom.password) {
      meetRoom.isPassword = false;
    } else {
      meetRoom.isPassword = true;
    }
    if (!meetRoom.remark) {
      meetRoom.remark = "";
    }
    meetRoom.isOver = false;
    meetRoom.isInstant = false;
    meetRoom.isStart = false;
    meetRoom.creatorId = userId;
    const identifiers = await this.meetRoomDao.addMeetRoom(meetRoom);
    return Result.succuss({ meetRoomId: identifiers![0].id });
  }

  async getAppointMeets(userId: string) {
    const appointMeets = await meetRoomDao.getAppointMeets(userId);
    return Result.succuss({ appointMeets });
  }

  async getMeetRoomRecord(userId: string, data: QueryMeetRoomRecordReq) {
    const params = {
      userId: userId,
      name: data.meetRoomName,
      startTimeStart: data.startTime,
      startTimeEnd: data.endTime,
      page: data.page, // 当前页码
      pageSize: data.pageSize, // 每页大小
    };
    const queryResult = await this.meetRoomRecordDao.queryMeetRecords(params);
    return Result.succuss(queryResult);
  }

  getRecentMeeting(userId: string) {
    const userJoinRoomList = roomStatusManager.getUserJoinRoomList(userId);
    return Result.succuss({ userJoinRoomList }); //返回的列表可能是空的
  }

  async getMeetRoomSummary(userId: string, roomId: string) {
    // TODO: 检查用户是否有权限
    const meetRoomRecord = await this.meetRoomRecordDao.queryMeetRecordById(
      roomId
    );
    const durationPieChart = meetRoomRecord!.durationPieChart;
    const chatHeatMap = meetRoomRecord!.chatHeatMap;
    const wordCloud = meetRoomRecord!.wordCloud;
    const summary = meetRoomRecord!.summary
    return Result.succuss({
      durationPieChart,
      chatHeatMap,
      wordCloud,
      summary
    });
  }
}
