import { Request, Response, NextFunction } from "express";
import MeetRoomService from "../services/meetRoomService";
import { plainToInstance } from "class-transformer";
import "reflect-metadata";
import {
  CreateMeetRoomReq,
  CreateMeetRoomInstantReq,
  QueryMeetRoomRecordReq,
} from "../models/req/meetRoomReq";
export default class MeetRoomController {
  meetRoomService: MeetRoomService = new MeetRoomService();
  async createMeetRoomInstant(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers["userId"] as string;
    try {
      const data = plainToInstance(
        CreateMeetRoomInstantReq,
        req.body as object
      );
      const result = await this.meetRoomService.createMeetRoomInstant(
        userId,
        data
      );
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
  async joinMeetRoom(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers["userId"] as string;
    try {
      const meetRoomId = req.body.meetRoomId;
      const result = await this.meetRoomService.joinMeetRoom(
        userId,
        meetRoomId
      );
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createAppointMeet(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers["userId"] as string;
    const data = plainToInstance(CreateMeetRoomReq, req.body as object);
    try {
      const result = await this.meetRoomService.createAppointMeet(userId, data);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAppointMeets(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers["userId"] as string;
    try {
      const result = await this.meetRoomService.getAppointMeets(userId);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getMeetRoomRecord(req: Request, res: Response, next: NextFunction){
    const userId = req.headers["userId"] as string;
    const data=plainToInstance(QueryMeetRoomRecordReq,req.body as object) // TODO: "class-validator"这个库可以验证参数的合法性
    try{
      const result=await this.meetRoomService.getMeetRoomRecord(userId,data)
      return res.json(result)
    }catch(err){
      next(err)
    }
  }
  getRecentMeeting(req: Request, res: Response){
    const userId = req.headers["userId"] as string;
    const result=this.meetRoomService.getRecentMeeting(userId)
    return res.json(result)
  }

  async getMeetRoomSummary(req: Request, res: Response, next: NextFunction){
    const userId = req.headers["userId"] as string;
    try{
      const {meetId}=req.body
      const result=await this.meetRoomService.getMeetRoomSummary(userId,meetId)
      return res.json(result)
    }catch(err){
      next(err)
    }
  }
  async deleteAppointMeet(req: Request, res: Response, next: NextFunction){
    const userId = req.headers["userId"] as string;
    const meetRoomId=req.body.meetId as string
    try{
      const result=await this.meetRoomService.deleteAppointMeet(userId,meetRoomId)
      return res.json(result)
    }catch(err){
      next(err)
    }
  }
}
