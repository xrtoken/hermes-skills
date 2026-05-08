'use strict';

// Lightweight Seedance prompt validator. Only runs when the caller passes
// --strict-prompt and the picked model is in the Seedance family.
//
// Returns { fails: string[], warns: string[] }.
// fails: hard violations (banned fast-motion words, prompt too short)
// warns: soft signals the agent likely forgot something
function validatePrompt(prompt, { model, requireFaceConstraint = true } = {}) {
  const out = { fails: [], warns: [] };
  if (!isSeedance(model)) return out;
  if (!prompt || typeof prompt !== 'string') {
    out.fails.push('prompt is empty');
    return out;
  }

  // Banned fast-motion words from the seedance-prompt skill §5.
  const banned = ['快速', '猛烈', '剧烈', '迅速', '突然', '猛地', '快速地'];
  for (const w of banned) {
    if (prompt.includes(w)) {
      out.fails.push(`contains banned fast-motion word "${w}" — use deceleration vocabulary instead (缓缓/轻轻/缓慢)`);
    }
  }

  // Length: anything below 50 chars almost never meets the §1 structure.
  const len = [...prompt].length;
  if (len < 50) {
    out.fails.push(`prompt is ${len} chars, expected ≥ 50 to fit the §1 structure (镜头+场景+角色+动作+光影+画质+约束)`);
  }

  // Shot/camera keyword: §3 says it MUST be written.
  const shotKeywords = ['镜头', '机位', '中景', '近景', '远景', '特写', '过肩', '俯视', '仰视', '主观', '跟拍', '推进', '拉远', '横摇', '平视', '推镜', '拉镜'];
  if (!shotKeywords.some((k) => prompt.includes(k))) {
    out.warns.push('no shot/camera keyword — pick one from §3 (中景/近景/特写/过肩/...)');
  }

  // Quality anchor: §7 says it should appear penultimate.
  const qualityAnchors = ['电影级', '写实', '影视质感', '浅景深', '电影摄影', '动漫风格', '赛璐璐', '日系动画'];
  if (!qualityAnchors.some((k) => prompt.includes(k))) {
    out.warns.push('no quality anchor — add §7 phrase (电影级画面 / 动漫风格画面 ...)');
  }

  // Face-stability constraint: §8 says required when faces are involved.
  if (requireFaceConstraint && hasFaceContext(prompt) && !hasFaceConstraint(prompt)) {
    out.warns.push('face/character mentioned but no §8 constraint (面部稳定不变形, 五官清晰...)');
  }

  // Watermark/text constraint: §1 default.
  if (!/禁止.{0,4}文字|禁止.{0,4}水印|禁止.{0,4}字幕/.test(prompt)) {
    out.warns.push('no §8 watermark/text constraint — append "禁止出现任何文字、字幕、标题、水印" unless user explicitly wants on-screen text');
  }

  return out;
}

function isSeedance(model) {
  if (!model) return false;
  return /seedance/i.test(model);
}

function hasFaceContext(p) {
  return /人物|角色|男|女|孩|脸|面孔|五官|笑|哭|主角|演员|肖像|男孩|女孩|男人|女人/.test(p);
}

function hasFaceConstraint(p) {
  return /面部.{0,4}(稳定|不变形)|五官清晰|人体结构正常|比例自然|动作自然流畅/.test(p);
}

function formatReport(report) {
  const lines = [];
  for (const f of report.fails) lines.push(`[strict-prompt] FAIL: ${f}`);
  for (const w of report.warns) lines.push(`[strict-prompt] WARN: ${w}`);
  if (report.fails.length || report.warns.length) {
    lines.push('[strict-prompt] hint: invoke seedance-prompt skill to rewrite, then retry. Bypass with --no-strict-prompt at your own risk.');
  }
  return lines.join('\n');
}

module.exports = { validatePrompt, formatReport, isSeedance };
