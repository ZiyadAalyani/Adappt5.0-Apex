@echo off
title SecureNest Mobile & Web App
cd /d "%~dp0frontend"
echo ===================================================
echo 🛡️ Starting SecureNest React Native & Web App...
echo ===================================================
echo [w] Press 'w' to open in Web Browser (Chrome/Edge)
echo [a] Press 'a' to open on Android Emulator/Device
echo [s] Scan the QR code using Expo Go on your mobile
echo ===================================================
call npx expo start
pause
