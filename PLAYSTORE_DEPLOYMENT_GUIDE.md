# 🚀 Google Play Store & Android Deployment Guide for SecureNest

This complete guide details how to build, test, and publish your **SecureNest** mobile app on the **Google Play Store** using **Expo Application Services (EAS)**.

---

## 📱 Live EAS Cloud Builds (In Progress / Ready)

Your cloud builds are automatically generated and linked to your Expo account (`@ziyadaalyani`):

| Build Type | Format | Target | Build Console & Direct Download |
| :--- | :--- | :--- | :--- |
| **Play Store Bundle** | `.aab` | Google Play Store Release | [View EAS Production Build](https://expo.dev/accounts/ziyadaalyani/projects/securenest/builds/b8f54715-0fcb-45da-964d-a876732caed3) |
| **Direct Install APK** | `.apk` | Physical Device / Judges / Demo | [View EAS Preview APK Build](https://expo.dev/accounts/ziyadaalyani/projects/securenest/builds/a1b15f9e-83a7-4157-9db7-9bbe506ff832) |

---

## 📌 Step 1: APK vs AAB — Which One Do You Need?

* **`.aab` (Android App Bundle)**: **Required by Google Play Store**. Google Play optimizes the file size for every individual Android device downloading the app.
* **`.apk` (Direct Install File)**: **Best for Immediate Testing & Hackathons**. You can send this directly via WhatsApp, Google Drive, or Slack. Anyone can tap and install it instantly on their Android phone without going through Play Store review.

---

## 🔑 Step 2: Accounts You Need

1. **Expo Account** (Free): Already signed in as `ziyadaalyani` (`aalyaniziyad07@gmail.com`).
2. **Google Play Console Developer Account** ($25 one-time fee from Google): Register at [https://play.google.com/console/signup](https://play.google.com/console/signup).

---

## ⚡ Step 3: Triggering Future Builds Locally

We have configured `app.json` and `eas.json` for **Expo SDK 54**:
* **App Name**: `SecureNest`
* **Package Name**: `com.securenest.smarthome`
* **Version**: `1.0.0`
* **Version Code**: `1`

### Option A: Build Play Store Bundle (.aab) with 1 Click
Double-click [`BUILD_PLAYSTORE_BUNDLE.bat`](file:///C:/Users/Admin/Desktop/CyberGuard_SmartHome_App/BUILD_PLAYSTORE_BUNDLE.bat) or run in frontend:
```bash
npx eas-cli build --platform android --profile production
```

### Option B: Build Direct APK (.apk) with 1 Click
Double-click [`BUILD_APK_TEST.bat`](file:///C:/Users/Admin/Desktop/CyberGuard_SmartHome_App/BUILD_APK_TEST.bat) or run in frontend:
```bash
npx eas-cli build --platform android --profile preview
```

---

## 📝 Step 4: Setting Up the App in Google Play Console

1. Log in to **[Google Play Console](https://play.google.com/console)**.
2. Click **Create app** (top-right corner):
   * **App name**: `SecureNest: Smart Home Security & AI`
   * **Default language**: English (United States or India)
   * **App or game**: App
   * **Free or paid**: Free
   * Check Declarations and click **Create app**.

3. **Complete the "Set up your app" checklist in the Console Dashboard**:
   * **Privacy Policy**: Provide a URL (e.g. GitHub Pages or Notion document).
   * **App access**: Select *"All functionality is available without special access restrictions"*.
   * **Ads**: Select *"No, my app does not contain ads"*.
   * **Content rating**: Complete the short questionnaire (Category: Utilities / Security) → Rating will be `Everyone / 3+`.
   * **Target audience**: Select `18 and older` (or `13+`).
   * **Data Safety**:
     * Data encrypted in transit? → **Yes (HTTPS/TLS)**.
     * Can users request data deletion? → **Yes**.
     * Data collected: Device identifiers & Network status (for zero-trust network mapping and Sentinel honeypot security).

4. **Main Store Listing (Visuals & Copy)**:
   * **Short description**: `Zero-Trust Smart Home IoT Security, Honeypot Sentinel, and SecureBot AI Guardian.`
   * **Full description**:
     ```
     SecureNest delivers enterprise-grade cybersecurity for modern smart homes.
     Features include:
     • Real-time Subnet & Port Auditor
     • Device-to-Device (D2D) Zero-Trust Isolation Matrix
     • Rogue & Honeypot Intruder Trap (Sentinel)
     • 3 AM Off-Hours Exfiltration Detection
     • Biometric TouchID & FaceID Step-Up Authentication
     • Autonomous SecureBot AI Agent for instant threat remediation
     ```
   * **App icon**: 512 × 512 px PNG (`frontend/assets/icon.png`).
   * **Feature graphic**: 1024 × 500 px PNG.
   * **Screenshots**: Upload screenshots of the Home Dashboard, Admin Hub, SecureBot AI, and Sentinel logs.

---

## 🚀 Step 5: Upload the .aab and Release

1. In the left navigation menu of Google Play Console, go to **Release** → **Production** (or **Testing** → **Internal testing** if you want to test with specific Gmail accounts first).
2. Click **Create new release**.
3. Under **App bundles**, click **Upload** and upload your downloaded `.aab` file from the EAS build link above.
4. Enter **Release notes**:
   ```
   v1.0.0 — Initial Release of SecureNest Smart Home Sentinel & SecureBot AI Guardian.
   ```
5. Click **Next** → **Save** → **Review release**.
6. Click **Start rollout to Production**!

Google usually reviews new apps within 1–3 business days. Once approved, SecureNest will be live for download worldwide on Google Play Store!
