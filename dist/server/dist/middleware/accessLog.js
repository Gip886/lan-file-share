"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trafficLogMiddleware = exports.accessLogMiddleware = void 0;
const index_1 = require("../config/index");
const utils_1 = require("@lan-file-share/utils");
// 访问日志中间件
const accessLogMiddleware = (req, res, next) => {
    req.startTime = Date.now();
    next();
};
exports.accessLogMiddleware = accessLogMiddleware;
// 流量记录中间件（用于视频流）
const trafficLogMiddleware = (fileIdParam) => {
    return async (req, res, next) => {
        const originalEnd = res.end;
        let bytesSent = 0;
        // 拦截 write 调用以统计流量
        const originalWrite = res.write.bind(res);
        res.write = (chunk, ...args) => {
            if (chunk) {
                bytesSent += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
            }
            return originalWrite(chunk, ...args);
        };
        res.end = ((chunk, ...args) => {
            if (chunk) {
                bytesSent += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
            }
            // 记录访问日志
            const duration = req.startTime ? (Date.now() - req.startTime) / 1000 : 0;
            const userId = req.userId || null; // 匿名访问时为 null
            const fileId = req.params[fileIdParam];
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const device = (0, utils_1.parseUserAgent)(req.headers['user-agent'] || '');
            if (fileId) {
                index_1.prisma.accessLog.create({
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
            return originalEnd.call(res, chunk, ...args);
        });
        next();
    };
};
exports.trafficLogMiddleware = trafficLogMiddleware;
//# sourceMappingURL=accessLog.js.map