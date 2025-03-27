import { types } from "mediasoup";
import Peer from "./peer";
import config from "../../common/config/config";
import { ErrorEnum } from "../../common/enums/errorEnum";
import MyError from "../../common/myError";
export default class Room {
  peers = new Map<string, Peer>();
  mediaCodecs!: types.RtpCodecCapability[];
  router!: types.Router;
  constructor(
    public roomId: string,
    public worker: types.Worker,
    public roomMaster: string
  ) {
    this.mediaCodecs= config.mediasoup.router.mediaCodecs as types.RtpCodecCapability[]
    this.worker.createRouter({ mediaCodecs:this.mediaCodecs }).then((router) => {
      this.router = router;
    });
  }

  addPeer(peer: Peer) {
    this.peers.set(peer.peerId, peer);
  }
  getProducerListForPeer(userId: string) {
    let producerList = new Array<{producerId:string}>();
    //获取这个房间的所有用户
    this.peers.forEach((peer) => {
      //获取用户的所有生产者·
      if(userId===peer.peerId){
        return
      }
      peer.producers.forEach((producer) => {
        producerList.push({
          producerId: producer.id,
        });
      });
    });
    return producerList;
  }
  

  getRtpCapabilities() {
    let rtpCapabilities = this.router.rtpCapabilities;
    return rtpCapabilities;
  }

  async createWebRtcTransport(userId: string) {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate } =
      config.mediasoup.webRtcTransport;
    const transport = await this.router.createWebRtcTransport({
      listenIps: config.mediasoup.webRtcTransport.listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch (error) {}
    }
    transport.on(
      "dtlsstatechange",
      function (dtlsState: types.DtlsState) {
        if (dtlsState === "closed") {
          console.log("Transport close", { userId });
          transport.close();
        }
      }.bind(this)
    );
    transport.observer.on("close", () => {
      console.log("Transport close", { userId });
    });
    console.log("Adding transport", { transportId: transport.id });
    if (this.peers.get(userId) === undefined) {
      throw new Error(ErrorEnum.PeerNotExist);
    }
    this.peers.get(userId)!.addTransport(transport); //TODO: 未找到对应的peer
    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  async connectPeerTransport(
    userId: string,
    transportId: string,
    dtlsParameters: unknown
  ) {
    await this.peers.get(userId)!.connectTransport(transportId, dtlsParameters);
  }

  async produce(
    userId: string,
    producerTransportId: string,
    rtpParameters: types.RtpParameters,
    kind: types.MediaKind
  ) {
    return new Promise(async (resolve, reject) => {
      let producer = await this.peers
        .get(userId)!
        .createProducer(producerTransportId, rtpParameters, kind);
      resolve(producer.id);
      //TODO:广播有新的生产者
      //broadCast(userid, 'producer', data)
    });
  }
  // broadCast(userid:string, , data) {
  //   for (let otherID of Array.from(this.peers.keys()).filter((id) => id !== socket_id)) {
  //     this.send(otherID, name, data)
  //   }
  // }
  async consume(
    userId: string,
    consumerTransportId:string ,
    producerId:string ,
    rtpCapabilities:types.RtpCapabilities
  ) {
    console.error(`${userId}:消费生产者${producerId}`)
    if (
      !this.router.canConsume({
        producerId: producerId,
        rtpCapabilities: rtpCapabilities,
      })
    ) {
      throw new MyError("不能消费");
    }
    let {consumer,params}=await this.peers.get(userId)!.createConsumer(
      userId,
      consumerTransportId,
      producerId,
      rtpCapabilities
    );
    return params
  }
  deletePeer(userId:string){
    let peer=this.peers.get(userId)
    peer?.close()
    this.peers.delete(userId)
  }

  closeProducer(userId:string,producerId:string){
    
    this.peers.get(userId)!.closeProducer(producerId);
  }
}
