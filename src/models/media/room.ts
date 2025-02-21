import { types } from "mediasoup";
import Peer from "./peer";
import { ConsumeReq } from "../resq/mediaReq";
import config from "../../common/config/config";
export default class Room {
  peers = new Map<string, Peer>();
  mediaCodecs: any;
  router!: types.Router;
  constructor(
    public roomId: string,
    public worker: types.Worker,
    public userId: string
  ) {
    this.mediaCodecs = config.mediasoup.router.mediaCodecs;
    worker
      .createRouter(this.mediaCodecs)
      .then((router) => (this.router = router));
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

  async consume(consumeReq: ConsumeReq, userId: string) {
    // handle nulls
    if (
      !this.router.canConsume({
        producerId: consumeReq.producerId,
        rtpCapabilities:consumeReq.rtpCapabilities,
      })
    ) {
      console.error("can not consume");
      return ;
    }

    let { consumer, params } = await this.peers.get(userId)!
      .createConsumer(consumeReq.consumerTransportId, consumeReq.producerId, consumeReq.rtpCapabilities);

    consumer.on(
      "producerclose",
      function () {
        console.log("Consumer closed due to producerclose event", {
          name: `${this.peers.get(socket_id).name}`,
          consumer_id: `${consumer.id}`,
        });
        this.peers.get(socket_id).removeConsumer(consumer.id);
        // tell client consumer is dead
        this.io.to(socket_id).emit("consumerClosed", {
          consumer_id: consumer.id,
        });
      }.bind(this)
    );

    return params;
  }
}
