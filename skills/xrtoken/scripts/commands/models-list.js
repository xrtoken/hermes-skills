'use strict';

const { clientFromOpts } = require('../lib/client');
const log = require('../lib/log');

module.exports = async function modelsList(opts) {
  if (opts.help) { console.log(HELP); return; }
  const api = clientFromOpts(opts);
  const res = await api.listModels();
  let items = res.data || res.models || [];
  if (opts.type) items = items.filter((m) => m.type === opts.type);
  if (opts.available) items = items.filter((m) => m.available);

  if (opts.json) { log.json(items); return; }
  if (items.length === 0) { log.info('(no models match)'); return; }

  for (const m of items) {
    const price = m.price_per_unit !== undefined ? `${m.price_per_unit}` : '-';
    const avail = m.available === false ? '[unavailable]' : '';
    log.info(`${m.id}\t${m.type || '-'}\t${price}\t${avail}`);
  }
};

const HELP = `xrtoken models list — list available models
  --type <image|video|text|audio>
  --available             Only available
  --json
`;
