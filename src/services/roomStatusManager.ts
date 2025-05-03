import MyError from "../common/myError";
import { ErrorEnum } from "../common/enums/errorEnum";
import userStatusManager from "./userStatusManager";
import meetRoomRecordDao from "../dao/meetRoomRecordDao";
import meetRoomDao from "../dao/meetRoomDao";
import MeetRoomRecord from "../models/entity/meetRoomRecord";
import dayjs from "dayjs";
import meetSummaryUtil from "../ai/meetSummary";
import meetUserDao from "../dao/meetUserDao";
class RoomStatus {
  roomId: string;
  roomOwner: string;
  roomName: string;
  isInstant: boolean;
  userIdSetIng = new Set<string>();
  userIdSetJoin = new Set<string>();
  startTime: Date;
  constructor(
    roomId: string,
    roomOwner: string,
    startTime: Date,
    roomName: string,
    isInstant: boolean
  ) {
    this.roomId = roomId;
    this.roomOwner = roomOwner;
    this.startTime = startTime;
    this.roomName = roomName;
    this.isInstant = isInstant;
  }
  addUserByUserId(userId: string) {
    if (!this.userIdSetIng.has(userId)) {
      this.userIdSetIng.add(userId);
    }
    if (!this.userIdSetJoin.has(userId)) {
      this.userIdSetJoin.add(userId);
    }
  }

  deleteUserByUserId(userId: string) {
    if (this.userIdSetIng.has(userId)) {
      this.userIdSetIng.delete(userId);
    }
  }
  getRoomOwner() {
    return this.roomOwner;
  }
  hasUserIng(userId: string) {
    if (this.userIdSetIng.has(userId)) {
      return true;
    } else {
      return false;
    }
  }
  setRoomOwner(userId: string) {
    this.roomOwner = userId;
  }
}
/**
 * 房间状态管理
 */
class RoomStatusManager {
  roomStatusMap = new Map<string, RoomStatus>();
  async addRoomStatus(userId: string, roomId: string) {
    if (this.roomStatusMap.has(roomId)) {
      throw new MyError(ErrorEnum.RoomIsExist);
    }
    const meetRoom = await meetRoomDao.getMeetRoomById(roomId);
    const roomStatus = new RoomStatus(
      roomId,
      userId,
      new Date(),
      meetRoom.name,
      meetRoom.isInstant
    );
    this.roomStatusMap.set(roomId, roomStatus);
  }
  addAppointRoomStatus(userId:string,roomId:string,roomName:string,isInstant:boolean){
    if (this.roomStatusMap.has(roomId)) {
      throw new MyError(ErrorEnum.RoomIsExist);
    }
    this.roomStatusMap.set(roomId, new RoomStatus(
      roomId,
      userId,
      new Date(),
      roomName,
      isInstant
    ));
  }
  async closeRoomStatus(roomId: string) {
    if (!this.roomStatusMap.has(roomId)) {
      throw new MyError(ErrorEnum.RoomNotExist);
    }
    let roomStatus = this.roomStatusMap.get(roomId) as RoomStatus;
    const endTime = dayjs();
    const diffMinute = endTime.diff(dayjs(roomStatus.startTime), "minute");
    //关闭会议状态
    meetRoomDao.updateIsOver(roomId);
    //写入会议记录
    const { name } = await meetRoomDao.getMeetRoomById(roomId);
    meetUserDao.insertUsersToMeet(roomId, [...roomStatus.userIdSetJoin]);
    await meetRoomRecordDao.addMeetRoomRecord(
      new MeetRoomRecord(
        roomId,
        roomStatus.startTime,
        diffMinute,
        name,
        roomStatus.roomOwner
      )
    );
    await meetSummaryUtil.summary(roomId);
    //启动会议总结任务
    this.roomStatusMap.delete(roomId);
  }
  hasRoomStatus(roomId: string) {
    return this.roomStatusMap.has(roomId);
  }
  roomAddUser(roomId: string, userId: string) {
    if (!this.roomStatusMap.has(roomId)) {
      throw new MyError(ErrorEnum.RoomNotExist);
    }
    this.roomStatusMap.get(roomId)!.addUserByUserId(userId);
  }
  roomDeleteUser(roomId: string, userId: string) {
    if (!this.roomStatusMap.has(roomId)) {
      throw new MyError(ErrorEnum.RoomNotExist);
    }
    const roomStatus = this.roomStatusMap.get(roomId);
    roomStatus!.deleteUserByUserId(userId);
  }

  getRoomUserSetIng(roomId: string) {
    if (!this.roomStatusMap.has(roomId)) {
      throw new MyError(ErrorEnum.RoomNotExist);
    }
    return this.roomStatusMap.get(roomId)!.userIdSetIng;
  }
  getUserJoinRoomList(userId: string) {
    const list: { roomName: string; roomId: string }[] = [];
    this.roomStatusMap.forEach((roomStatus, key) => {
      if (
        roomStatus.userIdSetJoin.has(userId) ||
        roomStatus.roomOwner === userId
      ) {
        list.push({ roomName: roomStatus.roomName, roomId: roomStatus.roomId });
      }
    });
    return list;
  }
  getRoomUserListIng(roomId: string) {
    if (!this.roomStatusMap.has(roomId)) {
      throw new MyError(ErrorEnum.RoomNotExist);
    }
    const userList: { username: string; name: string }[] = [];
    this.roomStatusMap.get(roomId)!.userIdSetIng.forEach((userId) => {
      const username = userStatusManager.getUserName(userId);
      const name = userStatusManager.getName(userId);
      userList.push({ username, name });
    });
    return userList;
  }

  getRoomOwner(roomId: string) {
    if (!this.roomStatusMap.has(roomId)) {
      throw new MyError(ErrorEnum.RoomNotExist);
    }
    return this.roomStatusMap.get(roomId)!.getRoomOwner();
  }

  isInstantRoomOwner(userId: string) {
    for (const roomStatus of this.roomStatusMap.values()) {
      if (roomStatus.roomOwner === userId && roomStatus.isInstant === true) {
        return true;
      }
    }
  }
  transferOwnership(roomOwnerId: string, roomId: string) {
    if (!this.roomStatusMap.has(roomId)) {
      throw new MyError(ErrorEnum.RoomNotExist);
    }
    const roomStatus = roomStatusManager.roomStatusMap.get(roomId)!;
    if (!roomStatus.hasUserIng(roomOwnerId)) {
      throw new MyError(ErrorEnum.UserNotInRoom);
    }
    roomStatus.setRoomOwner(roomOwnerId);
  }
}

export const roomStatusManager = new RoomStatusManager();
