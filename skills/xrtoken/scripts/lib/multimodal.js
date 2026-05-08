'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
};

function fileToDataUrl(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const buf = fs.readFileSync(abs);
  const ext = path.extname(abs).toLowerCase();
  const mime = MIME_BY_EXT[ext] || 'application/octet-stream';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// Accept either a local path or http(s):// URL or asset:// URI.
// Returns a URL string suitable for content[].image_url.url etc.
function toUrl(input) {
  if (!input) return null;
  if (/^(https?:|asset:|data:)/i.test(input)) return input;
  return fileToDataUrl(input);
}

// Build OpenAI-style content array.
//   prompt: string
//   images: [{url, role?}, ...] — role optional: first_frame | last_frame | reference_image
//   videos: [{url}, ...]
//   audios: [{url}, ...]
function buildContent({ prompt, images = [], videos = [], audios = [] }) {
  const out = [];
  if (prompt) out.push({ type: 'text', text: prompt });
  for (const img of images) {
    const item = { type: 'image_url', image_url: { url: img.url } };
    if (img.role) item.role = img.role;
    out.push(item);
  }
  for (const v of videos) {
    out.push({ type: 'video_url', video_url: { url: v.url } });
  }
  for (const a of audios) {
    out.push({ type: 'audio_url', audio_url: { url: a.url } });
  }
  return out;
}

// Auto-assign roles for image-to-video based on count:
//   1 image → first_frame
//   2 images → first_frame, last_frame
//   ≥3 images → reference_image
function autoRoleImages(imageInputs) {
  const arr = imageInputs.map((src) => ({ url: toUrl(src) }));
  if (arr.length === 1) {
    arr[0].role = 'first_frame';
  } else if (arr.length === 2) {
    arr[0].role = 'first_frame';
    arr[1].role = 'last_frame';
  } else if (arr.length >= 3) {
    for (const item of arr) item.role = 'reference_image';
  }
  return arr;
}

module.exports = { fileToDataUrl, toUrl, buildContent, autoRoleImages };
