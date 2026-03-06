import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 创建默认管理员账户
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
      },
    });
    console.log('默认管理员账户已创建:');
    console.log('  用户名: admin');
    console.log('  密码: admin123');
    console.log('  请登录后立即修改密码！');
  } else {
    console.log('管理员账户已存在');
  }

  // 创建示例存储路径（如果不存在）
  const existingPaths = await prisma.storagePath.count();
  if (existingPaths === 0) {
    console.log('请添加存储路径后扫描文件');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });