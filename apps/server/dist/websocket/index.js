"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
exports.broadcast = broadcast;
exports.broadcastAccessLog = broadcastAccessLog;
exports.broadcastStats = broadcastStats;
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../config/index");
let wss;
const clients = new Set();
function setupWebSocket(server) {
    wss = new ws_1.WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws, req) => {
        // 简单认证
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        if (!token) {
            ws.close(4001, 'Authentication required');
            return;
        }
        try {
            jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default-secret');
        }
        catch {
            ws.close(4001, 'Invalid token');
            return;
        }
        clients.add(ws);
        console.log('WebSocket client connected, total:', clients.size);
        ws.on('close', () => {
            clients.delete(ws);
            console.log('WebSocket client disconnected, total:', clients.size);
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            clients.delete(ws);
        });
    });
}
// 广播消息给所有客户端
function broadcast(data) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(message);
        }
    });
}
// 广播访问日志
async function broadcastAccessLog(accessLogId) {
    try {
        const log = await index_1.prisma.accessLog.findUnique({
            where: { id: accessLogId },
            include: {
                user: { select: { id: true, username: true } },
                file: { select: { id: true, name: true } },
            },
        });
        if (log) {
            broadcast({
                type: 'access',
                data: {
                    ...log,
                    bytesSent: log.bytesSent.toString(),
                },
            });
        }
    }
    catch (error) {
        console.error('Broadcast access log error:', error);
    }
}
// 广播统计数据更新
async function broadcastStats() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalFiles, totalSizeResult, todayAccess, todayTrafficResult] = await Promise.all([
            index_1.prisma.file.count(),
            index_1.prisma.file.aggregate({ _sum: { size: true } }),
            index_1.prisma.accessLog.count({ where: { createdAt: { gte: today } } }),
            index_1.prisma.accessLog.aggregate({
                where: { createdAt: { gte: today } },
                _sum: { bytesSent: true },
            }),
        ]);
        broadcast({
            type: 'stats',
            data: {
                totalFiles,
                totalSize: totalSizeResult._sum.size?.toString() || '0',
                todayAccess,
                todayTraffic: todayTrafficResult._sum.bytesSent?.toString() || '0',
            },
        });
    }
    catch (error) {
        console.error('Broadcast stats error:', error);
    }
}
//# sourceMappingURL=index.js.map