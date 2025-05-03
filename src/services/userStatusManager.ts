import { Socket } from "socket.io";
import MyError from "../common/myError";
import { ErrorEnum } from "../common/enums/errorEnum";
import { randomUUID } from "crypto";
import { userDao } from "../dao/userDao";
class UserStatus {
  public session: string;
  public userId: string;
  public userName: string;
  public name: string;
  public lang: "zh" | "en";
  public webSocket: Socket;
  public hasRoom: boolean = false;
  public roomId?: string;
  public currentUserSubtitle?: string;
  public constructor(
    userId: string,
    webSocket: Socket,
    session: string,
    userName: string,
    name: string,
    lang: "zh" | "en"
  ) {
    this.userId = userId;
    this.webSocket = webSocket;
    this.session = session;
    this.userName = userName;
    this.name = name;
    this.lang = lang;
  }
  public setRoomId(roomId: string) {
    this.roomId = roomId;
    this.hasRoom = true;
  }
  public getRoomId() {
    return this.roomId;
  }
  public getIsRoom() {
    return this.hasRoom;
  }
}
class UserStatusManager {
  userStatusMap: Map<string, UserStatus> = new Map();
  public async addUser(userId: string, webSocket: Socket) {
    const user = await userDao.selectById(userId);
    this.userStatusMap.set(
      userId,
      new UserStatus(
        userId,
        webSocket,
        randomUUID(),
        user.userName,
        user.name,
        user.lang as any
      )
    );
  }
  public deleteUser(userId: string) {
    this.userStatusMap.delete(userId);
  }
  private getUserStatus(userId: string) {
    const userStatus = this.userStatusMap.get(userId);
    if (!userStatus) {
      throw new MyError(ErrorEnum.UserIsNone);
    }
    return userStatus;
  }
  public hasUser(userId: string) {
    return this.userStatusMap.has(userId);
  }
  public userHasRoom(userId: string): boolean {
    if (!this.userStatusMap.has(userId)) {
      return false;
    }
    return this.userStatusMap.get(userId)!.hasRoom;
  }
  public setUserRoomId(userId: string, roomId: string) {
    const userStatus = this.getUserStatus(userId);
    userStatus.hasRoom = true;
    userStatus.roomId = roomId;
  }
  public getUserRoomId(userId: string): string {
    const userStatus = this.getUserStatus(userId);
    if (!userStatus.hasRoom) {
      throw new MyError(ErrorEnum.UserNotInRoom);
    }
    return userStatus.roomId as string;
  }

  public getUserWebSocket(userId: string) {
    const userStatus = this.getUserStatus(userId);
    return userStatus.webSocket;
  }

  public deleteUserRoomId(userId: string) {
    const userStatus = this.getUserStatus(userId);
    userStatus.hasRoom = false;
  }
  public getUserSession(userId: string) {
    const userStatus = this.getUserStatus(userId);
    return userStatus.session;
  }
  public getUserName(userId: string) {
    const userStatus = this.getUserStatus(userId);
    return userStatus.userName;
  }
  public getName(userId: string) {
    const userStatus = this.getUserStatus(userId);
    return userStatus.name;
  }
  public getUserLang(userId: string) {
    const userStatus = this.getUserStatus(userId);
    return userStatus.lang;
  }
}
export default new UserStatusManager();
