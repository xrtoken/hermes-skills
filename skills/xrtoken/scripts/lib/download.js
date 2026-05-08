'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const https = require('node:https');
const http = require('node:http');
const { URL } = require('node:url');

const ROOT_DIRNAME = 'XRToken-Outputs';

// Pick the first writable output root:
//   1. $XRTOKEN_OUTPUT_DIR (explicit)
//   2. ~/Desktop/XRToken-Outputs
//   3. ~/XRToken-Outputs
//   4. ./XRToken-Outputs
function resolveOutputRoot() {
  const explicit = process.env.XRTOKEN_OUTPUT_DIR;
  if (explicit) return ensureDir(explicit);
  const candidates = [
    path.join(os.homedir(), 'Desktop', ROOT_DIRNAME),
    path.join(os.homedir(), ROOT_DIRNAME),
    path.join(process.cwd(), ROOT_DIRNAME),
  ];
  for (const dir of candidates) {
    try { return ensureDir(dir); } catch { /* try next */ }
  }
  return ensureDir(path.join(os.tmpdir(), ROOT_DIRNAME));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  fs.accessSync(dir, fs.constants.W_OK);
  return dir;
}

function safeFilename(taskId) {
  return String(taskId).replace(/[^A-Za-z0-9._-]+/g, '_');
}

// Download a remote URL to <root>/<taskId>/<filename>. Returns absolute path.
async function downloadTo({ url, taskId, filename }) {
  const root = resolveOutputRoot();
  const dir = path.join(root, safeFilename(taskId));
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, filename);

  await streamToFile(url, target);
  return target;
}

function streamToFile(url, target) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'http:' ? http : https;
    const req = lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow one redirect.
        streamToFile(res.headers.location, target).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed (${res.statusCode}): ${url}`));
        res.resume();
        return;
      }
      const out = fs.createWriteStream(target);
      res.pipe(out);
      out.on('finish', () => out.close((err) => err ? reject(err) : resolve(target)));
      out.on('error', reject);
    });
    req.on('error', reject);
  });
}

function inferExt({ url, defaultExt }) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
    if (m) return '.' + m[1].toLowerCase();
  } catch { /* ignore */ }
  return defaultExt;
}

module.exports = { downloadTo, resolveOutputRoot, inferExt };
