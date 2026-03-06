import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/index';

let wss: WebSocketServer;
const clients = new Set<WebSocket>();

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // 简单认证
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    } catch {
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
export function broadcast(data: any) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 广播访问日志
export async function broadcastAccessLog(accessLogId: string) {
  try {
    const log = await prisma.accessLog.findUnique({
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
  } catch (error) {
    console.error('Broadcast access log error:', error);
  }
}

// 广播统计数据更新
export async function broadcastStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalFiles, totalSizeResult, todayAccess, todayTrafficResult] = await Promise.all([
      prisma.file.count(),
      prisma.file.aggregate({ _sum: { size: true } }),
      prisma.accessLog.count({ where: { createdAt: { gte: today } } }),
      prisma.accessLog.aggregate({
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
  } catch (error) {
    console.error('Broadcast stats error:', error);
  }
}