import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/index';
import { errorHandler } from './middleware/error';
import authRoutes from './modules/auth/routes';
import fileRoutes from './modules/file/routes';
import streamRoutes from './modules/stream/routes';
import monitorRoutes from './modules/monitor/routes';
import adminRoutes from './modules/admin/routes';
import publicRoutes from './modules/public/routes';
import { setupWebSocket } from './websocket/index';

const app: Application = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（缩略图、电视页面等）
app.use('/static', express.static(config.staticDir));
app.use(express.static('public'));

// API 路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/stream', streamRoutes);
app.use('/api/v1/monitor', monitorRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes); // 公开接口（无需登录）

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 前端静态文件（打包后启用）
const webDistPath = path.join(__dirname, '../web-dist');
app.use(express.static(webDistPath));

// 所有非 API 请求都返回前端首页（支持前端路由）
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/static/')) {
    res.sendFile(path.join(webDistPath, 'index.html'));
  } else {
    res.status(404).json({ message: 'Not found' });
  }
});

// 错误处理
app.use(errorHandler);

// 启动服务器
const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Open http://localhost:${config.port} in your browser`);
});

// 设置 WebSocket
setupWebSocket(server);

export default app;