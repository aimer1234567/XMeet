import { types } from "mediasoup";
import Peer from "./peer";
import { ConsumeReq } from "../req/mediaReq";
import config from "../../common/config/config";
import { ErrorEnum } from "../../common/enums/errorEnum";
import Result from "../../common/result";
export default class Room {
  peers = new Map<string, Peer>();
  mediaCodecs: any;
  router!: types.Router;
  constructor(
    public roomId: string,
    public worker: types.Worker,
    public userId: string
  ) {
    let mediaCodecs:any = config.mediasoup.router.mediaCodecs;
    this.worker
      .createRouter({mediaCodecs})
      .then((router) => {
        this.router = router
        console.log('-----------------rtp-------------------',this.router.rtpCapabilities)
      });
  }

  addPeer(peer: Peer) {
    this.peers.set(peer.peerId, peer);
  }
  getProducerListForPeer() {
    let producerList = new Array<{}>();
    //获取这个房间的所有用户
    this.peers.forEach((peer) => {
      //获取用户的所有生产者·
      peer.producers.forEach((producer) => {
        producerList.push({
          producerId: producer.id,
        });
      });
    });
    return producerList;
  }

  getRtpCapabilities() {
    let rtpCapabilities=this.router.rtpCapabilities;
    console.log('-------------------------------',rtpCapabilities)
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

  async connectPeerTransport(userId:string , transportId:string, dtlsParameters:unknown ) {
    await this.peers.get(userId)!.connectTransport(transportId, dtlsParameters)
  }

  async produce(userId:string,producerTransportId:string, rtpParameters:types.RtpParameters, kind:types.MediaKind){
    return new Promise(async (resolve, reject) => {
      let producer=await this.peers.get(userId)!.createProducer(producerTransportId, rtpParameters, kind)
      resolve(producer.id)
      //TODO:广播有新的生产者
      //broadCast(userid, 'producer', data)
    });
  }
  // broadCast(userid:string, , data) {
  //   for (let otherID of Array.from(this.peers.keys()).filter((id) => id !== socket_id)) {
  //     this.send(otherID, name, data)
  //   }
  // }

  // async consume(consumeReq: ConsumeReq, userId: string) {
  //   // handle nulls
  //   if (
  //     !this.router.canConsume({
  //       producerId: consumeReq.producerId,
  //       rtpCapabilities: consumeReq.rtpCapabilities,
  //     })
  //   ) {
  //     console.error("can not consume", { producerId: consumeReq.producerId });
  //     return;
  //   }

  //   let { consumer, params } = await this.peers
  //     .get(userId)!
  //     .createConsumer(
  //       consumeReq.consumerTransportId,
  //       consumeReq.producerId,
  //       consumeReq.rtpCapabilities
  //     );

  //   consumer.on(
  //     "producerclose",
  //     function () {
  //       console.log("Consumer closed due to producerclose event", {
  //         name: `${this.peers.get(socket_id).name}`,
  //         consumer_id: `${consumer.id}`,
  //       });
  //       this.peers.get(socket_id).removeConsumer(consumer.id);
  //       // tell client consumer is dead
  //       this.io.to(socket_id).emit("consumerClosed", {
  //         consumer_id: consumer.id,
  //       });
  //     }.bind(this)
  //   );

  //   return params;
  // }
}
