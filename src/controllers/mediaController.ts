import { Request, Response, NextFunction } from 'express'
import MediaService from '../services/mediaService'
export default class MediaController {
    mediaService:MediaService=new MediaService()
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
    getProducers(req: Request, res: Response){
        const userId=req.headers['userId'] as string
        this.mediaService.getProducers(userId)
    }
    createWebRtcTransport(req: Request, res: Response){
        const userId=req.headers['userId'] as string
        return res.json(this.mediaService.createWebRtcTransport(userId))
    }
}