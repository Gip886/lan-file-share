"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../config/index");
const error_1 = require("./error");
const authMiddleware = async (req, res, next) => {
    try {
        // 优先从 Authorization header 获取 token，其次从 query 参数获取
        const authHeader = req.headers.authorization;
        let token;
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (req.query.token && typeof req.query.token === 'string') {
            token = req.query.token;
        }
        if (!token) {
            throw (0, error_1.createError)(401, '未提供认证令牌');
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default-secret');
        const user = await index_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, username: true, role: true },
        });
        if (!user) {
            throw (0, error_1.createError)(401, '用户不存在');
        }
        req.userId = user.id;
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next((0, error_1.createError)(401, '无效的认证令牌'));
        }
        else {
            next(error);
        }
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return next((0, error_1.createError)(403, '需要管理员权限'));
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=auth.js.map