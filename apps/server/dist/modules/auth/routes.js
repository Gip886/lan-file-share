"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../../config/index");
const auth_1 = require("../../middleware/auth");
const error_1 = require("../../middleware/error");
const router = (0, express_1.Router)();
// 登录
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            throw (0, error_1.createError)(400, '用户名和密码不能为空');
        }
        const user = await index_1.prisma.user.findUnique({
            where: { username },
        });
        if (!user) {
            throw (0, error_1.createError)(401, '用户名或密码错误');
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            throw (0, error_1.createError)(401, '用户名或密码错误');
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '7d' });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取当前用户信息
router.get('/me', auth_1.authMiddleware, (req, res) => {
    res.json({
        success: true,
        data: req.user,
    });
});
// 修改密码
router.put('/password', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            throw (0, error_1.createError)(400, '旧密码和新密码不能为空');
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.userId },
        });
        if (!user) {
            throw (0, error_1.createError)(404, '用户不存在');
        }
        const isValid = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isValid) {
            throw (0, error_1.createError)(401, '旧密码错误');
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await index_1.prisma.user.update({
            where: { id: req.userId },
            data: { password: hashedPassword },
        });
        res.json({ success: true, message: '密码修改成功' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map