'use strict';

const { clientFromOpts } = require('../lib/client');
const tasks = require('../lib/tasks');
const { downloadTo, inferExt } = require('../lib/download');
const { notify } = require('../lib/notify');
const log = require('../lib/log');

const TERMINAL = new Set(['succeeded', 'failed', 'cancelled', 'expired']);

module.exports = async function videoCheckPending(opts) {
  if (opts.help) { console.log(HELP); return; }

  const pending = tasks.listByModality('video');
  if (pending.length === 0) {
    if (opts.json) log.json({ checked: 0, completed: [] });
    else log.info('(no pending video tasks)');
    return;
  }

  const api = clientFromOpts(opts);
  const completed = [];
  for (const t of pending) {
    let cur;
    try { cur = await api.getVideo(t.id); }
    catch (err) {
      log.warn(`get ${t.id} failed: ${err.message}`);
      continue;
    }
    if (!TERMINAL.has(cur.status)) {
      if (!opts.json) log.info(`${t.id}\t${cur.status}`);
      continue;
    }
    if (cur.status === 'succeeded' && cur.video_url) {
      const ext = inferExt({ url: cur.video_url, defaultExt: '.mp4' });
      const local = await downloadTo({
        url: cur.video_url,
        taskId: t.id,
        filename: `video${ext}`,
      });
      cur._localPath = local;
      if (!opts.json) log.ok(`${t.id}\tsucceeded\t${local}`);
      notify({ title: 'XRToken video ready', message: `${t.id}\n${local}` });
    } else if (!opts.json) {
      log.warn(`${t.id}\t${cur.status}${cur.error ? ' ' + cur.error.message : ''}`);
    }
    tasks.remove(t.id);
    completed.push(cur);
  }

  if (opts.json) log.json({ checked: pending.length, completed });
};

const HELP = `xrtoken video check-pending — poll all pending video tasks; auto-download succeeded
  --json
`;
