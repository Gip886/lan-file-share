"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("../../config/index");
const auth_1 = require("../../middleware/auth");
const error_1 = require("../../middleware/error");
const router = (0, express_1.Router)();
// 所有管理接口需要管理员权限
router.use(auth_1.authMiddleware);
router.use(auth_1.adminMiddleware);
// 获取用户列表
router.get('/users', async (req, res, next) => {
    try {
        const users = await index_1.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { accessLogs: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: users });
    }
    catch (error) {
        next(error);
    }
});
// 创建用户
router.post('/users', async (req, res, next) => {
    try {
        const { username, password, role = 'user' } = req.body;
        if (!username || !password) {
            throw (0, error_1.createError)(400, '用户名和密码不能为空');
        }
        const existing = await index_1.prisma.user.findUnique({
            where: { username },
        });
        if (existing) {
            throw (0, error_1.createError)(400, '用户名已存在');
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await index_1.prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role,
            },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
            },
        });
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
// 更新用户
router.put('/users/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role, password } = req.body;
        const data = {};
        if (role)
            data.role = role;
        if (password)
            data.password = await bcryptjs_1.default.hash(password, 10);
        const user = await index_1.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                username: true,
                role: true,
                updatedAt: true,
            },
        });
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
// 删除用户
router.delete('/users/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        // 不能删除自己
        if (id === req.userId) {
            throw (0, error_1.createError)(400, '不能删除自己的账户');
        }
        await index_1.prisma.user.delete({
            where: { id },
        });
        res.json({ success: true, message: '删除成功' });
    }
    catch (error) {
        next(error);
    }
});
// 获取系统信息
router.get('/system', async (req, res, next) => {
    try {
        const [userCount, fileCount, storagePathCount, accessLogCount,] = await Promise.all([
            index_1.prisma.user.count(),
            index_1.prisma.file.count(),
            index_1.prisma.storagePath.count(),
            index_1.prisma.accessLog.count(),
        ]);
        res.json({
            success: true,
            data: {
                userCount,
                fileCount,
                storagePathCount,
                accessLogCount,
                uptime: process.uptime(),
                nodeVersion: process.version,
                platform: process.platform,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map