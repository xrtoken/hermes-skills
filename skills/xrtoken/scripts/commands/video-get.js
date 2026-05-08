'use strict';

const { clientFromOpts } = require('../lib/client');
const log = require('../lib/log');

module.exports = async function videoGet(opts) {
  if (opts.help) { console.log(HELP); return; }
  const id = opts.taskId || opts.id;
  if (!id) throw new Error('--task-id required');

  const api = clientFromOpts(opts);
  const res = await api.getVideo(id);
  if (opts.json) { log.json(res); return; }

  log.info(`task:       ${res.id}`);
  log.info(`model:      ${res.model || '-'}`);
  log.info(`status:     ${res.status}`);
  if (res.duration) log.info(`duration:   ${res.duration}s`);
  if (res.resolution) log.info(`resolution: ${res.resolution}`);
  if (res.ratio) log.info(`ratio:      ${res.ratio}`);
  if (res.video_url) log.info(`video_url:  ${res.video_url}`);
  if (res.last_frame_url) log.info(`last_frame: ${res.last_frame_url}`);
  if (res.error) log.error(`error: ${res.error.code} ${res.error.message}`);
};

const HELP = `xrtoken video get — query single task
  --task-id <id>     Task to query (required)
  --json             Raw JSON
`;
