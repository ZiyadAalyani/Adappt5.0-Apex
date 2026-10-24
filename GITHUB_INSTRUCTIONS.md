# 🐙 How to Put CyberGuard on GitHub

You can publish this project to GitHub using either of the two easy methods below:

---

## ⚡ Method 1: Web Drag & Drop (Fastest — 30 Seconds)

1. Open your browser and go to: **[https://github.com/new](https://github.com/new)**
2. Enter Repository name: `CyberGuard-SmartHome-Sentinel`
3. Choose **Public** or **Private**, then click **Create repository**.
4. On the next screen, click the link that says:  
   👉 **"uploading an existing file"**
5. Drag and drop all the files and folders from this folder (`CyberGuard_SmartHome_App`):
   * `frontend`
   * `backend`
   * `README.md`
   * `.gitignore`
   * `START_ALL.bat`
6. Click **Commit changes**. Done!

---

## 🤖 Method 2: One-Command Automated Uploader

We have created an automated publisher script that uses the official GitHub API (works without installing `git.exe`):

1. Generate a GitHub token:
   * Go to **[https://github.com/settings/tokens/new](https://github.com/settings/tokens/new)**
   * Note: `CyberGuard`
   * Check the **`repo`** checkbox.
   * Click **Generate token** and copy it (starts with `ghp_...`).
2. Open PowerShell in this folder and run:
   ```powershell
   node upload_to_github.js ghp_YOUR_TOKEN_HERE
   ```
3. The script will automatically create the repository on your GitHub account and upload all files!

---

## 📦 Method 3: Upload the Complete Pre-Packaged Release ZIP
You can also directly attach the pre-built archive to your repository's Releases page:
* File: `C:\Users\Admin\Desktop\CyberGuard_SmartHome_Sentinel_AI_PlayStore.zip`
