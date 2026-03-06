@echo off
chcp 65001 >nul
echo ======================================
echo   局域网文件共享系统
echo ======================================
echo.

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

REM 检查数据库文件
if not exist "data\database.db" (
    echo [提示] 正在初始化数据库...
    cd apps\server
    call pnpm db:push
    call pnpm seed
    cd ..\..
)

echo [启动] 正在启动服务...
echo [信息] 服务启动后，请访问 http://localhost:3001
echo.

REM 启动服务
cd apps\server
node dist\index.js

pause
