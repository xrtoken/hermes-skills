'use strict';

const { asBool } = require('../lib/args');
const { clientFromOpts } = require('../lib/client');
const { toUrl } = require('../lib/multimodal');
const log = require('../lib/log');

module.exports = async function assetCreate(opts) {
  if (opts.help) { console.log(HELP); return; }
  if (!opts.name) throw new Error('--name required');
  const url = opts.url || (opts.imageFile ? toUrl(opts.imageFile) : null);
  if (!url) throw new Error('--url or --image-file required');

  const body = { name: opts.name, url };
  if (opts.groupId) body.group_id = opts.groupId;

  if (asBool(opts.dryRun)) { log.json({ endpoint: 'POST /v1/assets', body: redact(body) }); return; }

  const api = clientFromOpts(opts);
  const res = await api.createAsset(body);
  if (opts.json) { log.json(res); return; }
  log.ok(`asset created: ${res.id}  (${res.name})`);
};

function redact(body) {
  const out = { ...body };
  if (out.url && out.url.startsWith('data:')) out.url = '[data-url, redacted]';
  return out;
}

const HELP = `xrtoken asset create — register a canonical reference asset
  --name <str>          Required
  --url <url>           OR  --image-file <path>
  --group-id <id>
  --dry-run
  --json
`;
