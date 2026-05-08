'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const DEFAULT_BASE_URL = 'https://api.xrtoken.ai';

// Resolve XRToken credentials with 4-layer fallback:
//   L1: explicit CLI args (apiKey / baseUrl)
//   L2: ~/.claude/settings.json (env section)
//   L3: ~/.openclaw/openclaw.json (providers.xrtoken.apiKey)
//   L4: ~/.hermes/.env (XRTOKEN_API_KEY=...)
//   L5: process.env.XRTOKEN_API_KEY / XRTOKEN_BASE_URL
//
// Returns { apiKey, baseUrl, source }. Throws when no API key found.
function resolveCredentials({ apiKey, baseUrl } = {}) {
  let resolvedKey = apiKey || null;
  let resolvedBase = baseUrl || null;
  let source = apiKey ? 'cli' : null;

  const layers = [
    { name: 'claude-code', read: readClaudeSettings },
    { name: 'openclaw',    read: readOpenclawConfig },
    { name: 'hermes-env',  read: readHermesEnv },
    { name: 'process-env', read: readProcessEnv },
  ];

  for (const layer of layers) {
    if (resolvedKey && resolvedBase) break;
    const found = safe(layer.read);
    if (!found) continue;
    if (!resolvedKey && found.apiKey) {
      resolvedKey = found.apiKey;
      source = layer.name;
    }
    if (!resolvedBase && found.baseUrl) {
      resolvedBase = found.baseUrl;
    }
  }

  if (!resolvedKey) {
    throw new Error(
      'XRTOKEN_API_KEY not found. Set via --api-key, ~/.hermes/.env, ' +
      '~/.openclaw/openclaw.json, ~/.claude/settings.json env, or process env.'
    );
  }

  return {
    apiKey: resolvedKey,
    baseUrl: resolvedBase || DEFAULT_BASE_URL,
    source: source || 'default',
  };
}

function safe(fn) {
  try { return fn(); } catch { return null; }
}

function readClaudeSettings() {
  const file = path.join(os.homedir(), '.claude', 'settings.json');
  if (!fs.existsSync(file)) return null;
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  const env = (obj && obj.env) || {};
  const apiKey = env.XRTOKEN_API_KEY || null;
  const baseUrl = env.XRTOKEN_BASE_URL || null;
  return apiKey || baseUrl ? { apiKey, baseUrl } : null;
}

function readOpenclawConfig() {
  const file = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  if (!fs.existsSync(file)) return null;
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  const providers = obj && obj.models && obj.models.providers;
  if (!providers) return null;
  // Look for entries whose name/baseURL matches xrtoken
  for (const [name, p] of Object.entries(providers)) {
    if (!p) continue;
    const matches = /xrtoken/i.test(name)
      || (p.baseURL && /xrtoken\.(ai|net)/i.test(p.baseURL))
      || (p.baseUrl && /xrtoken\.(ai|net)/i.test(p.baseUrl));
    if (matches) {
      return {
        apiKey: p.apiKey || p.api_key || null,
        baseUrl: p.baseURL || p.baseUrl || null,
      };
    }
  }
  return null;
}

function readHermesEnv() {
  const file = path.join(os.homedir(), '.hermes', '.env');
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  const env = parseDotenv(text);
  const apiKey = env.XRTOKEN_API_KEY || null;
  const baseUrl = env.XRTOKEN_BASE_URL || null;
  return apiKey || baseUrl ? { apiKey, baseUrl } : null;
}

function readProcessEnv() {
  const apiKey = process.env.XRTOKEN_API_KEY || null;
  const baseUrl = process.env.XRTOKEN_BASE_URL || null;
  return apiKey || baseUrl ? { apiKey, baseUrl } : null;
}

function parseDotenv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    let k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if (k.startsWith('export ')) k = k.slice(7).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

module.exports = { resolveCredentials, DEFAULT_BASE_URL };
