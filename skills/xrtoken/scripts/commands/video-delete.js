'use strict';

const { clientFromOpts } = require('../lib/client');
const tasks = require('../lib/tasks');
const log = require('../lib/log');

module.exports = async function videoDelete(opts) {
  if (opts.help) { console.log(HELP); return; }
  const id = opts.taskId || opts.id;
  if (!id) throw new Error('--task-id required');

  const api = clientFromOpts(opts);
  const res = await api.deleteVideo(id);
  tasks.remove(id);

  if (opts.json) { log.json(res); return; }
  log.ok(`task ${id} cancelled`);
};

const HELP = `xrtoken video delete — cancel a queued/processing task
  --task-id <id>     Required
  --json
`;
