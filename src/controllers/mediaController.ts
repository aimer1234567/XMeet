import { Request, Response, NextFunction } from 'express'
import {MediaService,mediaService} from '../services/mediaService'
import { ConnectTransportReq,ProduceReq,ConsumeReq} from '../models/req/mediaReq'
import MyError from '../common/myError'
export default class MediaController {
    mediaService:MediaService=mediaService
    async createRoom(req: Request, res: Response ,next:NextFunction) {
        let roomId=req.body.roomId
        let userId=req.headers['userId'] as string
        const result=await this.mediaService.createRoom(roomId,userId)
        return res.json(result)
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
            let result=await mediaService.produce(produceReq,userId)
            return res.json(result)
        }catch(err){
            next(err)
        }
    }

    getProducers(req: Request, res: Response){
        const userId=req.headers['userId'] as string
        return res.json(this.mediaService.getProducers(userId))
    }

    async consume(req: Request, res: Response,next:NextFunction){
        const userId=req.headers['userId'] as string
        try{
            let consumerTransportId=req.body.consumerTransportId
            let producerId=req.body.producerId
            let rtpCapabilities=req.body.rtpCapabilities
            let consumeReq=new ConsumeReq(consumerTransportId,producerId,rtpCapabilities)
            return res.json(await this.mediaService.consume(consumeReq,userId))
        }catch(err){
            next(err)
        }
    }
    closeProducer(req: Request, res: Response){
        const userId=req.headers['userId'] as string
        const producerId=req.body.producerId
        return res.json(mediaService.closeProducer(userId,producerId))
    }

    getStatus(req: Request, res: Response) {
        const userId=req.headers['userId'] as string
        return res.json(this.mediaService.getStatus(userId))
    }

    peerExec(req: Request, res: Response){
        const userId=req.headers['userId'] as string
        return res.json(this.mediaService.peerExec(userId))
    }
    closeRoom(req: Request, res: Response){
        const userId=req.headers['userId'] as string
        return res.json(this.mediaService.closeRoom(userId))
    }
    async getRouterStatus(req: Request, res: Response, next: NextFunction) {
        const userId=req.headers['userId'] as string
        try{
            return res.json(await this.mediaService.getRouterStatus(userId))
        }catch(err){
            next(err)
        }
    }

    async transferOwnership(req: Request, res: Response,next:NextFunction){
        const userId=req.headers['userId'] as string
        try{
            const roomOwnerUsername=req.body.username
            const result=await this.mediaService.transferOwnership(userId,roomOwnerUsername)
            return res.json(result) 
        }catch(err){
            next(err)
        }
    }
}