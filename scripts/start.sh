#!/bin/bash

echo "======================================"
echo "  局域网文件共享系统"
echo "======================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$ROOT_DIR/apps/server"

# 检查数据库文件
if [ ! -f "$ROOT_DIR/data/database.db" ]; then
    echo "[提示] 正在初始化数据库..."
    cd "$SERVER_DIR"
    pnpm db:push
    pnpm seed
fi

echo "[启动] 正在启动服务..."
echo "[信息] 服务启动后，请访问 http://localhost:3001"
echo ""

# 启动服务
cd "$SERVER_DIR"
node dist/index.js
