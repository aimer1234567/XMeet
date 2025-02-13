import { Request,Response } from "express";
import {CacheClass} from "memory-cache";
import MailUtils from "../commen/mailUtils";
import generateCaptcha from "../commen/generateCaptcha";
class UserController{
    cache=new CacheClass<string,number>()
    mailUtils:MailUtils=new MailUtils()
    getMailCaptcha(req:Request,res:Response){
        let mail=req.body.mail
        let captcha=generateCaptcha()
        try{
            this.mailUtils.sendCaptcha(mail,captcha)
            this.cache.get()
        }
    }
    register(req:Request,res:Response){

        return res.json({message:"ok"})
    }

}
