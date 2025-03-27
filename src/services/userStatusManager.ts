import { Socket } from "socket.io";
import MyError from "../common/myError";
import { ErrorEnum } from "../common/enums/errorEnum";
class UserStatus {
  public userId: string;
  public isRoomId: boolean = false;
  public roomId?: string;
  public webSocket: Socket;
  public constructor(userId: string, webSocket: Socket) {
    this.userId = userId;
    this.webSocket = webSocket;
  }
  public setRoomId(roomId: string) {
    this.roomId = roomId;
    this.isRoomId = true;
  }
  public getRoomId() {
    return this.roomId;
  }
  public getIsRoom() {
    return this.isRoomId;
  }
}
class UserStatusManager {
  private userStatusMap: Map<string, UserStatus> = new Map();
  public addUser(userId: string, webSocket: Socket) {
    this.userStatusMap.set(userId, new UserStatus(userId, webSocket));
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
    return this.userStatusMap.get(userId)!.isRoomId;
  }
  public setUserRoomId(userId: string, roomId: string) {
    const userStatus = this.getUserStatus(userId);
    userStatus.isRoomId = true;
    userStatus.roomId = roomId;
  }
  public getUserRoomId(userId: string): string {
    const userStatus = this.getUserStatus(userId);
    if (!userStatus.isRoomId) {
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
    userStatus.isRoomId = false;
  }
}
export default new UserStatusManager();
