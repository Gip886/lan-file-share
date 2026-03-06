"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../../config/index");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// 获取统计数据
router.get('/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalFiles, totalSizeResult, todayAccess, todayTrafficResult, activeDevices,] = await Promise.all([
            index_1.prisma.file.count(),
            index_1.prisma.file.aggregate({
                _sum: { size: true },
            }),
            index_1.prisma.accessLog.count({
                where: {
                    createdAt: { gte: today },
                },
            }),
            index_1.prisma.accessLog.aggregate({
                where: {
                    createdAt: { gte: today },
                },
                _sum: { bytesSent: true },
            }),
            index_1.prisma.accessLog.groupBy({
                by: ['ip'],
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        res.json({
            success: true,
            data: {
                totalFiles,
                totalSize: totalSizeResult._sum.size?.toString() || '0',
                todayAccess,
                todayTraffic: todayTrafficResult._sum.bytesSent?.toString() || '0',
                activeDevices: activeDevices.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取访问日志
router.get('/logs', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { page = 1, pageSize = 50, userId, fileId, ip } = req.query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (fileId)
            where.fileId = fileId;
        if (ip)
            where.ip = { contains: ip };
        const [logs, total] = await Promise.all([
            index_1.prisma.accessLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1) * Number(pageSize),
                take: Number(pageSize),
                include: {
                    user: {
                        select: { id: true, username: true },
                    },
                    file: {
                        select: { id: true, name: true },
                    },
                },
            }),
            index_1.prisma.accessLog.count({ where }),
        ]);
        res.json({
            success: true,
            data: {
                items: logs.map(log => ({
                    ...log,
                    bytesSent: log.bytesSent.toString(),
                })),
                total,
                page: Number(page),
                pageSize: Number(pageSize),
                totalPages: Math.ceil(total / Number(pageSize)),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取设备列表
router.get('/devices', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const devices = await index_1.prisma.accessLog.groupBy({
            by: ['ip', 'device'],
            _count: { id: true },
            _sum: { bytesSent: true },
            _max: { createdAt: true },
            orderBy: {
                _max: { createdAt: 'desc' },
            },
        });
        res.json({
            success: true,
            data: devices.map(d => ({
                ip: d.ip,
                device: d.device,
                requestCount: d._count.id,
                totalBytes: d._sum.bytesSent?.toString() || '0',
                lastSeen: d._max.createdAt,
            })),
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取流量统计（按日期）
router.get('/traffic', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(days));
        startDate.setHours(0, 0, 0, 0);
        // SQLite 日期分组查询
        const logs = await index_1.prisma.accessLog.findMany({
            where: {
                createdAt: { gte: startDate },
            },
            select: {
                createdAt: true,
                bytesSent: true,
            },
        });
        // 在内存中按日期分组
        const trafficMap = new Map();
        for (const log of logs) {
            const date = log.createdAt.toISOString().split('T')[0];
            const existing = trafficMap.get(date) || { requests: 0, bytes: BigInt(0) };
            existing.requests++;
            existing.bytes += log.bytesSent;
            trafficMap.set(date, existing);
        }
        const traffic = Array.from(trafficMap.entries())
            .map(([date, data]) => ({
            date,
            requests: data.requests,
            bytes: data.bytes.toString(),
        }))
            .sort((a, b) => a.date.localeCompare(b.date));
        res.json({
            success: true,
            data: traffic,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map