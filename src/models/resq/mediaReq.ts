export class ConsumeReq{
    constructor(
        public consumerTransportId:string,
        public producerId:string,
        public rtpCapabilities:any,
    ){}
}