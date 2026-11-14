@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE_EXE=D:\ai\node.js\node.exe"

"%NODE_EXE%" -v >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Open index.html directly instead.
  pause
  exit /b 1
)

start "AI Paper Server" /min "%NODE_EXE%" server.js
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/"
exit /b 0
