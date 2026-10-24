# CyberGuard – Smart Home Cybersecurity UI

Premium dark-themed React Native (Expo) UI for a smart-home cybersecurity application.

## Features

- **Glassmorphism cards** with blur + gradient borders
- **Animated CyberBot** – floating, blinking, looking around (inspired by your cute bot sketch)
- **Protection ring** progress indicator
- **Animated threat wave chart**
- **Device activity bar chart**
- **Risk distribution meter**
- **Device status cards** (safe / warning / critical / offline)
- **Network Scan screen** with radar animation & live progress
- **Security Timeline** history view
- **Settings** with toggles
- Dark security aesthetic with ambient glow orbs

## Screens

1. **Home** – Dashboard with bot, protection score, charts, connected devices  
2. **Scan** – Full network scan with animated radar & results  
3. **History** – Timeline of security events  
4. **Settings** – Preferences & account

## Setup

```bash
cd cyberguard-ui
npm install
npx expo start
```

Then press `a` for Android emulator / device, or scan the QR with Expo Go.

### Required packages (already in package.json)

- expo-linear-gradient
- expo-blur
- react-native-reanimated
- react-native-svg
- @react-navigation/native + bottom-tabs
- react-native-safe-area-context
- @expo/vector-icons

## Integrating into your existing APK project

1. Copy the entire `src/` folder into your project.
2. Copy `App.tsx` (or merge the NavigationContainer setup).
3. Ensure `babel.config.js` includes `react-native-reanimated/plugin` **last**.
4. Install the dependencies listed above.
5. Update your navigation root if you already have one.

## Customization

- Theme colors → `src/constants/theme.ts`
- Bot mood → `<CyberBot mood="happy" | "alert" | "scanning" />`
- Device list → edit the `DeviceCard` instances in `HomeScreen.tsx`

Built for ADAPPT 5.0 – Domain 1: Cybersecurity in Smart Homes.
