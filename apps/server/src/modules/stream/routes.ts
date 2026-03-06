import fs from 'fs';
import { Router } from 'express';
import { prisma } from '../../config/index';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { accessLogMiddleware, trafficLogMiddleware } from '../../middleware/accessLog';
import { parseRangeHeader, getMimeType } from '@lan-file-share/utils';
import { createError } from '../../middleware/error';

const router: ReturnType<typeof Router> = Router();

// 所有流媒体请求都需要认证和访问日志
router.use(authMiddleware);
router.use(accessLogMiddleware);

// 视频流播放
router.get('/video/:id', trafficLogMiddleware('id'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw createError(404, '文件不存在');
    }

    if (!fs.existsSync(file.path)) {
      throw createError(404, '文件已被删除或移动');
    }

    const stat = fs.statSync(file.path);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Range 请求 - 支持拖动进度条
      const parsedRange = parseRangeHeader(range, fileSize);
      if (!parsedRange) {
        throw createError(416, '无效的 Range 请求');
      }

      const [start, end] = parsedRange;
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', file.mimeType);

      const stream = fs.createReadStream(file.path, { start, end });
      stream.pipe(res);
    } else {
      // 完整文件请求
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Accept-Ranges', 'bytes');

      const stream = fs.createReadStream(file.path);
      stream.pipe(res);
    }
  } catch (error) {
    next(error);
  }
});

// 下载文件
router.get('/download/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw createError(404, '文件不存在');
    }

    if (!fs.existsSync(file.path)) {
      throw createError(404, '文件已被删除或移动');
    }

    res.download(file.path, file.name);
  } catch (error) {
    next(error);
  }
});

// 获取缩略图
router.get('/thumbnail/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      select: { thumbnail: true },
    });

    if (!file?.thumbnail) {
      throw createError(404, '缩略图不存在');
    }

    res.sendFile(file.thumbnail);
  } catch (error) {
    next(error);
  }
});

export default router;