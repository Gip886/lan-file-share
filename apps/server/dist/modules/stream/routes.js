"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const express_1 = require("express");
const index_1 = require("../../config/index");
const auth_1 = require("../../middleware/auth");
const accessLog_1 = require("../../middleware/accessLog");
const utils_1 = require("@lan-file-share/utils");
const error_1 = require("../../middleware/error");
const router = (0, express_1.Router)();
// 所有流媒体请求都需要认证和访问日志
router.use(auth_1.authMiddleware);
router.use(accessLog_1.accessLogMiddleware);
// 视频流播放
router.get('/video/:id', (0, accessLog_1.trafficLogMiddleware)('id'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const file = await index_1.prisma.file.findUnique({
            where: { id },
        });
        if (!file) {
            throw (0, error_1.createError)(404, '文件不存在');
        }
        if (!fs_1.default.existsSync(file.path)) {
            throw (0, error_1.createError)(404, '文件已被删除或移动');
        }
        const stat = fs_1.default.statSync(file.path);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            // Range 请求 - 支持拖动进度条
            const parsedRange = (0, utils_1.parseRangeHeader)(range, fileSize);
            if (!parsedRange) {
                throw (0, error_1.createError)(416, '无效的 Range 请求');
            }
            const [start, end] = parsedRange;
            const chunkSize = end - start + 1;
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Length', chunkSize);
            res.setHeader('Content-Type', file.mimeType);
            const stream = fs_1.default.createReadStream(file.path, { start, end });
            stream.pipe(res);
        }
        else {
            // 完整文件请求
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Content-Type', file.mimeType);
            res.setHeader('Accept-Ranges', 'bytes');
            const stream = fs_1.default.createReadStream(file.path);
            stream.pipe(res);
        }
    }
    catch (error) {
        next(error);
    }
});
// 下载文件
router.get('/download/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const file = await index_1.prisma.file.findUnique({
            where: { id },
        });
        if (!file) {
            throw (0, error_1.createError)(404, '文件不存在');
        }
        if (!fs_1.default.existsSync(file.path)) {
            throw (0, error_1.createError)(404, '文件已被删除或移动');
        }
        res.download(file.path, file.name);
    }
    catch (error) {
        next(error);
    }
});
// 获取缩略图
router.get('/thumbnail/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const file = await index_1.prisma.file.findUnique({
            where: { id },
            select: { thumbnail: true },
        });
        if (!file?.thumbnail) {
            throw (0, error_1.createError)(404, '缩略图不存在');
        }
        res.sendFile(file.thumbnail);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map