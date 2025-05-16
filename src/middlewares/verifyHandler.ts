import { Request, Response, NextFunction } from "express";
import Result from "../common/result";
import { ErrorEnum } from "../common/enums/errorEnum";
import config from "../common/config/config";
import jwt  from "jsonwebtoken";
import {JwtPayload} from "jsonwebtoken";
export default function verifyHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const reqURL=req.url
  console.log(`-------------------${reqURL}------------`)
  if(reqURL==='/user/login' || reqURL==='/user/verifyCaptcha' || reqURL==='/user/getMailCaptcha'){
    console.log(`----------------不用验证-----------`)
    return next()
  }
  // 从请求头中获取 token
  const token = req.headers["authorization"];
  // 如果 token 不存在，返回 403 错误
  if (!token) {
    return res.status(403).json(Result.error(ErrorEnum.VerifyError));
  }
  try{
    let decoded = jwt.verify(token, config.jwt,{ignoreExpiration:false,algorithms:["HS256"]}) as JwtPayload;
    if (decoded && decoded.userId){
        req.headers['userId'] = decoded.userId; //传递用户的标识
    }
    return next();
  }catch(err){
    return res.status(403).json(Result.error(ErrorEnum.VerifyError));
  }
}
