import { types } from "mediasoup";
import { todo } from "node:test";
import { webSocketServer } from "../../webSocket/webSocketServer";
export default class Peer {
  producers = new Map<string, types.Producer>();
  consumers = new Map<string, types.Consumer>();
  transports = new Map<string, types.Transport>();
  constructor(public peerId: string) {}

  getProducer(producerId: string) {
    return this.producers.get(producerId);
  }
  addTransport(transport: types.Transport) {
    this.transports.set(transport.id, transport);
  }

  async connectTransport(transportId: string, dtlsParameters: unknown) {
    if (!this.transports.has(transportId)) {
      console.log(`transport not found -------------${transportId}`);
      return;}
    await this.transports.get(transportId)!.connect({
      dtlsParameters: dtlsParameters,
    });
  }

  async createProducer(
    producerTransportId: string,
    rtpParameters: types.RtpParameters,
    kind: types.MediaKind
  ) {
    let producer: types.Producer = await this.transports
      .get(producerTransportId)!
      .produce({
        kind,
        rtpParameters,
      });
      console.error("生产者id",producer.id)
    this.producers.set(producer.id, producer);
    producer.on("transportclose", () => {
      console.log("Producer transport close", {
        name: `${this.peerId}`,
        consumer_id: `${producer.id}`,
      });
      producer.close();
      this.producers.delete(producer.id);
    });
    return producer;
  }
  async createConsumer(
    userId: string,
    consumerTransportId: string,
    producerId: string,
    rtpCapabilities: types.RtpCapabilities
  ) {
    let consumerTransport = this.transports.get(consumerTransportId);
    let consumer = null;
    try {
      consumer = await consumerTransport!.consume({
        producerId: producerId,
        rtpCapabilities: rtpCapabilities,
        paused: false,
      });
    } catch (error) {
      throw new Error("无法消费");
    }
    this.consumers.set(consumer.id, consumer);
    consumer.on("transportclose", () => {
      console.log("consumer transport close", {
        name: `${this.peerId}`,
        consumerId: `${consumer.id}`,
      });
      consumer.close();
      this.consumers.delete(consumer.id);
    });
    consumer.on("producerclose", () => {
      this.consumers.get(consumer.id)?.close()
      this.consumers.delete(consumer.id);
      webSocketServer.send(userId,"consumerClosed",{
        consumerId: consumer.id,kind:consumer.kind
      })
      // TODO:  通过ws,告诉客户端删除该消费者
    });
    return {
      consumer,
      params: {
        producerId,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      },
    };
  }
  closeProducer(producerId:string){
    try{
      this.producers.get(producerId)!.close();
    }catch(e){
      console.error(e)
    }
    this.producers.delete(producerId);
  }

  close(){
    this.transports.forEach((transport)=>{
      transport.close()
    })
  }
}
