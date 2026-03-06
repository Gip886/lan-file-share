# 局域网文件共享系统

一个用于局域网的文件共享系统，支持电视在线播放电影、访问日志记录、流量统计和设备追踪。

## 功能特性

- 📺 **视频流播放** - 支持 Range 请求，可在电视上拖动进度条
- 📁 **文件管理** - 自动扫描视频文件，提取元数据
- 📊 **监控统计** - 访问日志、流量统计、设备追踪
- 🔐 **用户认证** - JWT 认证，支持管理员和普通用户
- 🔴 **实时推送** - WebSocket 实时监控数据

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Ant Design
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite + Prisma ORM
- **视频处理**: FFmpeg

## 快速开始

### 方式一：一键打包运行（推荐）

打包后会生成 `dist` 文件夹，可以复制到任意位置运行，无需安装 Node.js。

**Windows 用户:**
```bash
# 1. 构建并打包
pnpm pack

# 2. 进入打包目录
cd dist

# 3. 启动服务（任选其一）
双击 start.vbs    # 推荐：无黑窗口，自动打开浏览器
双击 start.bat    # 调试模式：显示命令行输出
```

**macOS/Linux 用户:**
```bash
# 1. 构建并打包
pnpm pack

# 2. 进入打包目录
cd dist

# 3. 启动服务
./start.sh
```

**分发说明:**
- 将 `dist` 文件夹压缩后分享给其他用户
- 其他用户解压后，安装 Node.js 18+，然后运行启动脚本即可
- 首次启动会自动初始化数据库

### 方式二：开发模式

#### 1. 安装依赖

```bash
pnpm install
```

#### 2. 初始化数据库

```bash
cd apps/server
pnpm db:push
pnpm seed
```

#### 3. 启动服务

**同时启动前后端:**
```bash
pnpm dev
```

**或分别启动:**
```bash
# 终端 1 - 后端
cd apps/server
pnpm dev

# 终端 2 - 前端
cd apps/web
pnpm dev
```

### 4. 访问系统

- 前端地址: http://localhost:3001
- 后端 API: http://localhost:3001/api/v1
- 默认管理员账户:
  - 用户名: `admin`
  - 密码: `admin123`

## 使用说明

### 添加视频文件夹

1. 登录系统
2. 进入「文件管理」页面
3. 点击「存储路径」按钮
4. 添加视频文件夹路径（如 `/mnt/movies`）
5. 点击「扫描文件」

### 在电视上播放

1. 在电视浏览器中访问 `http://服务器IP:3001`
2. 登录后选择视频点击播放
3. 或直接访问 `http://服务器IP:3001/api/v1/public/stream/文件ID`

## 项目结构

```
router/
├── apps/
│   ├── server/          # 后端服务
│   │   ├── src/
│   │   │   ├── modules/ # 功能模块
│   │   │   ├── middleware/ # 中间件
│   │   │   └── config/  # 配置
│   │   └── prisma/      # 数据库 schema
│   └── web/             # 前端应用
│       └── src/
│           ├── pages/   # 页面
│           ├── api/     # API 请求
│           └── stores/  # 状态管理
├── packages/            # 共享包
│   ├── types/           # 类型定义
│   └── utils/           # 工具函数
└── data/                # 数据目录
```

## API 接口

### 认证
- `POST /api/v1/auth/login` - 登录
- `GET /api/v1/auth/me` - 获取当前用户

### 文件
- `GET /api/v1/files` - 获取文件列表
- `POST /api/v1/files/scan` - 扫描文件
- `GET /api/v1/files/storage-paths` - 获取存储路径

### 流媒体
- `GET /api/v1/stream/video/:id` - 视频流播放
- `GET /api/v1/stream/download/:id` - 下载文件

### 监控
- `GET /api/v1/monitor/stats` - 统计数据
- `GET /api/v1/monitor/logs` - 访问日志
- `GET /api/v1/monitor/devices` - 设备列表

## 环境变量

在 `apps/server/.env` 中配置：

```env
DATABASE_URL="file:../../../data/database.db"
JWT_SECRET="your-super-secret-key"
PORT=3001
```