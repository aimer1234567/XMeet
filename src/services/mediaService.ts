import Result from "../common/result";
import config from "../common/config/config";
import { createWorker } from "mediasoup";
import { types } from "mediasoup";
import Room from "../models/media/room";
import Peer from "../models/media/peer";
import { ErrorEnum } from "../common/enums/errorEnum";
import {
  ConsumeReq,
  ConnectTransportReq,
  ProduceReq,
} from "../models/req/mediaReq";
import MyError from "../common/myError";
import { webSocketServer } from "../webSocket/webSocketServer";
import { speechRecognitionUtil } from "../utils/speechRecognitionUtil";
import userStatusManager from "./userStatusManager";
import {userDao} from "../dao/userDao";
import { roomStatusManager } from "./roomStatusManager";
import IntervalUtil from "../utils/intervalUtil";
class MediaService {
  userStatusManager=userStatusManager;
  roomList: Map<string, Room> = new Map(); //房间列表
  workers: Array<types.Worker<types.AppData>> = []; //mediasoup工作线程
  overMRInterval=new IntervalUtil();
  speechRecognition = speechRecognitionUtil;
  userDao=userDao;
  nextMediasoupWorkerIdx = 0; //mediasoup工作线程索引
  constructor() {}
  /**
   * 创建会议室
   * @param roomId
   * @returns
   */

  createRoom(roomId: string, userId: string) {
    if (this.roomList.has(roomId)) {
      return Result.succuss({ isRoom: false, roomId: roomId }); // TODO: 用于测试
    } else {
      if(this.userStatusManager.userHasRoom(userId)){
        return Result.succuss({ isRoom: false, roomId: roomId });
      }
      console.log("create room", roomId);
      let worker = this.getMediasoupWorker();
      this.roomList.set(roomId, new Room(roomId, worker, userId));
      roomStatusManager.addRoomStatus(userId,roomId);  // 添加房间状态
      this.overMRInterval.add(roomId, config.meetServer.closeTime, () => {
        this.closeRoom(userId)
      });    // 添加会议超时，自动关闭房间
      return Result.succuss({ isRoom: true, roomId: roomId });
    }
  }
  /**
   * 加入会议室
   * @param roomId 会议室id
   * @param userId
   * @returns
   */
  joinRoom(roomId: string, userId: string) {
    console.log("join room", { roomId, userId });
    if (!this.roomList.has(roomId)) {
      return Result.error(ErrorEnum.RoomNotExist);
    }
    if (this.userStatusManager.userHasRoom(userId)) {
      return Result.error(ErrorEnum.UserInRoom);
    }
    this.roomList.get(roomId)!.addPeer(new Peer(userId));
    roomStatusManager.roomAddUser(roomId, userId);  // 在房间状态管理中添加此房间的用户
    this.userStatusManager.setUserRoomId(userId, roomId);  //在用户状态管理中设置用户所在的房间id
    const peerList = roomStatusManager.getRoomUserList(roomId);
    webSocketServer.send(userId, "roomAllPeer", {peerList})  // 发送用户列表给当前用户
    const username = userStatusManager.getUserName(userId);
    const name = userStatusManager.getName(userId);
    roomStatusManager.getRoomUserSet(roomId).forEach((otherUserId) => {  //广播给房间中的用户，同步客户端房间用户信息，有用户进入房间
      if(otherUserId===userId){
        return;
      }
      webSocketServer.send(otherUserId, "newPeer", {username,name})
    });
    return Result.succuss();
  }
  /**
   * 返回客户端的rtp参数
   * @param userId
   * @returns
   */
  getRouterRtpCapabilities(userId: string) {
    try {
      let roomId = this.userStatusManager.getUserRoomId(userId);
      console.log("Get RouterRtpCapabilities:", { userId });
      return Result.succuss(this.roomList.get(roomId)!.getRtpCapabilities());
    } catch (e) {
      if (e instanceof MyError) {
        return Result.error(e.message);
      }
    }
  }
  /**
   * chuangjian
   * @param userId
   * @returns
   */
  async createWebRtcTransport(userId: string) {
    console.log("createWebRtcTransport:", { userId });
    try {
      let roomId =  this.userStatusManager.getUserRoomId(userId);
      if (roomId === undefined) {
        throw new MyError(ErrorEnum.RoomNotExist);
      }
      const params = await this.roomList
        .get(roomId)
        ?.createWebRtcTransport(userId);
      return Result.succuss(params);
    } catch (err) {
      if (err instanceof MyError) {
        throw new MyError(err.message);
      }
    }
  }

  async connectTransport(
    connectTransportReq: ConnectTransportReq,
    userId: string
  ) {
    console.log("Connect transport", { userId });
    try {
      let roomId = this.userStatusManager.getUserRoomId(userId);
      await this.roomList
        .get(roomId)!
        .connectPeerTransport(
          userId,
          connectTransportReq.transportId,
          connectTransportReq.dtlsParameters
        );
      return Result.succuss();
    } catch (e) {
      if (e instanceof MyError) {
        throw new MyError(e.message);
      }
    }
  }

  async produce(produceReq: ProduceReq, userId: string) {
    let roomId = this.userStatusManager.getUserRoomId(userId);
    let producerId = await this.roomList
      .get(roomId)!
      .produce(
        userId,
        produceReq.producerTransportId,
        produceReq.rtpParameters,
        produceReq.kind
      );
    if (produceReq.kind === "audio") {
      let user=await this.userDao.selectById(userId)
      this.speechRecognition.initRecognizer(userId,user.lang);
    }
    this.roomList.get(roomId)!.peers.forEach(async (peer) => {
      if (peer.peerId === userId) {
        return;
      }
      let user=await this.userDao.selectById(userId) // TODO: 前端接收后，存储每个视频连接的对应用户的姓名，username，
      webSocketServer.send(peer.peerId, "newProducers", { producerId,user:{username:user.userName,name:user.name} });
    });
    console.log("produce", {
      type: produceReq.kind,
      userId,
      id: producerId,
    });
    console.log("生产者id", { userId, producerId });
    return Result.succuss(producerId);
  }
  /**
   * 客户端获取本房间所有人的生产通道
   * @param userId
   * @returns
   */
  getProducers(userId: string) {
    let roomId = this.userStatusManager.getUserRoomId(userId);
    let producerUserMap = this.roomList
      .get(roomId)!
      .getProducerUserMapForPeer(userId);
    console.log("getProducers:", { userId, roomId, producerUserMap });
    return Result.succuss(producerUserMap);
  }
  /**
   * @returns mediasoup工作线程
   */
  getMediasoupWorker() {
    const worker = this.workers[this.nextMediasoupWorkerIdx];

    if (++this.nextMediasoupWorkerIdx === this.workers.length)
      this.nextMediasoupWorkerIdx = 0;

    return worker;
  }
  /**
   * 创建mediasoup工作线程
   */
  async init() {
    let { numWorkers } = config.mediasoup; //从配置文件中获取工作线程数
    for (let i = 0; i < numWorkers; i++) {
      let worker = await createWorker({
        logLevel: config.mediasoup.worker.logLevel as types.WorkerLogLevel,
        logTags: config.mediasoup.worker.logTags as types.WorkerLogTag[],
        rtcMinPort: config.mediasoup.worker.rtcMinPort,
        rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
      });

      worker.on("died", () => {
        console.error(
          "mediasoup worker died, exiting in 2 seconds... [pid:%d]",
          worker.pid
        );
        setTimeout(() => process.exit(1), 2000);
      });
      this.workers.push(worker);
    }
    webSocketServer.OnDisconnect(async(userId) => {
      try{
        if(this.userStatusManager.userHasRoom(userId)){
          const roomId=this.userStatusManager.getUserRoomId(userId);
          roomStatusManager.roomDeleteUser(roomId,userId)
          const username = userStatusManager.getUserName(userId);
          roomStatusManager.getRoomUserSet(roomId).forEach((userId) => {  //广播给房间中的用户，同步客户端房间用户信息，有用户退出房间
            webSocketServer.send(userId, "peerExec", {username})
          });
        }
        let roomId = this.userStatusManager.getUserRoomId(userId);
        this.roomList.get(roomId)!.deletePeer(userId);
      }catch(err){
        return;
      }
    });
  }

  async consume(ConsumeReq: ConsumeReq, userId: string) {
    let roomId = this.userStatusManager.getUserRoomId(userId);
    let params = await this.roomList
      .get(roomId)!
      .consume(
        userId,
        ConsumeReq.consumerTransportId,
        ConsumeReq.producerId,
        ConsumeReq.rtpCapabilities
      );
    return Result.succuss(params);
  }
  closeProducer(userId: string, producerId: string) {
    let roomId = this.userStatusManager.getUserRoomId(userId);
    this.roomList.get(roomId)!.closeProducer(userId, producerId);
    return Result.succuss();
  }

  getStatus(userId: string) {
    let roomId = this.userStatusManager.getUserRoomId(userId);
    let transportIds = this.roomList
      .get(roomId)!
      .peers.get(userId)!
      .transports.keys();
    let producerIds = this.roomList
      .get(roomId)!
      .peers.get(userId)!
      .producers.keys();
    let consumerIds = this.roomList
      .get(roomId)!
      .peers.get(userId)!
      .consumers.keys();
    console.log({ userId, transportIds, producerIds, consumerIds });
    return Result.succuss();
  }

  peerExec(userId: string) {
    const roomId = this.userStatusManager.getUserRoomId(userId);
    this.roomList.get(roomId)!.deletePeer(userId);
    this.userStatusManager.deleteUserRoomId(userId);
    roomStatusManager.roomDeleteUser(roomId, userId);  // 删除房间状态管理中的用户
    const username = userStatusManager.getUserName(userId);
    roomStatusManager.getRoomUserSet(roomId).forEach((userId) => {  //广播给房间中的用户，同步客户端房间用户信息，有用户退出房间
      webSocketServer.send(userId, "peerExec", {username})
    });
    return Result.succuss();
  }
  closeRoom(userId: string) {
    const roomId = this.userStatusManager.getUserRoomId(userId);
    roomStatusManager.getRoomUserSet(roomId).forEach((userId) => {  //广播给房间中的用户，当前房间关闭
      webSocketServer.send(userId, "roomClose", null)
      this.userStatusManager.deleteUserRoomId(userId);
    });
    roomStatusManager.closeRoomStatus(roomId);
    this.roomList.get(roomId)!.closeRoom();
    return Result.succuss();
  }
  isRoomOwner(userId: string) {
    const roomId = this.userStatusManager.getUserRoomId(userId);
    const roomOwner=roomStatusManager.getRoomOwner(roomId);
    const isRoomOwner=roomOwner===userId;
    return  Result.succuss({isRoomOwner});
  }

  async getRouterStatus(userId: string) {
    let roomId = this.userStatusManager.getUserRoomId(userId);
    let params = await this.roomList.get(roomId)!.router.dump();
    console.log({ roomId, params });
    console.log("userStatusManager------",Object.fromEntries(userStatusManager.userStatusMap))
    console.log("roomStatusManager------",Object.fromEntries(roomStatusManager.roomStatusMap))
    return Result.succuss(params);
  }
}

const mediaService = new MediaService();
export { MediaService };
export { mediaService };
