@echo off
title CyberGuard Sentinel Backend Gateway
cd /d "%~dp0backend"
echo ===================================================
echo Starting CyberGuard Sentinel Node.js Gateway...
echo ===================================================
node server.js
pause
