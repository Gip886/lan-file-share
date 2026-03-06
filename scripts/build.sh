#!/bin/bash

echo "======================================"
echo "  局域网文件共享系统 - 构建脚本"
echo "======================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "[1/4] 安装依赖..."
pnpm install
if [ $? -ne 0 ]; then
    echo "[错误] 依赖安装失败"
    exit 1
fi

echo "[2/4] 构建前端..."
pnpm run build:web
if [ $? -ne 0 ]; then
    echo "[错误] 前端构建失败"
    exit 1
fi

echo "[3/4] 构建后端..."
pnpm run build:server
if [ $? -ne 0 ]; then
    echo "[错误] 后端构建失败"
    exit 1
fi

echo "[4/4] 初始化数据库..."
cd apps/server
pnpm db:push
if [ $? -ne 0 ]; then
    echo "[警告] 数据库初始化可能需要手动执行"
fi

cd ../..

echo ""
echo "======================================"
echo "  构建完成！"
echo "======================================"
echo ""
echo "启动方式:"
echo "  ./scripts/start.sh"
echo ""
