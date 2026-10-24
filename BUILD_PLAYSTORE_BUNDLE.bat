@echo off
title Build Google Play Store Bundle (.aab) - SecureNest
cd /d "%~dp0frontend"
echo =============================================================
echo 🚀 Building Production Android App Bundle (.aab) for Play Store
echo =============================================================
set "PATH=%PATH%;C:\Program Files\Git\cmd"
set EAS_NO_VCS=1
echo Running EAS Production Build (Uploads to Expo Cloud)...
call npx eas-cli build --platform android --profile production
pause
