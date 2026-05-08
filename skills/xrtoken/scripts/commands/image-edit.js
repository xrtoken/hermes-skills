'use strict';

const { asInt, asBool, asArray } = require('../lib/args');
const { clientFromOpts } = require('../lib/client');
const { toUrl } = require('../lib/multimodal');
const { pickImageModel } = require('../lib/model-route');
const { downloadTo, inferExt } = require('../lib/download');
const log = require('../lib/log');

module.exports = async function imageEdit(opts) {
  if (opts.help) { console.log(HELP); return; }
  if (!opts.prompt) throw new Error('--prompt is required');

  const imageInputs = [
    ...asArray(opts.imageFile),
    ...asArray(opts.imageUrl),
  ];
  if (imageInputs.length === 0) throw new Error('--image-file or --image-url required');

  const { model } = pickImageModel({ model: opts.model });
  const imageUrl = toUrl(imageInputs[0]);

  const body = stripUndefined({
    model,
    prompt: opts.prompt,
    image_url: imageUrl,
    mask_url: opts.maskUrl ? toUrl(opts.maskUrl) : undefined,
    n: asInt(opts.n, 1),
    size: opts.size,
    seed: asInt(opts.seed),
  });

  if (asBool(opts.dryRun)) {
    log.json({ endpoint: 'POST /v1/images/edits', body: redact(body) });
    return;
  }

  const api = clientFromOpts(opts);
  const res = await api.editImage(body);

  if (opts.json) { log.json(res); return; }

  const urls = (res.data || []).map((d) => d.url).filter(Boolean);
  log.ok(`Edit produced ${urls.length} image(s) with ${model}`);
  for (const url of urls) log.ok(`  url: ${url}`);

  if (asBool(opts.download, true)) {
    const taskId = res.id || `edit-${Date.now()}`;
    for (let i = 0; i < urls.length; i++) {
      const ext = inferExt({ url: urls[i], defaultExt: '.png' });
      const local = await downloadTo({ url: urls[i], taskId, filename: `edit-${i + 1}${ext}` });
      log.ok(`  saved: ${local}`);
    }
  }
};

function redact(body) {
  const out = { ...body };
  if (out.image_url && out.image_url.startsWith('data:')) out.image_url = '[data-url, redacted]';
  if (out.mask_url && out.mask_url.startsWith('data:')) out.mask_url = '[data-url, redacted]';
  return out;
}

function stripUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

const HELP = `xrtoken image edit — img2img / image edit

Required:
  --prompt <text>
  --image-file <path>     OR  --image-url <url>

Optional:
  --mask-url <url|path>
  --model <id|alias>
  --n <int>
  --size <WxH>
  --seed <int>
  --no-download
  --dry-run
  --json
`;
