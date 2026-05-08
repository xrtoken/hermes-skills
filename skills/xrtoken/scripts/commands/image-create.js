'use strict';

const { asInt, asBool } = require('../lib/args');
const { clientFromOpts } = require('../lib/client');
const { extractFromPrompt } = require('../lib/nl-extract');
const { pickImageModel } = require('../lib/model-route');
const { downloadTo, inferExt } = require('../lib/download');
const log = require('../lib/log');

module.exports = async function imageCreate(opts) {
  if (opts.help) { console.log(HELP); return; }
  if (!opts.prompt) throw new Error('--prompt is required');

  const extracted = extractFromPrompt(opts.prompt);
  const { model, async: needAsync } = pickImageModel({
    model: opts.model,
    modelHint: extracted.modelHint,
  });

  if (needAsync && !opts.forceSync) {
    log.warn(`Model ${model} requires async — delegating to image async-create`);
    const handler = require('./image-async-create');
    return handler(opts);
  }

  const body = stripUndefined({
    model,
    prompt: opts.prompt,
    n: asInt(opts.n, 1),
    size: opts.size,
    seed: asInt(opts.seed),
    response_format: opts.responseFormat,
  });

  if (asBool(opts.dryRun)) {
    log.json({ endpoint: 'POST /v1/images/generations', body });
    return;
  }

  const api = clientFromOpts(opts);
  const res = await api.createImage(body);

  if (opts.json) { log.json(res); return; }

  const urls = (res.data || []).map((d) => d.url).filter(Boolean);
  log.ok(`Generated ${urls.length} image(s) with ${model}`);
  for (const url of urls) log.ok(`  url: ${url}`);

  if (asBool(opts.download, true)) {
    const taskId = res.id || `img-${Date.now()}`;
    for (let i = 0; i < urls.length; i++) {
      const ext = inferExt({ url: urls[i], defaultExt: '.png' });
      const local = await downloadTo({ url: urls[i], taskId, filename: `image-${i + 1}${ext}` });
      log.ok(`  saved: ${local}`);
    }
  }
};

function stripUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

const HELP = `xrtoken image create — synchronous image generation

Required:
  --prompt <text>

Optional:
  --model <id|alias>      Aliases: lite (default) / pro (auto-async)
  --n <int>               Default 1
  --size <WxH>            e.g. 1024x1024
  --seed <int>
  --response-format <url|b64_json>
  --no-download           Skip auto-download
  --force-sync            Force sync endpoint even for pro models
  --dry-run               Print body, don't call API
  --json                  Raw JSON
`;
