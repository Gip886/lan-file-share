const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const serverDir = path.join(rootDir, 'apps', 'server');

// 打包脚本 - 创建可分发的文件夹结构
async function pack() {
  console.log('======================================');
  console.log('  局域网文件共享系统 - 打包工具');
  console.log('======================================');
  console.log('');

  // 1. 构建项目
  console.log('[1/5] 构建前端...');
  execSync('pnpm run build:web', { cwd: rootDir, stdio: 'inherit' });

  console.log('[2/5] 构建后端...');
  execSync('pnpm run build:server', { cwd: rootDir, stdio: 'inherit' });

  // 2. 创建分发目录
  console.log('[3/5] 创建分发目录...');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 3. 复制必要文件
  console.log('[4/5] 复制文件...');

  // 复制后端构建文件
  const distServerDir = path.join(distDir, 'server');
  fs.mkdirSync(distServerDir, { recursive: true });
  copyDir(path.join(serverDir, 'dist'), path.join(distServerDir, 'dist'));
  copyDir(path.join(serverDir, 'web-dist'), path.join(distServerDir, 'web-dist'));

  // 复制 Prisma 相关文件
  copyDir(path.join(serverDir, 'prisma'), path.join(distServerDir, 'prisma'));

  // 复制 node_modules 中必要的依赖
  const distNodeModules = path.join(distServerDir, 'node_modules');
  fs.mkdirSync(distNodeModules, { recursive: true });

  const requiredModules = [
    '@prisma/client',
    '.prisma',
    'express',
    'cors',
    'bcryptjs',
    'jsonwebtoken',
    'dotenv',
    'multer',
    'ws',
    'fluent-ffmpeg',
    'mime-types',
    'object-assign',
    'vary',
    'bytes',
    'content-type',
    'http-errors',
    'depd',
    'on-finished',
    'qs',
    'raw-body',
    'type-is',
    'accepts',
    'array-flatten',
    'body-parser',
    'content-disposition',
    'cookie',
    'cookie-signature',
    'debug',
    'ee-first',
    'encodeurl',
    'escape-html',
    'etag',
    'finalhandler',
    'forwarded',
    'fresh',
    'function-bind',
    'get-intrinsic',
    'has-proto',
    'has-symbols',
    'iconv-lite',
    'inherits',
    'ipaddr.js',
    'lodash',
    'media-typer',
    'merge-descriptors',
    'methods',
    'ms',
    'negotiator',
    'parseurl',
    'path-to-regexp',
    'proxy-addr',
    'range-parser',
    'safe-buffer',
    'safer-buffer',
    'send',
    'serve-static',
    'setprototypeof',
    'side-channel',
    'statuses',
    'toidentifier',
    'unpipe',
    'utils-merge',
    'which-typed-array',
    'buffer-equal-constant-time',
    'ecdsa-sig-formatter',
    'jwa',
    'jws',
    'semver',
    'yallist',
    'append-field',
    'busboy',
    'mkdirp',
    'streamsearch',
    'typedarray',
    'xtend',
    'async',
    'which',
    'isexe',
  ];

  const sourceNodeModules = path.join(serverDir, 'node_modules');
  for (const mod of requiredModules) {
    const src = path.join(sourceNodeModules, mod);
    const dest = path.join(distNodeModules, mod);
    if (fs.existsSync(src)) {
      copyDir(src, dest);
    }
  }

  // 复制启动脚本
  console.log('[5/5] 复制启动脚本...');
  const scriptsDir = path.join(rootDir, 'scripts');
  fs.copyFileSync(path.join(scriptsDir, 'start.bat'), path.join(distDir, 'start.bat'));
  fs.copyFileSync(path.join(scriptsDir, 'start.vbs'), path.join(distDir, 'start.vbs'));
  fs.copyFileSync(path.join(scriptsDir, 'start.sh'), path.join(distDir, 'start.sh'));

  // 创建数据目录
  fs.mkdirSync(path.join(distDir, 'data', 'static'), { recursive: true });
  fs.mkdirSync(path.join(distDir, 'data', 'uploads'), { recursive: true });
  fs.mkdirSync(path.join(distDir, 'data', 'thumbnails'), { recursive: true });

  // 创建 .env 文件
  fs.writeFileSync(
    path.join(distDir, 'server', '.env'),
    `DATABASE_URL="file:../../data/database.db"
JWT_SECRET="lan-file-share-secret-${Date.now()}"
PORT=3001
`
  );

  // 创建 README
  fs.writeFileSync(
    path.join(distDir, 'README.txt'),
    `=============================================
局域网文件共享系统
=============================================

【快速开始】

Windows 用户：
  双击 "start.vbs" 启动服务（推荐，无黑窗口）
  或双击 "start.bat" 启动服务（显示调试信息）

macOS/Linux 用户：
  终端运行: ./start.sh

【访问地址】
  本机: http://localhost:3001
  局域网其他设备: http://本机IP:3001

【默认账号】
  用户名: admin
  密码: admin123

【数据目录】
  data/ - 数据库和上传文件存储位置

=============================================
`
  );

  console.log('');
  console.log('======================================');
  console.log('  打包完成！');
  console.log('======================================');
  console.log('');
  console.log(`分发目录: ${distDir}`);
  console.log('');
  console.log('你可以将整个 dist 文件夹复制到任意位置运行');
  console.log('');
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;

  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

pack().catch(err => {
  console.error('打包失败:', err);
  process.exit(1);
});
