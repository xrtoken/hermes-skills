'use strict';

const { resolveCredentials } = require('./api-key');
const { XRTokenAPI } = require('./api');

// Build an authenticated API client from CLI options.
function clientFromOpts(opts) {
  const { apiKey, baseUrl, source } = resolveCredentials({
    apiKey: opts.apiKey,
    baseUrl: opts.baseUrl,
  });
  if (process.env.XRTOKEN_DEBUG) {
    process.stderr.write(`[debug] credentials source=${source} baseUrl=${baseUrl}\n`);
  }
  return new XRTokenAPI({ apiKey, baseUrl });
}

module.exports = { clientFromOpts };
