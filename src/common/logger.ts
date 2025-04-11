// logger.js
import { createLogger, transports, format } from 'winston';
import config from '../common/config/config';
const logger = createLogger({
  level: config.log.level,
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    new transports.Console(), // 输出到控制台
    // new transports.File({ filename: config.log.file }) 
  ]
});

export {logger}