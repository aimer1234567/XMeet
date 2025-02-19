// middlewares/errorHandler.js
import { NextFunction, Request, Response } from 'express';
import Result from '../common/result';
export default function errorHandler(err:Error, req:Request, res:Response, next:NextFunction) {
    return res.json(Result.error(err.message))
  }
  

  