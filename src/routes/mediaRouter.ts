import express from "express";
import MediaController from "../controllers/mediaController";
const router=express.Router();
const mediaController=new MediaController();
router.post('/createRoom',(req,res,next)=>mediaController.createRoom(req,res,next))
router.post('/joinRoom',(req,res)=>mediaController.joinRoom(req,res))
router.post('/getRouterRtpCapabilities',(req,res)=>mediaController.getRouterRtpCapabilities(req,res))
router.post('/createWebRtcTransport',(req,res,next)=>mediaController.createWebRtcTransport(req,res,next))
router.post('/connectTransport',(req,res,next)=>mediaController.connectTransport(req,res,next))
router.post('/produce',(req,res,next)=>mediaController.produce(req,res,next))
router.post('/getProducers',(req,res)=>mediaController.getProducers(req,res))
router.post('/consume',(req,res,next)=>mediaController.consume(req,res,next))
router.post('/closeProducer',(req,res)=>mediaController.closeProducer(req,res))
router.get('/peerExec',(req,res)=>mediaController.peerExec(req,res))
router.post('/isRoomOwner',(req,res)=>mediaController.isRoomOwner(req,res))
router.get('/closeRoom',(req,res)=>mediaController.closeRoom(req,res))
router.get('/getStatus',(req,res)=>mediaController.getStatus(req,res))
router.get('/getRouterStatus',(req,res,next)=>mediaController.getRouterStatus(req,res,next))
export default router;


