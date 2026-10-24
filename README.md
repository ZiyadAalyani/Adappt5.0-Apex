# 🛡️ SecureNest: Smart Home Sentinel & SecureBot AI
### ADAPPT 5.0 — Domain 1: Cybersecurity in Smart Homes

An enterprise-grade, zero-trust smart home cybersecurity mobile application built with **React Native & Expo SDK 54** for Google Play Store deployment, powered by a **Node.js** Sentinel gateway and **Neon PostgreSQL Serverless Database**, integrated with **SecureBot Gemini AI Model**.

---

## 🌟 Key Architecture & Integrations

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SecureNest Mobile App (Expo SDK 54)             │
│  • Cute Neon Mascot (Vector SVG)       • Subnet & Port Auditor (23/80) │
│  • SecureBot AI (Gemini 3.5 / Flash)   • Biometric & PIN 2026 Admin Hub│
│  • Zero-Trust D2D Isolation Matrix     • Real-Time Threat Console      │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ REST / WebSockets / Push
┌─────────────────────────────────▼──────────────────────────────────────┐
│                    SecureNest Sentinel Gateway (Node.js)               │
│  • Background Honeypot Decoy Traps     • Egress Telemetry Spike Monitor│
│  • Rogue MAC & Evil Twin Hunter        • Payload Metadata Stripping    │
│  • Instant Attack Auto-Lock & Alerts   • SMS Webhook Dispatcher        │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ SSL Pool
┌─────────────────────────────────▼──────────────────────────────────────┐
│                     Neon PostgreSQL Serverless Database                │
│  • devices (ports, protocols, status)  • security_alerts & policies    │
│  • d2d_matrix_rules (micro-seg)        • sentinel_incidents & evidence │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 All Features Implemented (ADAPPT 5.0)

### 1. Device Communication & Network Discovery
* **Subnet & Port Auditor**: Scans local Wi-Fi (`192.168.1.0/24`), detects open ports (Telnet 23, HTTP 80, RTSP 554, MQTT 1883), and flags unencrypted services.
* **Device-to-Device (D2D) Traffic Isolation Matrix**: Zero-Trust policy engine restricting IoT devices from unauthorized cross-communication (e.g. Smart Bulb isolated from Smart Lock).
* **Rogue Device & Evil Twin Detection**: Monitors ARP tables and MAC signatures (`DE:AD:BE:EF:00:01`), alerting when unauthorized devices or spoofed SSIDs join.
* **Protocol Encryption Enforcement**: Upgrades unencrypted Telnet/HTTP/MQTT streams to TLS/MQTTS with one tap.

### 2. Information Sharing & Privacy Protection
* **Outbound Telemetry & Data Exfiltration Monitor**: Tracks bandwidth and packet velocity, flagging suspicious off-hours spikes (e.g. IP Camera transmitting 850MB at 3 AM).
* **Preset Privacy Modes**:
  * **Normal Mode**: Standard zero-trust monitoring.
  * **Guest Mode**: Limits visitors to multimedia while isolating cameras and locks.
  * **Sleep / Do-Not-Track Mode**: Restricts smart speakers and cameras from sending analytics data to external vendor clouds at night.
* **Payload Metadata Stripping**: Inspects outgoing MQTT/JSON payloads and masks personally identifiable information (PII), MACs, and GPS coordinates.
* **Automated Security Health Score**: Real-time 0–100 score dynamically calculated from open ports, rogue devices, and encryption status.

### 3. User Interaction & Incident Mitigation
* **Admin Hub Authentication**:
  * **Biometric Auth**: Fingerprint / FaceID via Android `BiometricPrompt` (`expo-local-authentication`).
  * **Master PIN Keypad**: 4 glowing digits, tactile glass keypad, default PIN `2026` (also accepts `1234`, `0000`).
* **Emergency Lockdown ("SHIELD UP")**: Instantly closes all external ports and isolates infected nodes.
* **Context-Aware Geofencing**: Disallows critical operations if user is not connected to the trusted home Wi-Fi.
* **One-Tap Device Quarantine**: Instantly blocks compromised IoT devices from the local subnet.

### 4. Cute Mascot & SecureBot AI Agent
* **Cute Vector Mascot**: Custom SVG mascot matching user blueprint (loop top handle, diamond side ears, tall pill eyes, subtle breathing and blinking animations).
* **Autonomous Reasoning**: Cline-style expandable reasoning block (`Thinking Process...`), tool execution cards (`TOOL: QUARANTINE_DEVICE`), and suggestion chips.
* **Multilingual AI**: Powered by Google Gemini in English, हिन्दी (Hindi), and मराठी (Marathi).
* **Router Screenshot Audit**: Upload router or terminal screenshots for instant AI vulnerability analysis.

### 5. SmartHome Sentinel Background Honeypot
* **Decoy Traps**: `/admin`, `/.env`, `/wp-login.php`, `/cgi-bin/luci`, `/setup.cgi`, `/api/v1/unlock`, `/config.php`, `/.git`, `/phpmyadmin`.
* **Forensic Evidence Logging**: Captured attacks are recorded to `backend/evidence/[ip].json`.
* **Auto-Defense Lock**: If an intrusion occurs, the system locks critical endpoints and logs forensic telemetry.

---

## 💻 Quick Start & Running

### Option 1: Start Everything with 1 Click
Double click [`START_ALL.bat`](file:///C:/Users/Admin/Desktop/CyberGuard_SmartHome_App/START_ALL.bat) to launch both the backend server and frontend development server.

### Option 2: Open Web Preview
Double click [`START_WEB.bat`](file:///C:/Users/Admin/Desktop/CyberGuard_SmartHome_App/START_WEB.bat) or open:
`http://localhost:3000/`

### Option 3: Build for Google Play Store (.aab)
Double click [`BUILD_PLAYSTORE_BUNDLE.bat`](file:///C:/Users/Admin/Desktop/CyberGuard_SmartHome_App/BUILD_PLAYSTORE_BUNDLE.bat)

### Option 4: Build Direct Install APK (.apk)
Double click [`BUILD_APK_TEST.bat`](file:///C:/Users/Admin/Desktop/CyberGuard_SmartHome_App/BUILD_APK_TEST.bat)
