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
import { logger } from "../common/logger";
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
    if (meetRoom.numLimit){
      if (meetRoom.numLimit > config.meetServer.maxPeer){
        meetRoom.numLimit = config.meetServer.maxPeer;
      }else if(meetRoom.numLimit < config.meetServer.minPeer){
        meetRoom.numLimit = config.meetServer.minPeer;
      }
    }else{
      meetRoom.numLimit = config.meetServer.minPeer;
    }
    meetRoom.remark = data.remark;
    const identifiers = await this.meetRoomDao.addMeetRoom(meetRoom);
    const meetRoomId = identifiers![0].id;
    return Result.succuss({ meetRoomId });
  }

  async joinMeetRoom(userId: string, meetRoomId: string) {
    if (userStatusManager.userHasRoom(userId)) {
      throw new MyError(ErrorEnum.UserInRoom);
    }
    const meetRoom = await this.meetRoomDao.getMeetRoomById(meetRoomId)
    if(!meetRoom){
            //判断房间是否存在或者关闭
                  console.log(1)
      throw new MyError(ErrorEnum.RoomNotExist);
    }
    if (meetRoom.isOver) {
                  console.log(2)
      throw new MyError(ErrorEnum.RoomNotExist);
    }
    if (!meetRoom.isStart) {
                  console.log(3)
      throw new MyError(ErrorEnum.MeetNotStart);
    }
    if (roomStatusManager.getRoomUserSetIng(meetRoomId).size >= meetRoom.numLimit){
      throw new MyError(ErrorEnum.RoomUserLimit);
    }
    logger.info("用户加入会议：" + userId);
    return Result.succuss()
  }

  async createAppointMeet(userId: string, data: CreateMeetRoomReq) {
    const appointMeetNumber = await meetRoomDao.getAppointMeetNumber(userId);
    if (appointMeetNumber >= config.meetServer.maxAppointMeetNumber) {
      //判断预约会议数量有没有超过限制
      throw new MyError(ErrorEnum.AppointMeetNumberLimit);
    }
    const meetRoom = plainToInstance(MeetRoom, data);
    if (meetRoom.numLimit){
      if (meetRoom.numLimit > config.meetServer.maxPeer){
        meetRoom.numLimit = config.meetServer.maxPeer;
      }else if(meetRoom.numLimit < config.meetServer.minPeer){
        meetRoom.numLimit = config.meetServer.minPeer;
      }
    }else{
      meetRoom.numLimit = config.meetServer.minPeer;
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
    const {lang}= await this.userDao.selectById(userId);
    const durationPieChart = meetRoomRecord!.durationPieChart;
    const chatHeatMap = meetRoomRecord!.chatHeatMap;
    let wordCloud
    let wordCloudMatch=meetRoomRecord!.wordCloud?.find(item => item.lang === lang)
    if (wordCloudMatch){
      wordCloud = wordCloudMatch.wordFrequencyArray;
    }
    let summaryText = "";
    const summaryMatch = meetRoomRecord!.summary?.find(item => item.lang === lang);
    if (summaryMatch) {
      summaryText = summaryMatch.summary;
    }
    return Result.succuss({
      durationPieChart,
      chatHeatMap,
      wordCloud,
      summary:summaryText
    });
  }

  async deleteAppointMeet(userId: string, meetRoomId: string) {
    const meetRoom = await this.meetRoomDao.getMeetRoomById(meetRoomId);
    if (!meetRoom) {
      throw new MyError(ErrorEnum.RoomNotExist);
    }
    if (meetRoom.creatorId !== userId) {
      throw new MyError(ErrorEnum.NoPermission);
    }
    await this.meetRoomDao.deleteAppointMeet(meetRoomId);
    return Result.succuss();
  }
}
