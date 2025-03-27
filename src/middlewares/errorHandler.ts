// middlewares/errorHandler.js
import { NextFunction, Request, Response } from 'express';
import Result from '../common/result';
import MyError from '../common/myError';
export default function errorHandler(err:MyError | Error, req:Request, res:Response, next:NextFunction) {
  if(err instanceof MyError){
    return res.status(200).json(Result.error(err.message))
  }
  if(err instanceof Error){
    return res.status(500).json(Result.error(err.message))
  }
}
  

  