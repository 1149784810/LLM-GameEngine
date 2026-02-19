@echo off
chcp 65001 >nul
REM Git Pull Script - 从远端仓库拉取最新变更

cd /d "%~dp0\..\.."

echo ==========================================
echo Git Pull
echo ==========================================
echo.

echo [正在拉取最新变更...]
git pull origin master
if errorlevel 1 (
    echo.
    echo 错误: 拉取失败
    echo 可能需要解决冲突
    pause
    exit /b 1
)

echo.
echo ==========================================
echo 拉取成功！
echo ==========================================
pause
