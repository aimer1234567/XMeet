import {Request, Response, NextFunction} from 'express'
import MeetRoomService from '../services/meetRoomService';
import { plainToInstance } from 'class-transformer';
import "reflect-metadata";
import { CreateMeetRoomReq,CreateMeetRoomReqInstant } from '../models/req/meetRoomReq';
export default class MeetRoomController {
    meetRoomService:MeetRoomService=new MeetRoomService()
    async createMeetRoomInstant(req: Request, res: Response,next:NextFunction){
        const userId=req.headers['userId'] as string
        try{
            const data=plainToInstance(CreateMeetRoomReqInstant,req.body as object)
            const result=await this.meetRoomService.createMeetRoomInstant(userId,data)
            return res.json(result)
        }catch(err){
            next(err)
        }
    }
    async joinMeetRoom(req: Request, res: Response,next:NextFunction){
        const userId=req.headers['userId'] as string
        try{
            const meetRoomId=req.body.meetRoomId
            return res.json(await this.meetRoomService.joinMeetRoom(userId,meetRoomId))
        }catch(err){
            next(err)
        }
    }

    async createMeetRoom(req: Request, res: Response,next:NextFunction){
        const userId=req.headers['userId'] as string
        const data=plainToInstance(CreateMeetRoomReq,req.body as object)
        try{
            const result=await this.meetRoomService.createMeetRoom(userId,data)
            return res.json(result)
        }catch(err){
            next(err)
        }
    }
}