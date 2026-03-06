@echo off
chcp 65001 >nul
echo ======================================
echo   局域网文件共享系统 - 构建脚本
echo ======================================
echo.

cd /d "%~dp0\.."

echo [1/4] 安装依赖...
call pnpm install
if errorlevel 1 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)

echo [2/4] 构建前端...
call pnpm run build:web
if errorlevel 1 (
    echo [错误] 前端构建失败
    pause
    exit /b 1
)

echo [3/4] 构建后端...
call pnpm run build:server
if errorlevel 1 (
    echo [错误] 后端构建失败
    pause
    exit /b 1
)

echo [4/4] 初始化数据库...
cd apps\server
call pnpm db:push
if errorlevel 1 (
    echo [警告] 数据库初始化可能需要手动执行
)

cd ..\..

echo.
echo ======================================
echo   构建完成！
echo ======================================
echo.
echo 启动方式:
echo   1. 双击 scripts\start.vbs  (推荐, 无黑窗口)
echo   2. 双击 scripts\start.bat  (调试模式)
echo.
pause
