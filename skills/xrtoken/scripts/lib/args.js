'use strict';

// Minimal CLI parser. Supports:
//   --flag                   → true
//   --no-flag                → false
//   --key value              → string
//   --key=value              → string
//   --key v1 --key v2        → ['v1','v2'] (multi-occurrence stored as array)
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      if (!out._) out._ = [];
      out._.push(a);
      continue;
    }
    let key = a.slice(2);
    let val;
    const eq = key.indexOf('=');
    if (eq !== -1) {
      val = key.slice(eq + 1);
      key = key.slice(0, eq);
    } else {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        if (key.startsWith('no-')) {
          key = key.slice(3);
          val = false;
        } else {
          val = true;
        }
      } else {
        val = next;
        i++;
      }
    }
    const camel = toCamel(key);
    if (camel in out) {
      const cur = out[camel];
      out[camel] = Array.isArray(cur) ? [...cur, val] : [cur, val];
    } else {
      out[camel] = val;
    }
  }
  return out;
}

function toCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function asBool(v, defaultVal = false) {
  if (v === undefined || v === null) return defaultVal;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(s)) return true;
  if (['false', '0', 'no', 'n'].includes(s)) return false;
  return defaultVal;
}

function asInt(v, defaultVal) {
  if (v === undefined || v === null || v === '') return defaultVal;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : defaultVal;
}

function asArray(v) {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

module.exports = { parseArgs, asBool, asInt, asArray };
