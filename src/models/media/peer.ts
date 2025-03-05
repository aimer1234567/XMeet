import { types } from "mediasoup";
export default class Peer{
    producers=new Map<string,types.Producer>()
    transports=new Map<string,types.Transport>()
    constructor(
        public peerId:string,
    ){}

    getProducer(producerId:string){
        return this.producers.get(producerId)
    }
    addTransport(transport:types.Transport) {
      this.transports.set(transport.id, transport)
    }

    async connectTransport(transportId:string, dtlsParameters:unknown) {
      if (!this.transports.has(transportId)) return
      await this.transports.get(transportId)!.connect({
        dtlsParameters: dtlsParameters
      })
    }
    
    async createProducer(producerTransportId:string, rtpParameters:types.RtpParameters, kind:types.MediaKind){
      let producer:types.Producer = await this.transports.get(producerTransportId)!.produce({
        kind,rtpParameters
      })
      this.producers.set(producer.id, producer)
      producer.on(
        'transportclose',
        () => {
          console.log('Producer transport close', { name: `${this.peerId}`, consumer_id: `${producer.id}` })
          producer.close()
          this.producers.delete(producer.id)
        }
      )
      return producer
    }

    // async createConsumer(consumer_transport_id:string, producer_id:string , rtpCapabilities:string) {
    //     let consumerTransport = this.transports.get(consumer_transport_id)
    
    //     let consumer = null
    //     try {
    //       consumer = await consumerTransport.consume({
    //         producerId: producer_id,
    //         rtpCapabilities,
    //         paused: false //producer.kind === 'video',
    //       })
    //     } catch (error) {
    //       console.error('Consume failed', error)
    //       return
    //     }
    
    //     if (consumer.type === 'simulcast') {
    //       await consumer.setPreferredLayers({
    //         spatialLayer: 2,
    //         temporalLayer: 2
    //       })
    //     }
    
    //     this.consumers.set(consumer.id, consumer)
    
    //     consumer.on(
    //       'transportclose',
    //       function () {
    //         console.log('Consumer transport close', { name: `${this.name}`, consumer_id: `${consumer.id}` })
    //         this.consumers.delete(consumer.id)
    //       }.bind(this)
    //     )
    
    //     return {
    //       consumer,
    //       params: {
    //         producerId: producer_id,
    //         id: consumer.id,
    //         kind: consumer.kind,
    //         rtpParameters: consumer.rtpParameters,
    //         type: consumer.type,
    //         producerPaused: consumer.producerPaused
    //       }
    //     }
    //   }

}