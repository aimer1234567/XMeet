import Result from "../common/result";
import config from "../common/config/config";
import {createWorker} from "mediasoup";
import { types } from "mediasoup";
import Room from "../models/media/room";
import Peer from "../models/media/peer";
import { ErrorEnum } from "../common/enums/errorEnum";
import { ConsumeReq, ConnectTransportReq,ProduceReq } from "../models/req/mediaReq";
import MyError from "../common/myError";
import {webSocketServer} from "../webSocket/webSocketServer";
class MediaService {
  roomList: Map<string, Room> = new Map(); //房间列表
  workers: Array<types.Worker<types.AppData>> = []; //mediasoup工作线程
  userIdToRoomId: Map<string, string> = new Map();
  nextMediasoupWorkerIdx = 0; //mediasoup工作线程索引
  constructor() {
  }
  /**
   * 创建会议室
   * @param roomId
   * @returns
   */

  createRoom(roomId: string, userId: string) {
    if (this.roomList.has(roomId)) {
      return Result.succuss({ isRoom: false, roomId: roomId })// TODO: 用于测试
    } else {
      console.log("create room", roomId);
      let worker = this.getMediasoupWorker();
      this.roomList.set(roomId, new Room(roomId, worker, userId));
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
    this.roomList.get(roomId)!.addPeer(new Peer(userId));
    this.userIdToRoomId.set(userId, roomId); //TODO: 优化，防止多次加入,记得退房时去除
    return Result.succuss();
  }
  /**
   * 返回客户端的rtp参数
   * @param userId
   * @returns
   */
  getRouterRtpCapabilities(userId: string) {
    try {
      let roomId = this.userIdToRoomId.get(userId);
      if (roomId === undefined) {
        throw new MyError(ErrorEnum.RoomNotExist);
      }
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
      let roomId = this.userIdToRoomId.get(userId);
      if (roomId === undefined) {
        throw new MyError(ErrorEnum.RoomNotExist);
      }
      const params = await this.roomList
        .get(roomId)
        ?.createWebRtcTransport(userId);
      return Result.succuss(params);
    } catch (err) {
      if (err instanceof MyError) {
        throw new MyError(err.msg);
      }
    }
  }

  async connectTransport(
    connectTransportReq: ConnectTransportReq,
    userId: string
  ) {
    console.log("Connect transport", { userId });
    try {
      let roomId = this.userIdToRoomId.get(userId);
      if (roomId === undefined) {
        throw new MyError(ErrorEnum.RoomNotExist);
      }
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
        throw new MyError(e.msg);
      }
    }
  }

  async produce(produceReq: ProduceReq,userId:string){
    let roomId = this.userIdToRoomId.get(userId);
    if (!roomId) {
      return Result.error(ErrorEnum.RoomNotExist);
    }
    let producerId =await this.roomList.get(roomId)!.produce(userId,produceReq.producerTransportId,produceReq.rtpParameters,produceReq.kind);
    this.roomList.get(roomId)!.peers.forEach((peer)=>{
      if(peer.peerId===userId){
        return
      }
      webSocketServer.send(peer.peerId,'newProducers',{producerId})
    })
    console.log('produce',{
      type:produceReq.kind,
      userId,
      id:producerId
    })
    console.log("生产者id",{userId,producerId})
    return Result.succuss(producerId)
  }
  /**
   * 客户端获取本房间所有人的生产通道
   * @param userId
   * @returns
   */
  getProducers(userId: string) {
    let roomId = this.userIdToRoomId.get(userId);
    if (!roomId) {
      return Result.error(ErrorEnum.RoomNotExist);
    }
    let producerList = this.roomList.get(roomId)!.getProducerListForPeer(userId);
    console.log("getProducers:", { userId, roomId, producerList });
    return Result.succuss(producerList);
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
    webSocketServer.OnDisconnect((userId) => {
    let roomId = this.userIdToRoomId.get(userId);
    if(!roomId){
      return;
    }
    this.roomList.get(roomId)?.deletePeer(userId)
})

      // log worker resource usage
      /*setInterval(async () => {
                  const usage = await worker.getResourceUsage();
      
                  console.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
              }, 120000);*/
    }
  }
  
  async consume(ConsumeReq:ConsumeReq,userId:string){
    let roomId=this.userIdToRoomId.get(userId);
    if (!roomId){
      return Result.error(ErrorEnum.RoomNotExist);
    }
    let params = await this.roomList.get(roomId)!.consume(userId,ConsumeReq.consumerTransportId,ConsumeReq.producerId,ConsumeReq.rtpCapabilities);
    return Result.succuss(params);
  }
  closeProducer(userId:string,producerId:string){
    let roomId=this.userIdToRoomId.get(userId);
    if (!roomId){
      return Result.error(ErrorEnum.RoomNotExist);
    }
    this.roomList.get(roomId)!.closeProducer(userId,producerId)
    return Result.succuss();
  }

  getStatus(userId:string){
    let roomId=this.userIdToRoomId.get(userId);
    if (!roomId){
      return Result.error(ErrorEnum.RoomNotExist);
    }
    let transportIds=this.roomList.get(roomId)!.peers.get(userId)!.transports.keys()
    let producerIds=this.roomList.get(roomId)!.peers.get(userId)!.producers.keys()
    let consumerIds=this.roomList.get(roomId)!.peers.get(userId)!.consumers.keys()
    console.log({ userId,transportIds,producerIds,consumerIds })
    return Result.succuss();
  }

  async getRouterStatus(userId:string){
    let roomId=this.userIdToRoomId.get(userId);
    if (!roomId){
      return Result.error(ErrorEnum.RoomNotExist);
    }
    let params=await this.roomList.get(roomId)!.router.dump()
    console.log({roomId,params})
    return Result.succuss(params);
  }
}

const mediaService=new MediaService()
export {MediaService};
export {mediaService};
