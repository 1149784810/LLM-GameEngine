@echo off
chcp 65001 >nul
REM Git Push Script - 提交并推送本地变更到远端仓库
REM 使用方法: 直接运行或传入提交信息: git-push.bat "提交信息"

cd /d "%~dp0\..\.."

echo ==========================================
echo Git Push Script
echo ==========================================
echo.

REM 检查是否有变更
setlocal enabledelayedexpansion

REM 获取提交信息
if "%~1"=="" (
    set "commit_msg=Update local changes"
    echo 未提供提交信息，使用默认: !commit_msg!
) else (
    set "commit_msg=%~1"
    echo 提交信息: !commit_msg!
)

echo.
echo [1/4] 检查Git状态...
git status --short

echo.
echo [2/4] 添加所有变更...
git add -A
if errorlevel 1 (
    echo 错误: 添加文件失败
    pause
    exit /b 1
)

echo.
echo [3/4] 提交变更...
git commit -m "!commit_msg!"
if errorlevel 1 (
    echo 注意: 没有需要提交的变更，或提交失败
    pause
    exit /b 0
)

echo.
echo [4/4] 推送到远端仓库...
git push origin master
if errorlevel 1 (
    echo 错误: 推送失败
    pause
    exit /b 1
)

echo.
echo ==========================================
echo 推送成功！
echo ==========================================
pause
