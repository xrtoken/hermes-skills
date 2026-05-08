'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Persist pending tasks across invocations. Used by `check-pending` to know
// what to poll. File location order:
//   1. $XRTOKEN_STATE_DIR/pending-tasks.json
//   2. ~/.xrtoken/pending-tasks.json
//   3. ./.xrtoken/pending-tasks.json (cwd fallback for sandboxed envs)
function statePath() {
  const explicit = process.env.XRTOKEN_STATE_DIR;
  if (explicit) return path.join(explicit, 'pending-tasks.json');
  const candidates = [
    path.join(os.homedir(), '.xrtoken'),
    path.join(process.cwd(), '.xrtoken'),
  ];
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return path.join(dir, 'pending-tasks.json');
    } catch { /* try next */ }
  }
  // last-resort tmp dir
  return path.join(os.tmpdir(), 'xrtoken-pending-tasks.json');
}

function readAll() {
  const file = statePath();
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) || [];
  } catch {
    return [];
  }
}

function writeAll(tasks) {
  const file = statePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(tasks, null, 2));
}

function add(task) {
  const list = readAll();
  list.push({ ...task, recordedAt: new Date().toISOString() });
  writeAll(list);
}

function remove(taskId) {
  const list = readAll().filter((t) => t.id !== taskId);
  writeAll(list);
}

function listByModality(modality) {
  return readAll().filter((t) => !modality || t.modality === modality);
}

module.exports = { add, remove, readAll, listByModality, statePath };
