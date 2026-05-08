'use strict';

const { clientFromOpts } = require('../lib/client');
const tasks = require('../lib/tasks');
const { downloadTo, inferExt } = require('../lib/download');
const { notify } = require('../lib/notify');
const log = require('../lib/log');

const TERMINAL = new Set(['succeeded', 'failed', 'cancelled', 'expired']);

module.exports = async function imageCheckPending(opts) {
  if (opts.help) { console.log(HELP); return; }

  const pending = tasks.listByModality('image');
  if (pending.length === 0) {
    if (opts.json) log.json({ checked: 0, completed: [] });
    else log.info('(no pending image tasks)');
    return;
  }

  const api = clientFromOpts(opts);
  const completed = [];
  for (const t of pending) {
    let cur;
    try { cur = await api.getImageAsync(t.id); }
    catch (err) {
      log.warn(`get ${t.id} failed: ${err.message}`);
      continue;
    }
    if (!TERMINAL.has(cur.status)) {
      if (!opts.json) log.info(`${t.id}\t${cur.status}`);
      continue;
    }
    if (cur.status === 'succeeded') {
      const items = (cur.data || cur.images || []).map((d) => d.url).filter(Boolean);
      const taskId = t.id;
      const locals = [];
      for (let i = 0; i < items.length; i++) {
        const ext = inferExt({ url: items[i], defaultExt: '.png' });
        const local = await downloadTo({ url: items[i], taskId, filename: `image-${i + 1}${ext}` });
        locals.push(local);
        if (!opts.json) log.ok(`${t.id}\tsucceeded\t${local}`);
      }
      cur._localPaths = locals;
      if (locals.length) {
        notify({ title: 'XRToken image ready', message: `${t.id}\n${locals[0]}` });
      }
    } else if (!opts.json) {
      log.warn(`${t.id}\t${cur.status}${cur.error ? ' ' + cur.error.message : ''}`);
    }
    tasks.remove(t.id);
    completed.push(cur);
  }

  if (opts.json) log.json({ checked: pending.length, completed });
};

const HELP = `xrtoken image check-pending — poll all pending image tasks; auto-download succeeded
  --json
`;
