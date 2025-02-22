import express from "express";
import MediaController from "../controllers/mediaController";
const router=express.Router();
const mediaController=new MediaController();
router.post('/createRoom',(req,res)=>mediaController.createRoom(req,res))
router.post('/joinRoom',(req,res)=>mediaController.joinRoom(req,res))
router.post('/createRoom',(req,res)=>mediaController.createRoom(req,res))
router.post('/joinRoom',(req,res)=>mediaController.joinRoom(req,res))
router.post('/getRouterRtpCapabilities',(req,res)=>mediaController.getRouterRtpCapabilities(req,res))
router.post('/createWebRtcTransport',(req,res)=>mediaController.(req,res))
router.post('')


