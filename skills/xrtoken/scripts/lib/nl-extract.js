'use strict';

// Extract structured generation params from the user's natural-language prompt.
// CLI flags ALWAYS win — this only fills in unspecified slots.
// Returns a partial object: { duration?, ratio?, resolution?, generateAudio?, cameraFixed?,
//   serviceTier?, draft?, enableWebSearch?, modelHint?, seed? }
function extractFromPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return {};
  const p = prompt;
  const out = {};

  // duration: "5秒"/"5 秒"/"10s"/"10 seconds"
  const m = p.match(/(\d+)\s*(?:秒|s\b|seconds?\b)/i);
  if (m) out.duration = parseInt(m[1], 10);

  // ratio
  if (/竖屏|手机|九比十六|9\s*[:：]\s*16/.test(p)) out.ratio = '9:16';
  else if (/横屏|电脑|宽屏|十六比九|16\s*[:：]\s*9/.test(p)) out.ratio = '16:9';
  else if (/方形|正方形|1\s*[:：]\s*1/.test(p)) out.ratio = '1:1';
  else if (/4\s*[:：]\s*3/.test(p)) out.ratio = '4:3';
  else if (/3\s*[:：]\s*4/.test(p)) out.ratio = '3:4';
  else if (/21\s*[:：]\s*9|超宽|电影宽/.test(p)) out.ratio = '21:9';

  // resolution
  if (/1080p|超清|2k|高分辨率/i.test(p)) out.resolution = '1080p';
  else if (/720p|高清/i.test(p)) out.resolution = '720p';
  else if (/480p|标清|低清/i.test(p)) out.resolution = '480p';

  // audio
  if (/不要声音|静音|无声|不要音频|no audio|silent/i.test(p)) out.generateAudio = false;
  else if (/带声音|带音频|加音频|with audio/i.test(p)) out.generateAudio = true;

  // camera
  if (/固定镜头|镜头不动|稳定画面|camera\s*fixed/i.test(p)) out.cameraFixed = true;

  // service tier / draft / model hint
  if (/样片|预览|草稿|draft/i.test(p)) {
    out.draft = true;
    out.modelHint = 'preview';
  }
  if (/低成本|离线|flex|节省/i.test(p)) {
    out.serviceTier = 'flex';
    out.modelHint = out.modelHint || 'flex';
  }
  if (/快速生成|快点|急|加急|fast/i.test(p)) {
    out.modelHint = out.modelHint || 'fast';
  }
  if (/高质量|最强|pro|专业版/i.test(p)) {
    out.modelHint = out.modelHint || 'pro';
  }

  // web search
  if (/联网搜索|实时(?:新闻|信息)|web\s*search/i.test(p)) out.enableWebSearch = true;

  // seed
  const sm = p.match(/seed\s*[=:＝]\s*(-?\d+)/i);
  if (sm) out.seed = parseInt(sm[1], 10);

  return out;
}

// Merge extracted hints under explicit CLI options.
// explicit: object whose keys are camelCase; values may be undefined.
function mergeWithExplicit(explicit, extracted) {
  const result = { ...extracted };
  for (const [k, v] of Object.entries(explicit)) {
    if (v !== undefined && v !== null && v !== '') result[k] = v;
  }
  return result;
}

module.exports = { extractFromPrompt, mergeWithExplicit };
