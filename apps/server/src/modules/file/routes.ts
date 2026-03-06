import path from 'path';
import { Router } from 'express';
import { prisma } from '../../config/index';
import { authMiddleware, adminMiddleware, AuthRequest } from '../../middleware/auth';
import { createError } from '../../middleware/error';
import { FileScanner } from './scanner';

const router: ReturnType<typeof Router> = Router();

// 获取存储路径列表
router.get('/storage-paths', authMiddleware, async (req, res, next) => {
  try {
    const paths = await prisma.storagePath.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: paths });
  } catch (error) {
    next(error);
  }
});

// 添加存储路径
router.post('/storage-paths', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { path } = req.body;

    if (!path) {
      throw createError(400, '路径不能为空');
    }

    const existing = await prisma.storagePath.findUnique({
      where: { path },
    });

    if (existing) {
      throw createError(400, '该路径已存在');
    }

    const storagePath = await prisma.storagePath.create({
      data: { path },
    });

    res.json({ success: true, data: storagePath });
  } catch (error) {
    next(error);
  }
});

// 更新存储路径状态
router.put('/storage-paths/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const storagePath = await prisma.storagePath.update({
      where: { id },
      data: { enabled },
    });

    res.json({ success: true, data: storagePath });
  } catch (error) {
    next(error);
  }
});

// 删除存储路径
router.delete('/storage-paths/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.storagePath.delete({
      where: { id },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

// 扫描文件
router.post('/scan', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const scanner = new FileScanner();
    const result = await scanner.scanAll();

    // 构建详细的响应消息
    let message = `扫描完成，新增 ${result.added} 个文件，更新 ${result.updated} 个文件`;

    res.json({
      success: true,
      data: result,
      message,
      details: result.details,
      warnings: result.warnings,
      errors: result.errors,
    });
  } catch (error) {
    next(error);
  }
});

// 获取文件夹列表
router.get('/folders', authMiddleware, async (req, res, next) => {
  try {
    const { category, storagePathId } = req.query;

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    if (storagePathId) {
      where.storagePathId = storagePathId;
    }

    const files = await prisma.file.findMany({
      where,
      select: { path: true, storagePath: { select: { id: true, path: true } } },
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

    res.json({ success: true, data: Array.from(folderSet).sort() });
  } catch (error) {
    next(error);
  }
});

// 获取分类统计
router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const stats = await prisma.file.groupBy({
      by: ['category'],
      _count: true,
      _sum: { size: true },
    });

    res.json({
      success: true,
      data: stats.map(s => ({
        category: s.category,
        count: s._count,
        totalSize: s._sum.size?.toString() || '0',
      })),
    });
  } catch (error) {
    next(error);
  }
});

// 获取文件列表（支持分类和文件夹筛选）
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, pageSize = 50, search, storagePathId, category, folder } = req.query;

    const where: any = {};
    if (search) {
      where.name = { contains: search as string };
    }
    if (storagePathId) {
      where.storagePathId = storagePathId;
    }
    if (category && category !== 'all') {
      where.category = category;
    }
    if (folder && typeof folder === 'string') {
      where.path = { contains: folder };
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

    res.json({
      success: true,
      data: {
        items: files.map(f => ({
          ...f,
          size: f.size.toString(),
        })),
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// 获取文件详情
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        storagePath: true,
      },
    });

    if (!file) {
      throw createError(404, '文件不存在');
    }

    res.json({
      success: true,
      data: {
        ...file,
        size: file.size.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// 删除单个文件记录
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.file.delete({
      where: { id },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

// 批量删除文件记录
router.post('/batch-delete', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw createError(400, '请选择要删除的文件');
    }

    const result = await prisma.file.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    res.json({
      success: true,
      message: `成功删除 ${result.count} 个文件记录`,
      data: { count: result.count },
    });
  } catch (error) {
    next(error);
  }
});

// 批量删除文件夹内的所有文件
router.post('/batch-delete-folder', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { folder, storagePathId } = req.body;

    if (!folder) {
      throw createError(400, '请指定要删除的文件夹');
    }

    const where: any = {
      path: { contains: folder },
    };
    if (storagePathId) {
      where.storagePathId = storagePathId;
    }

    const result = await prisma.file.deleteMany({ where });

    res.json({
      success: true,
      message: `成功删除 ${result.count} 个文件记录`,
      data: { count: result.count },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
