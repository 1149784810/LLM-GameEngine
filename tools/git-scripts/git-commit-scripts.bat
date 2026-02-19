@echo off
chcp 65001 >nul
cd /d "%~dp0\..\.."
git add tools/git-scripts/
git commit -m "Add Git operation scripts for cross-machine usage"
git push origin master
echo 提交完成！
pause
