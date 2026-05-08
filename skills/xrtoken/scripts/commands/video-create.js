'use strict';

const { asArray, asBool, asInt } = require('../lib/args');
const { clientFromOpts } = require('../lib/client');
const { autoRoleImages, buildContent, toUrl } = require('../lib/multimodal');
const { extractFromPrompt, mergeWithExplicit } = require('../lib/nl-extract');
const { pickVideoModel } = require('../lib/model-route');
const { validatePrompt, formatReport } = require('../lib/prompt-check');
const tasks = require('../lib/tasks');
const log = require('../lib/log');

module.exports = async function videoCreate(opts) {
  if (opts.help) {
    console.log(HELP);
    return;
  }
  if (!opts.prompt) throw new Error('--prompt is required');

  const extracted = extractFromPrompt(opts.prompt);
  const merged = mergeWithExplicit({
    duration: asInt(opts.duration),
    ratio: opts.ratio,
    resolution: opts.resolution,
    generateAudio: opts.generateAudio === undefined ? undefined : asBool(opts.generateAudio),
    cameraFixed: opts.cameraFixed === undefined ? undefined : asBool(opts.cameraFixed),
    watermark: opts.watermark === undefined ? undefined : asBool(opts.watermark),
    returnLastFrame: opts.returnLastFrame === undefined ? undefined : asBool(opts.returnLastFrame),
    serviceTier: opts.serviceTier,
    seed: asInt(opts.seed),
    enableWebSearch: opts.enableWebSearch === undefined ? undefined : asBool(opts.enableWebSearch),
    callbackUrl: opts.callbackUrl,
    safetyIdentifier: opts.safetyIdentifier,
    draft: opts.draft === undefined ? undefined : asBool(opts.draft),
    modelHint: undefined,
  }, extracted);

  // Multimodal inputs
  const imageInputs = [
    ...asArray(opts.imageFile),
    ...asArray(opts.imageUrl),
  ];
  const videoInputs = [
    ...asArray(opts.videoFile),
    ...asArray(opts.videoUrl),
  ].map((src) => ({ url: toUrl(src) }));
  const audioInputs = [
    ...asArray(opts.audioFile),
    ...asArray(opts.audioUrl),
  ].map((src) => ({ url: toUrl(src) }));

  const images = autoRoleImages(imageInputs);
  const hasReferences = images.length > 0 || videoInputs.length > 0 || audioInputs.length > 0;

  const model = pickVideoModel({
    model: opts.model,
    modelHint: merged.modelHint,
    resolution: merged.resolution,
    hasReferences,
    draft: merged.draft,
    serviceTier: merged.serviceTier,
  });

  if (asBool(opts.strictPrompt)) {
    const report = validatePrompt(opts.prompt, { model });
    if (report.fails.length || report.warns.length) {
      log.warn(formatReport(report));
    }
    if (report.fails.length) {
      throw new Error(`prompt failed strict-prompt checks (${report.fails.length} fail). Rewrite via seedance-prompt skill, or pass --no-strict-prompt to bypass.`);
    }
  }

  const content = buildContent({
    prompt: opts.prompt,
    images,
    videos: videoInputs,
    audios: audioInputs,
  });

  const body = stripUndefined({
    model,
    content,
    duration: merged.duration,
    ratio: merged.ratio,
    resolution: merged.resolution,
    generate_audio: merged.generateAudio,
    camera_fixed: merged.cameraFixed,
    watermark: merged.watermark,
    return_last_frame: merged.returnLastFrame,
    service_tier: merged.serviceTier,
    seed: merged.seed,
    callback_url: merged.callbackUrl,
    safety_identifier: merged.safetyIdentifier,
    enable_web_search: merged.enableWebSearch,
    draft: merged.draft,
  });

  if (asBool(opts.dryRun)) {
    log.json({ endpoint: 'POST /v1/videos/generations', body });
    return;
  }

  const api = clientFromOpts(opts);
  const res = await api.createVideo(body);

  tasks.add({
    id: res.id,
    modality: 'video',
    model: res.model || model,
    prompt: opts.prompt,
    submittedAt: new Date().toISOString(),
  });

  if (opts.json) {
    log.json(res);
  } else {
    log.ok(`Video task submitted`);
    log.ok(`  id:     ${res.id}`);
    log.ok(`  model:  ${res.model || model}`);
    log.ok(`  status: ${res.status || 'queued'}`);
    log.ok(`  Run:  xrtoken video check-pending  (or)  xrtoken video get --task-id ${res.id}`);
  }

  if (asBool(opts.wait)) {
    const polled = await pollUntilDone(api, res.id, opts);
    if (opts.json) log.json(polled);
  }
};

async function pollUntilDone(api, taskId, opts) {
  const intervalMs = (asInt(opts.pollSeconds, 10)) * 1000;
  const timeoutMs  = (asInt(opts.timeoutSeconds, 1800)) * 1000;
  const start = Date.now();
  while (true) {
    const cur = await api.getVideo(taskId);
    if (['succeeded', 'failed', 'cancelled', 'expired'].includes(cur.status)) {
      if (cur.status === 'succeeded' && cur.video_url) {
        const { downloadTo, inferExt } = require('../lib/download');
        const ext = inferExt({ url: cur.video_url, defaultExt: '.mp4' });
        const local = await downloadTo({
          url: cur.video_url,
          taskId,
          filename: `video${ext}`,
        });
        if (!opts.json) log.ok(`  saved: ${local}`);
        cur._localPath = local;
        require('../lib/notify').notify({
          title: 'XRToken video ready',
          message: `${taskId}\n${local}`,
        });
      }
      require('../lib/tasks').remove(taskId);
      return cur;
    }
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for ${taskId}`);
    if (!opts.json) log.info(`  status: ${cur.status} (waiting…)`);
    await sleep(intervalMs);
  }
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function stripUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

const HELP = `xrtoken video create — submit an async video task

Required:
  --prompt <text>              Describe the video

Common:
  --duration <sec>             Default 5
  --ratio <16:9|9:16|...>      Default adaptive
  --resolution <480p|720p|1080p>  Default 720p
  --generate-audio / --no-generate-audio
  --camera-fixed
  --watermark
  --return-last-frame
  --service-tier <default|flex>
  --seed <int>
  --model <id|alias>           Aliases: 2.0 / 2.0-fast / 1.5-pro
  --draft                      Preview mode (1.5-pro only)

Multimodal (each may be repeated):
  --image-file <path>          1=first_frame, 2=first+last, ≥3=reference
  --image-url <url>
  --video-file <path>          --video-url <url>
  --audio-file <path>          --audio-url <url>

Misc:
  --callback-url <url>
  --safety-identifier <id>
  --wait                       Block until done; auto-download result
  --poll-seconds <n>           Polling interval when --wait (default 10)
  --timeout-seconds <n>        Total wait cap when --wait (default 1800)
  --strict-prompt              Validate against the seedance-prompt skill rules
                               (banned fast-motion words, length, shot keyword,
                               quality anchor, face constraint). Hard failures
                               abort submission with a clear message.
  --dry-run                    Print request body, don't call API
  --json                       Raw JSON output
`;
