@echo off
title SecureNest Web Dashboard
cd /d "%~dp0"
echo ===================================================
echo 🛡️ Launching SecureNest Web Application...
echo ===================================================
start "SecureNest Backend & Web Server" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 2 /nobreak >nul
echo Opening SecureNest in your web browser...
start http://localhost:3000
echo ===================================================
echo Web app running at: http://localhost:3000
echo Sentinel Decoy Console: http://localhost:3000/sentinel
echo ===================================================
pause
