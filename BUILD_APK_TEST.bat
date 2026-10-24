@echo off
title Build Android APK (Direct Install for Testing) - SecureNest
cd /d "%~dp0frontend"
echo =============================================================
echo 📱 Building Direct Android APK (Testing / Hackathon Demo)
echo =============================================================
set "PATH=%PATH%;C:\Program Files\Git\cmd"
set EAS_NO_VCS=1
echo Running EAS Build in cloud (Generates direct .apk link)...
call npx eas-cli build --platform android --profile preview
pause
