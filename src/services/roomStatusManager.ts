import MyError from "../common/myError";
import { ErrorEnum } from "../common/enums/errorEnum";
import userStatusManager from "./userStatusManager";
class RoomStatus{
    roomId: string;
    roomOwner: string;
    userIdSet= new Set<string>();
    constructor(roomId: string,roomOwner:string) {
      this.roomId = roomId;
      this.roomOwner = roomOwner;
    }
    addUserByUserId(userId:string){
        if(!this.userIdSet.has(userId)){
            this.userIdSet.add(userId)
        }
    }

     deleteUserByUserId(userId:string){
        if(this.userIdSet.has(userId)){
            this.userIdSet.delete(userId)
        }
    }
    getRoomOwner(){
        return this.roomOwner
    }
}
class RoomStatusManager{
    roomStatusMap=new Map<string,RoomStatus>();
    addRoomStatus(userId:string,roomId:string){
        if(this.roomStatusMap.has(roomId)){
            throw new MyError(ErrorEnum.RoomIsExist)
        }
        const roomStatus=new RoomStatus(roomId,userId);
        this.roomStatusMap.set(roomId,roomStatus);
    }
    deleteRoomStatus(roomId:string){
        if(!this.roomStatusMap.has(roomId)){
            throw new MyError(ErrorEnum.RoomNotExist)
        }
        this.roomStatusMap.delete(roomId);
    }
    hasRoomStatus(roomId:string){
        return this.roomStatusMap.has(roomId);
    }
    roomAddUser(roomId:string,userId:string){
        if(!this.roomStatusMap.has(roomId)){
            throw new MyError(ErrorEnum.RoomNotExist)
        }
        this.roomStatusMap.get(roomId)!.addUserByUserId(userId);
    }
    roomDeleteUser(roomId:string,userId:string){
        if(!this.roomStatusMap.has(roomId)){
            throw new MyError(ErrorEnum.RoomNotExist)
        }
        const roomStatus=this.roomStatusMap.get(roomId);
        roomStatus!.deleteUserByUserId(userId)
    }

    getRoomUserSet(roomId:string){
        if(!this.roomStatusMap.has(roomId)){
            throw new MyError(ErrorEnum.RoomNotExist)
        }
        return this.roomStatusMap.get(roomId)!.userIdSet
    }
    getRoomUserList(roomId:string){
        if(!this.roomStatusMap.has(roomId)){
            throw new MyError(ErrorEnum.RoomNotExist)
        }
        const userList:{username:string,name:string}[]=[];
        this.roomStatusMap.get(roomId)!.userIdSet.forEach((userId)=>{
            const username=userStatusManager.getUserName(userId)
            const name=userStatusManager.getName(userId)
            userList.push({username,name})
        })
        return userList
    }

    getRoomOwner(roomId:string){
        if(!this.roomStatusMap.has(roomId)){
            throw new MyError(ErrorEnum.RoomNotExist)
        }
        return this.roomStatusMap.get(roomId)!.getRoomOwner()
    }
}

export const roomStatusManager=new RoomStatusManager();