import express from "express"
import MeetRoomController from "../controllers/meetRoomController"
const router=express.Router()
const meetRoomController=new MeetRoomController()
router.post("/createMeetRoomInstant",(req,res,next)=>meetRoomController.createMeetRoomInstant(req,res,next))
router.post("/joinMeetRoom",(req,res,next)=>meetRoomController.joinMeetRoom(req,res,next))
router.post("/getMeetRoomRecord",(req,res,next)=>meetRoomController.getMeetRoomRecord(req,res,next))
router.post('/getMeetRoomSummary',(req,res,next)=>meetRoomController.getMeetRoomSummary(req,res,next))
export default router