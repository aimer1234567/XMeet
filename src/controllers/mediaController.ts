import { Request, Response, NextFunction } from 'express'
import {MediaService,mediaService} from '../services/mediaService'
import { ConnectTransportReq,ProduceReq} from '../models/req/mediaReq'
import MyError from '../common/myError'
export default class MediaController {
    mediaService:MediaService=mediaService
    createRoom(req: Request, res: Response) {
        let roomId=req.body.roomId
        let userId=req.headers['userId'] as string
        return res.json(this.mediaService.createRoom(roomId,userId))
    }
    joinRoom(req: Request, res: Response){
        let roomId=req.body.roomId
        let userId=req.headers['userId'] as string
        return res.json(this.mediaService.joinRoom(roomId,userId))
    }
    getRouterRtpCapabilities(req: Request, res: Response){
        let userId=req.headers['userId'] as string
        return res.json(this.mediaService.getRouterRtpCapabilities(userId))
    }
    async createWebRtcTransport(req: Request, res: Response,next:NextFunction){
        const userId=req.headers['userId'] as string
        try{
            return res.json(await this.mediaService.createWebRtcTransport(userId))
        }catch(err){
            if(err instanceof MyError){
                next(err)
            }
        }
    }
    async connectTransport(req: Request, res: Response,next:NextFunction){
        try{
            const userId=req.headers['userId'] as string
            let transportId=req.body.transportId
            let dtlsParameters=req.body.dtlsParameters
            let connectTransport=new ConnectTransportReq(transportId,dtlsParameters)
            return res.json(await this.mediaService.connectTransport(connectTransport,userId))     
        }catch(err){
            next(err)
        }
    }
    /**
     * 产生生产者
     * @param req 
     * @param res 
     * @param next 
     * @returns produceId
     */

    async produce(req: Request, res: Response, next: NextFunction) {
        const userId=req.headers['userId'] as string
        try{
            let producerTransportId=req.body.producerTransportId
            let kind=req.body.kind
            let rtpParameters=req.body.rtpParameters
            let produceReq=new ProduceReq(producerTransportId,kind,rtpParameters)
            let result=mediaService.produce(produceReq,userId)
            return res.json(result)
        }catch(err){
            next(err)
        }
    }

    getProducers(req: Request, res: Response){
        const userId=req.headers['userId'] as string
        this.mediaService.getProducers(userId)
    }
}