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
import { speechRecognitionUtil } from "../ai/speechRecognition";
import userStatusManager from "./userStatusManager";
import { userDao } from "../dao/userDao";
import { roomStatusManager } from "./roomStatusManager";
import IntervalUtil from "../utils/intervalUtil";
import { logger } from "../common/logger";
import { taskScheduler } from "../utils/taskScheduler";
import meetRoomDao from "../dao/meetRoomDao";
class MediaService {
  userStatusManager = userStatusManager;
  roomList: Map<string, Room> = new Map(); //房间列表
  workers: Array<types.Worker<types.AppData>> = []; //mediasoup工作线程
  overMRInterval = new IntervalUtil();
  speechRecognition = speechRecognitionUtil;
  userDao = userDao;
  nextMediasoupWorkerIdx = 0; //mediasoup工作线程索引
  constructor() {}

  /**
   * 初始化会议服务
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
    //设置websocket连接关闭时，广播此用户退出房间，并删除此用户
    webSocketServer.OnDisconnect(async (userId) => {
      try {
        if (this.userStatusManager.userHasRoom(userId)) {
          const roomId = this.userStatusManager.getUserRoomId(userId);
          roomStatusManager.roomDeleteUser(roomId, userId);
          const username = userStatusManager.getUserName(userId);
          roomStatusManager.getRoomUserSetIng(roomId).forEach((userId) => {
            //广播给房间中的用户，同步客户端房间用户信息，有用户退出房间
            webSocketServer.send(userId, "peerExec", { username });
          });
        }
        let roomId = this.userStatusManager.getUserRoomId(userId);
        this.roomList.get(roomId)!.deletePeer(userId);
      } catch (err) {
        return;
      }
    });
    //设置定时任务，定时启动会议
    taskScheduler.addTask("meetStart", 1, async () => {
      const appointMeets = await meetRoomDao.getAllAppointMeets();
      appointMeets.forEach(async (meet) => {
        if (this.roomList.has(meet.id)) {
          return  //房间存在则
        } else {
          let worker = this.getMediasoupWorker();
          this.roomList.set(meet.id, new Room(meet.id, worker, meet.creatorId));
          roomStatusManager.addAppointRoomStatus(meet.creatorId, meet.id,meet.name,meet.isInstant); // 添加房间状态
          logger.info("create room", {roomId: meet.id });
        }
      });
      const ids = appointMeets.map(meet => meet.id)
      meetRoomDao.updateIsStarted(ids);
    });
    //设置定时任务，定时关闭会议
    taskScheduler.addTask("meetEnd", 1, async () => {
      const meets = await meetRoomDao.getAllNotOverMeets()
      meets.forEach(async (meet) => {
        if(!roomStatusManager.hasRoomStatus(meet.id)){
          return
        }
        roomStatusManager.getRoomUserSetIng(meet.id).forEach((userId) => {
          //广播给房间中的用户，当前房间关闭
          webSocketServer.send(userId, "roomClose", null);
          this.userStatusManager.deleteUserRoomId(userId);
        });
        roomStatusManager.closeRoomStatus(meet.id);
        this.roomList.get(meet.id)!.closeRoom();
        this.roomList.delete(meet.id);
      });
      const ids = meets.map(meet => meet.id)
      meetRoomDao.updateListIsOver(ids);
    });
  }

  /**
   * 创建会议室
   * @param roomId
   * @returns
   */

  async createRoom(roomId: string, userId: string) {
    if (this.roomList.has(roomId)) {
      return Result.succuss({ isRoom: false, roomId: roomId }); // TODO: 用于测试
    } else {
      if (this.userStatusManager.userHasRoom(userId)) {
        return Result.succuss({ isRoom: false, roomId: roomId });
      }
      let worker = this.getMediasoupWorker();
      this.roomList.set(roomId, new Room(roomId, worker, userId));
      await roomStatusManager.addRoomStatus(userId, roomId); // 添加房间状态
      logger.info("create room", { roomId });
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
    if (!this.roomList.has(roomId)) {
      return Result.error(ErrorEnum.RoomNotExist);
    }
    if (this.userStatusManager.userHasRoom(userId)) {
      return Result.error(ErrorEnum.UserInRoom);
    }
    this.roomList.get(roomId)!.addPeer(new Peer(userId));
    roomStatusManager.roomAddUser(roomId, userId); // 在房间状态管理中将用户添加到房间中
    this.userStatusManager.setUserRoomId(userId, roomId); //在用户状态管理中设置用户所在的房间id
    const peerList = roomStatusManager.getRoomUserListIng(roomId);
    webSocketServer.send(userId, "roomAllPeer", { peerList }); // 发送用户列表给当前用户
    const username = userStatusManager.getUserName(userId);
    const name = userStatusManager.getName(userId);
    roomStatusManager.getRoomUserSetIng(roomId).forEach((otherUserId) => {
      //广播给房间中的用户，同步客户端房间用户信息，有用户进入房间
      if (otherUserId === userId) {
        return;
      }
      webSocketServer.send(otherUserId, "newPeer", { username, name });
    });
    const roomOwner = roomStatusManager.getRoomOwner(roomId);
    const isRoomOwner = roomOwner === userId;
    logger.info("join room", { roomId, userId });
    return Result.succuss({ isRoomOwner });
  }
  /**
   * 返回客户端的rtp参数
   * @param userId
   * @returns
   */
  getRouterRtpCapabilities(userId: string) {
    try {
      let roomId = this.userStatusManager.getUserRoomId(userId);
      logger.info("获取到RtpCapabilities:", { userId });
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
    try {
      let roomId = this.userStatusManager.getUserRoomId(userId);
      if (roomId === undefined) {
        throw new MyError(ErrorEnum.RoomNotExist);
      }
      const params = await this.roomList
        .get(roomId)
        ?.createWebRtcTransport(userId);
      logger.debug("创建传输通道", { userId });
      return Result.succuss(params);
    } catch (err) {
      if (err instanceof Error) {
        logger.error(err.message)
        throw new MyError(err.message);
      }
    }
  }

  async connectTransport(
    connectTransportReq: ConnectTransportReq,
    userId: string
  ) {
    try {
      let roomId = this.userStatusManager.getUserRoomId(userId);
      await this.roomList
        .get(roomId)!
        .connectPeerTransport(
          userId,
          connectTransportReq.transportId,
          connectTransportReq.dtlsParameters
        );
      logger.debug("连接传输通道", { userId });
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
      let user = await this.userDao.selectById(userId);
      this.speechRecognition.initRecognizer(userId, user.lang);
    }
    this.roomList.get(roomId)!.peers.forEach(async (peer) => {
      if (peer.peerId === userId) {
        return;
      }
      let user = await this.userDao.selectById(userId); // TODO: 前端接收后，存储每个视频连接的对应用户的姓名，username，
      webSocketServer.send(peer.peerId, "newProducers", {
        producerId,
        user: { username: user.userName, name: user.name },
      });
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
    roomStatusManager.roomDeleteUser(roomId, userId); // 删除房间状态管理中的用户
    const username = userStatusManager.getUserName(userId);
    roomStatusManager.getRoomUserSetIng(roomId).forEach((userId) => {
      //广播给房间中的用户，同步客户端房间用户信息，有用户退出房间
      webSocketServer.send(userId, "peerExec", { username });
    });
    return Result.succuss();
  }
  closeRoom(userId: string) {
    const roomId = this.userStatusManager.getUserRoomId(userId);
    if (roomStatusManager.getRoomOwner(roomId) !== userId) {
      throw new MyError(ErrorEnum.NoPermission);
    }
    roomStatusManager.getRoomUserSetIng(roomId).forEach((userId) => {
      //广播给房间中的用户，当前房间关闭
      webSocketServer.send(userId, "roomClose", null);
      this.userStatusManager.deleteUserRoomId(userId);
    });
    roomStatusManager.closeRoomStatus(roomId);
    this.roomList.get(roomId)!.closeRoom();
    this.roomList.delete(roomId);
    return Result.succuss();
  }

  async transferOwnership(userId: string, roomOwnerUsername: string) {
    const roomId = this.userStatusManager.getUserRoomId(userId);
    if (roomStatusManager.getRoomOwner(roomId) !== userId) {
      throw new MyError(ErrorEnum.NoPermission);
    }
    const user = await userDao.selectByUsername(roomOwnerUsername);
    if (userId === user.id) {
      return Result.error("不能将会议所有权转让给自己");
    }
    roomStatusManager.transferOwnership(user.id, roomId);
    webSocketServer.send(user.id, "newRoomOwner", null);
    return Result.succuss();
  }

  async getRouterStatus(userId: string) {
    let roomId = this.userStatusManager.getUserRoomId(userId);
    let params = await this.roomList.get(roomId)!.router.dump();
    console.log({ roomId, params });
    console.log(
      "userStatusManager------",
      Object.fromEntries(userStatusManager.userStatusMap)
    );
    console.log(
      "roomStatusManager------",
      Object.fromEntries(roomStatusManager.roomStatusMap)
    );
    return Result.succuss(params);
  }
}

const mediaService = new MediaService();
export { MediaService };
export { mediaService };
