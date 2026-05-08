'use strict';

const { asInt, asBool } = require('../lib/args');
const { clientFromOpts } = require('../lib/client');
const { extractFromPrompt } = require('../lib/nl-extract');
const { pickImageModel } = require('../lib/model-route');
const tasks = require('../lib/tasks');
const log = require('../lib/log');

module.exports = async function imageAsyncCreate(opts) {
  if (opts.help) { console.log(HELP); return; }
  if (!opts.prompt) throw new Error('--prompt is required');

  const extracted = extractFromPrompt(opts.prompt);
  const { model } = pickImageModel({
    model: opts.model || 'pro',
    modelHint: extracted.modelHint || 'pro',
  });

  const body = stripUndefined({
    model,
    prompt: opts.prompt,
    n: asInt(opts.n, 1),
    size: opts.size,
    seed: asInt(opts.seed),
  });

  if (asBool(opts.dryRun)) {
    log.json({ endpoint: 'POST /v1/images/async', body });
    return;
  }

  const api = clientFromOpts(opts);
  const res = await api.createImageAsync(body);

  tasks.add({
    id: res.id,
    modality: 'image',
    model: res.model || model,
    prompt: opts.prompt,
    submittedAt: new Date().toISOString(),
  });

  if (opts.json) { log.json(res); return; }
  log.ok(`Image task submitted`);
  log.ok(`  id:     ${res.id}`);
  log.ok(`  status: ${res.status || 'queued'}`);
  log.ok(`  Run:    xrtoken image check-pending`);
};

function stripUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

const HELP = `xrtoken image async-create — submit async image task (pro models)

Required:
  --prompt <text>

Optional:
  --model <id|alias>    Default: pro
  --n <int>             Default 1
  --size <WxH>
  --seed <int>
  --dry-run
  --json
`;
