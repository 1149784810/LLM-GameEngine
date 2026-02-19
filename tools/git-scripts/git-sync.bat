@echo off
chcp 65001 >nul
REM Git Sync Script - 同步远端变更并推送本地变更
REM 使用方法: git-sync.bat "提交信息"

cd /d "%~dp0\..\.."

echo ==========================================
echo Git Sync - 同步远端并推送本地
echo ==========================================
echo.

REM 获取提交信息
setlocal enabledelayedexpansion
if "%~1"=="" (
    set "commit_msg=Sync changes"
    echo 未提供提交信息，使用默认: !commit_msg!
) else (
    set "commit_msg=%~1"
    echo 提交信息: !commit_msg!
)

echo.
echo [1/5] 检查当前状态...
git status --short

echo.
echo [2/5] 拉取远端变更...
git pull origin master
if errorlevel 1 (
    echo.
    echo 错误: 拉取失败，可能需要解决冲突
    pause
    exit /b 1
)

echo.
echo [3/5] 添加本地变更...
git add -A

echo.
echo [4/5] 提交本地变更...
git commit -m "!commit_msg!" 2>nul
if errorlevel 1 (
    echo 没有需要提交的本地变更
) else (
    echo 本地变更已提交
)

echo.
echo [5/5] 推送到远端...
git push origin master
if errorlevel 1 (
    echo.
    echo 错误: 推送失败
    pause
    exit /b 1
)

echo.
echo ==========================================
echo 同步完成！
echo ==========================================
pause
