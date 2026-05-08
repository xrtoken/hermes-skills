'use strict';

const { clientFromOpts } = require('../lib/client');
const log = require('../lib/log');

module.exports = async function assetList(opts) {
  if (opts.help) { console.log(HELP); return; }
  const api = clientFromOpts(opts);
  const params = {};
  if (opts.groupId) params.group_id = opts.groupId;
  if (opts.limit) params.limit = opts.limit;
  const res = await api.listAssets(params);
  if (opts.json) { log.json(res); return; }
  const items = res.data || res.assets || [];
  if (items.length === 0) { log.info('(no assets)'); return; }
  for (const a of items) {
    log.info(`${a.id}\t${a.name || ''}\t${a.url || ''}`);
  }
};

const HELP = `xrtoken asset list — list registered assets
  --group-id <id>
  --limit <n>
  --json
`;
