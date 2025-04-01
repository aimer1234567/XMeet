
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
}
class RoomStatusManager{
    roomStatusMap=new Map<string,RoomStatus>();
    addRoomStatus(userId:string,roomId:string){
        if(this.roomStatusMap.has(roomId)){
            return;
        }
        const roomStatus=new RoomStatus(roomId,userId);
        this.roomStatusMap.set(roomId,roomStatus);
    }
    deleteRoomStatus(roomId:string){
        if(!this.roomStatusMap.has(roomId)){
            return;
        }
        this.roomStatusMap.delete(roomId);
    }
    hasRoomStatus(roomId:string){
        return this.roomStatusMap.has(roomId);
    }
    roomAddUser(roomId:string,userId:string){
        if(!this.roomStatusMap.has(roomId)){
            return;
        }
        this.roomStatusMap.get(roomId)!.addUserByUserId(userId);
    }

    roomDeleteUser(roomId:string,userId:string){
        if(!this.roomStatusMap.has(roomId)){
            return;
        }
        const roomStatus=this.roomStatusMap.get(roomId);
        roomStatus!.deleteUserByUserId(userId)
    }

    getRoomUserSet(roomId:string){
        if(!this.roomStatusMap.has(roomId)){
            return new Set<string>();
        }
        return this.roomStatusMap.get(roomId)!.userIdSet
    }
}

export const roomStatusManager=new RoomStatusManager();