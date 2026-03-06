"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const index_1 = require("./config/index");
const error_1 = require("./middleware/error");
const routes_1 = __importDefault(require("./modules/auth/routes"));
const routes_2 = __importDefault(require("./modules/file/routes"));
const routes_3 = __importDefault(require("./modules/stream/routes"));
const routes_4 = __importDefault(require("./modules/monitor/routes"));
const routes_5 = __importDefault(require("./modules/admin/routes"));
const routes_6 = __importDefault(require("./modules/public/routes"));
const index_2 = require("./websocket/index");
const app = (0, express_1.default)();
// 中间件
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 静态文件服务（缩略图、电视页面等）
app.use('/static', express_1.default.static(index_1.config.staticDir));
app.use(express_1.default.static('public'));
// API 路由
app.use('/api/v1/auth', routes_1.default);
app.use('/api/v1/files', routes_2.default);
app.use('/api/v1/stream', routes_3.default);
app.use('/api/v1/monitor', routes_4.default);
app.use('/api/v1/admin', routes_5.default);
app.use('/api/v1/public', routes_6.default); // 公开接口（无需登录）
// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 前端静态文件（打包后启用）
const webDistPath = path_1.default.join(__dirname, '../web-dist');
app.use(express_1.default.static(webDistPath));
// 所有非 API 请求都返回前端首页（支持前端路由）
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/static/')) {
        res.sendFile(path_1.default.join(webDistPath, 'index.html'));
    }
    else {
        res.status(404).json({ message: 'Not found' });
    }
});
// 错误处理
app.use(error_1.errorHandler);
// 启动服务器
const server = app.listen(index_1.config.port, () => {
    console.log(`Server running on port ${index_1.config.port}`);
    console.log(`Open http://localhost:${index_1.config.port} in your browser`);
});
// 设置 WebSocket
(0, index_2.setupWebSocket)(server);
exports.default = app;
//# sourceMappingURL=index.js.map