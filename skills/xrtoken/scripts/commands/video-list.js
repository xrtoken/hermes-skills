'use strict';

const { clientFromOpts } = require('../lib/client');
const log = require('../lib/log');

module.exports = async function videoList(opts) {
  if (opts.help) { console.log(HELP); return; }
  const api = clientFromOpts(opts);
  const params = {};
  if (opts.filterStatus) params.status = opts.filterStatus;
  if (opts.limit) params.limit = opts.limit;
  if (opts.userId) params.user_id = opts.userId;
  const res = await api.listVideos(params);

  if (opts.json) { log.json(res); return; }

  const items = res.data || res.tasks || [];
  if (items.length === 0) { log.info('(no tasks)'); return; }
  for (const t of items) {
    log.info(`${t.id}\t${t.status}\t${t.model || ''}\t${t.created_at || ''}`);
  }
};

const HELP = `xrtoken video list — list recent video tasks
  --filter-status <s>   queued | processing | succeeded | failed | cancelled | expired
  --limit <n>
  --user-id <id>
  --json
`;
