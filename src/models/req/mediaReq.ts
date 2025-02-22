export class ConsumeReq{
    constructor(
        public consumerTransportId:string,
        public producerId:string,
        public rtpCapabilities:any,
    ){}
}

export class ConnectTransportReq{
    constructor(
        public transportId:string,
        public dtlsParameters:unknown,
    ){}
}