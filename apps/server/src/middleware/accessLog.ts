import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/index';
import { parseUserAgent } from '@lan-file-share/utils';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      accessLogId?: string;
      startTime?: number;
    }
  }
}

// 访问日志中间件
export const accessLogMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  next();
};

// 流量记录中间件（用于视频流）
export const trafficLogMiddleware = (fileIdParam: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalEnd = res.end;
    let bytesSent = 0;

    // 拦截 write 调用以统计流量
    const originalWrite = res.write.bind(res);
    (res as any).write = (chunk: any, ...args: any[]) => {
      if (chunk) {
        bytesSent += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
      }
      return originalWrite(chunk, ...args);
    };

    res.end = ((chunk: any, ...args: any[]) => {
      if (chunk) {
        bytesSent += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
      }

      // 记录访问日志
      const duration = req.startTime ? (Date.now() - req.startTime) / 1000 : 0;
      const userId = (req as any).userId || null; // 匿名访问时为 null
      const fileId = req.params[fileIdParam];
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const device = parseUserAgent(req.headers['user-agent'] || '');

      if (fileId) {
        prisma.accessLog.create({
          data: {
            userId,
            fileId,
            ip,
            device,
            bytesSent: BigInt(bytesSent),
            duration,
          }
        }).catch(console.error);
      }

      return originalEnd.call(res, chunk, ...args as [any]);
    }) as any;

    next();
  };
};