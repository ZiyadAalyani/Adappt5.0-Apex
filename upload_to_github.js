/**
 * Direct GitHub Publisher (No git.exe required!)
 * Uses GitHub REST API to create a repository and upload all files.
 *
 * Usage:
 *   node upload_to_github.js <YOUR_GITHUB_TOKEN> [REPO_NAME]
 */

const fs = require('fs');
const path = require('path');

const token = process.argv[2] || process.env.GITHUB_TOKEN;
const repoName = process.argv[3] || 'CyberGuard-SmartHome-Sentinel';

if (!token) {
  console.log('====================================================================');
  console.log('🚀 Automated GitHub Repository Publisher');
  console.log('====================================================================');
  console.log('Usage: node upload_to_github.js <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>');
  console.log('\nTo get a GitHub token:');
  console.log('1. Visit: https://github.com/settings/tokens/new');
  console.log('2. Check the "repo" scope box and click "Generate token"');
  console.log('3. Run: node upload_to_github.js ghp_yourTokenHere');
  console.log('====================================================================');
  process.exit(1);
}

async function uploadFile(owner, repo, relativePath, localPath) {
  const content = fs.readFileSync(localPath).toString('base64');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath.replace(/\\/g, '/')}`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'CyberGuard-Publisher',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Add ${relativePath}`,
      content: content,
    }),
  });

  if (res.ok) {
    console.log(`✅ Uploaded: ${relativePath}`);
  } else {
    const err = await res.json();
    console.log(`⚠️  ${relativePath}: ${err.message}`);
  }
}

async function getAuthenticatedUser() {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'CyberGuard-Publisher',
    },
  });
  if (!res.ok) throw new Error('Invalid GitHub token. Please verify permissions.');
  const data = await res.json();
  return data.login;
}

async function createRepo(repo) {
  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'CyberGuard-Publisher',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repo,
      description: 'CyberGuard Smart Home Sentinel & AegisBot AI (ADAPPT 5.0 Domain 1)',
      private: false,
    }),
  });
  const data = await res.json();
  return data;
}

function getAllFiles(dirPath, arrayOfFiles = [], baseDir = dirPath) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    if (file === 'node_modules' || file === '.git' || file === '.expo') return;
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles, baseDir);
    } else {
      const rel = path.relative(baseDir, fullPath);
      arrayOfFiles.push({ relative: rel, full: fullPath });
    }
  });
  return arrayOfFiles;
}

async function main() {
  try {
    console.log('Authenticating with GitHub...');
    const username = await getAuthenticatedUser();
    console.log(`Authenticated as GitHub user: @${username}`);

    console.log(`Creating repository: ${username}/${repoName}...`);
    await createRepo(repoName);

    console.log('Scanning project files...');
    const allFiles = getAllFiles(__dirname);
    console.log(`Found ${allFiles.length} files to upload.`);

    for (const f of allFiles) {
      if (f.relative === 'upload_to_github.js') continue;
      await uploadFile(username, repoName, f.relative, f.full);
    }

    console.log('====================================================================');
    console.log(`🎉 SUCCESS! Project published to GitHub:`);
    console.log(`🔗 https://github.com/${username}/${repoName}`);
    console.log('====================================================================');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
