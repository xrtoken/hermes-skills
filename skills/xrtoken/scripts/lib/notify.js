'use strict';

const { spawn } = require('node:child_process');

// Desktop notification. Currently only macOS via osascript; on other platforms
// silently no-ops. Triggered by `--notify` CLI flag or env XRTOKEN_NOTIFY=1.
function notify({ title, message, sound = 'Glass' }) {
  if (!shouldNotify()) return;
  if (process.platform !== 'darwin') return;
  try {
    const escaped = (s) => String(s || '').replace(/["\\]/g, '\\$&').replace(/\n/g, ' ');
    const script = `display notification "${escaped(message)}" with title "${escaped(title)}" sound name "${escaped(sound)}"`;
    spawn('osascript', ['-e', script], { stdio: 'ignore', detached: true }).unref();
  } catch { /* ignore */ }
}

let _force = null;
function setEnabled(enabled) { _force = !!enabled; }
function shouldNotify() {
  if (_force !== null) return _force;
  return Boolean(process.env.XRTOKEN_NOTIFY) && process.env.XRTOKEN_NOTIFY !== '0';
}

module.exports = { notify, setEnabled };
