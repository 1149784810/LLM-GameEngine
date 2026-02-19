@echo off
cd /d "%~dp0\..\.."
git add -A
git commit
git push origin master
