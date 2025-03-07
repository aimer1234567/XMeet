import { types } from "mediasoup";

export class ConsumeReq{
    constructor(
        public consumerTransportId:string,
        public producerId:string,
        public rtpCapabilities:types.RtpCapabilities,
    ){}
}

export class ConnectTransportReq{
    constructor(
        public transportId:string,
        public dtlsParameters:unknown,
    ){}
}

export class ProduceReq{
    constructor(
        public producerTransportId:string,
        public kind:types.MediaKind,
        public rtpParameters:types.RtpParameters,
    ){}

}