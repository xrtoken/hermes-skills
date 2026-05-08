'use strict';

// Default model IDs (XRToken canonical names as of 2026-05).
// Override via env vars when XRToken adds new IDs without requiring a skill update.
// Run `xrtoken models list --type video|image` to see live IDs.
const DEFAULTS = {
  videoStandard: process.env.XRTOKEN_VIDEO_STANDARD || 'volcengine-overseas/dreamina-seedance-2-0-260128',
  videoFast:     process.env.XRTOKEN_VIDEO_FAST     || 'volcengine-overseas/dreamina-seedance-2-0-fast-260128',
  videoPro:      process.env.XRTOKEN_VIDEO_PRO      || null,  // 1.5-pro not currently exposed by XRToken
  imageLite:     process.env.XRTOKEN_IMAGE_LITE     || 'volcengine-overseas/seedream-5-0-lite-260128',
  imagePro:      process.env.XRTOKEN_IMAGE_PRO      || 'volcengine-overseas/seedream-4-5-251128',
};

// Pick a video model based on:
//   explicit `--model`
//   `modelHint` from NL extraction (fast | preview | flex | pro)
//   resolution (1080p needs standard)
//   presence of multimodal references (1.5 pro doesn't support them)
function pickVideoModel({ model, modelHint, resolution, hasReferences, draft, serviceTier } = {}) {
  if (model) return resolveAlias(model, 'video');

  // Pro (1.5) supports draft/flex on backends that expose it; if not exposed,
  // we fall through to standard so the request still works.
  if ((draft || serviceTier === 'flex' || modelHint === 'flex' || modelHint === 'preview')
      && DEFAULTS.videoPro && !hasReferences) {
    return DEFAULTS.videoPro;
  }

  if (modelHint === 'fast' && resolution !== '1080p') return DEFAULTS.videoFast;
  return DEFAULTS.videoStandard;
}

// Pick an image model. Returns { model, async }.
function pickImageModel({ model, modelHint } = {}) {
  if (model) {
    const m = resolveAlias(model, 'image');
    return { model: m, async: /pro/i.test(m) };
  }
  if (modelHint === 'pro' || modelHint === 'preview') {
    return { model: DEFAULTS.imagePro, async: true };
  }
  return { model: DEFAULTS.imageLite, async: false };
}

// Allow short aliases like `2.0`, `2.0 fast`, `1.5 pro`, `lite`, `pro`.
function resolveAlias(name, kind) {
  const n = String(name).trim().toLowerCase();
  if (kind === 'video') {
    if (/^(2\.0|2|standard|seedance.?2\.?0)$/.test(n)) return DEFAULTS.videoStandard;
    if (/^(2\.0\s*fast|fast)$/.test(n)) return DEFAULTS.videoFast;
    if (/^(1\.5\s*pro|1\.5|pro)$/.test(n)) return DEFAULTS.videoPro || DEFAULTS.videoStandard;
  }
  if (kind === 'image') {
    if (/^lite$/.test(n)) return DEFAULTS.imageLite;
    if (/^pro$/.test(n)) return DEFAULTS.imagePro;
  }
  return name;
}

module.exports = { pickVideoModel, pickImageModel, DEFAULTS };
