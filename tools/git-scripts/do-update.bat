@echo off
cd /d "%~dp0\..\.."
git pull origin master
git add -A
git commit
git push origin master
pause
