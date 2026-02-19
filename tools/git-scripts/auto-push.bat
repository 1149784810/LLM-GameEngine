@echo off
cd /d "%~dp0\..\.."
git add -A
git commit
git push origin master
REM 删除自身（auto-push.bat 除外）
if exist "%~dp0do-push.bat" del "%~dp0do-push.bat"
if exist "%~dp0quick-push.bat" del "%~dp0quick-push.bat"
if exist "%~dp0temp-*.bat" del "%~dp0temp-*.bat"
