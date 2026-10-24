@echo off
title SecureNest Unified System Launcher
cd /d "%~dp0"
echo ===================================================
echo 🛡️ Launching SecureNest System (Backend + Web + Mobile)
echo ===================================================
start "SecureNest Backend & Web Gateway" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 2 /nobreak >nul
echo Opening Web Interface in browser...
start http://localhost:3000
timeout /t 1 /nobreak >nul
start "SecureNest Mobile App" cmd /k "cd /d "%~dp0frontend" && npx expo start"
echo ===================================================
echo [1] Backend & Web Gateway: http://localhost:3000
echo [2] Sentinel Decoy Console: http://localhost:3000/sentinel
echo [3] Expo Metro Bundler: Running in Mobile window
echo ===================================================
pause
