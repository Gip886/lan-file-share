import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import { prisma } from '../../config/index';
import { accessLogMiddleware, trafficLogMiddleware } from '../../middleware/accessLog';
import { parseRangeHeader, getFileCategory, getMimeType } from '@lan-file-share/utils';
import { createError } from '../../middleware/error';

const router: ReturnType<typeof Router> = Router();

// 公开接口 - 获取文件列表（支持文件夹浏览）
router.get('/files', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 200, category, folder } = req.query;

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }

    // 文件夹过滤
    if (folder && typeof folder === 'string') {
      where.path = { startsWith: folder };
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        include: {
          storagePath: {
            select: { id: true, path: true },
          },
        },
      }),
      prisma.file.count({ where }),
    ]);

    // 获取所有唯一的文件夹路径
    const folders = await getFolders(category as string);

    res.json({
      success: true,
      data: {
        items: files.map(f => ({
          id: f.id,
          name: f.name,
          size: f.size.toString(),
          category: f.category,
          duration: f.duration,
          width: f.width,
          height: f.height,
          mimeType: f.mimeType,
          storagePath: f.storagePath?.path,
          relativePath: f.path,
        })),
        folders,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

// 获取文件夹列表
async function getFolders(category?: string): Promise<string[]> {
  const where: any = {};
  if (category && category !== 'all') {
    where.category = category;
  }

  const files = await prisma.file.findMany({
    where,
    select: { path: true, storagePath: { select: { path: true } } },
  });

  const folderSet = new Set<string>();

  for (const file of files) {
    const storagePath = file.storagePath?.path;
    if (!storagePath) continue;

    // 获取相对路径的目录部分
    const relativePath = path.relative(storagePath, file.path);
    const dir = path.dirname(relativePath);

    // 添加所有层级的文件夹
    const parts = dir.split(path.sep).filter(Boolean);
    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? path.join(currentPath, part) : part;
      folderSet.add(currentPath);
    }
  }

  return Array.from(folderSet).sort();
}

// 公开接口 - 获取分类统计
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await prisma.file.groupBy({
      by: ['category'],
      _count: true,
    });

    res.json({
      success: true,
      data: stats.map(s => ({
        category: s.category,
        count: s._count,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// 公开接口 - 视频流播放（无需登录，但记录访问日志和流量）
router.get('/stream/:id', accessLogMiddleware, trafficLogMiddleware('id'), async (req, res, next) => {
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

// 公开接口 - 获取文件内容（用于图片、文本等）
router.get('/raw/:id', async (req, res, next) => {
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

    // 对于文本文件，返回内容
    if (file.category === 'document' || file.category === 'subtitle') {
      const content = fs.readFileSync(file.path, 'utf-8');
      res.json({
        success: true,
        data: {
          name: file.name,
          content,
          mimeType: file.mimeType,
        },
      });
    } else {
      // 其他文件直接发送
      res.setHeader('Content-Type', file.mimeType);
      res.sendFile(file.path);
    }
  } catch (error) {
    next(error);
  }
});

export default router;
