import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/index';
import { authMiddleware, adminMiddleware, AuthRequest } from '../../middleware/auth';
import { createError } from '../../middleware/error';

const router: ReturnType<typeof Router> = Router();

// 所有管理接口需要管理员权限
router.use(authMiddleware);
router.use(adminMiddleware);

// 获取用户列表
router.get('/users', async (req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
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
  } catch (error) {
    next(error);
  }
});

// 创建用户
router.post('/users', async (req: AuthRequest, res, next) => {
  try {
    const { username, password, role = 'user' } = req.body;

    if (!username || !password) {
      throw createError(400, '用户名和密码不能为空');
    }

    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      throw createError(400, '用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
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
  } catch (error) {
    next(error);
  }
});

// 更新用户
router.put('/users/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { role, password } = req.body;

    const data: any = {};
    if (role) data.role = role;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
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
  } catch (error) {
    next(error);
  }
});

// 删除用户
router.delete('/users/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (id === req.userId) {
      throw createError(400, '不能删除自己的账户');
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

// 获取系统信息
router.get('/system', async (req: AuthRequest, res, next) => {
  try {
    const [
      userCount,
      fileCount,
      storagePathCount,
      accessLogCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.file.count(),
      prisma.storagePath.count(),
      prisma.accessLog.count(),
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
  } catch (error) {
    next(error);
  }
});

export default router;