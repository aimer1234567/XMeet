import express from "express";
import MediaController from "../controllers/mediaController";
const router=express.Router();
const mediaController=new MediaController();
router.post('/createRoom',(req,res)=>mediaController.createRoom(req,res))
router.post('/joinRoom',(req,res)=>mediaController.joinRoom(req,res))