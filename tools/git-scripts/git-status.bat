@echo off
chcp 65001 >nul
REM Git Status Script - 查看Git状态

cd /d "%~dp0\..\.."

echo ==========================================
echo Git Status
echo ==========================================
echo.

echo [当前分支]
git branch -v
echo.

echo [文件状态]
git status
echo.

echo [最近提交]
git log --oneline -5
echo.

echo ==========================================
pause
