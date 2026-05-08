'use strict';

const https = require('node:https');
const http = require('node:http');
const { URL } = require('node:url');

class XRTokenAPI {
  constructor({ apiKey, baseUrl }) {
    if (!apiKey) throw new Error('apiKey required');
    if (!baseUrl) throw new Error('baseUrl required');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  // ---------- Models ----------
  async listModels() {
    return this._request('GET', '/v1/models', null, { auth: false });
  }

  // ---------- Images ----------
  async createImage(body) {
    return this._request('POST', '/v1/images/generations', body);
  }
  async createImageAsync(body) {
    return this._request('POST', '/v1/images/async', body);
  }
  async getImageAsync(taskId) {
    return this._request('GET', `/v1/images/async/${encodeURIComponent(taskId)}`);
  }
  async editImage(body) {
    return this._request('POST', '/v1/images/edits', body);
  }

  // ---------- Videos ----------
  async createVideo(body) {
    return this._request('POST', '/v1/videos/generations', body);
  }
  async getVideo(taskId) {
    return this._request('GET', `/v1/videos/generations/${encodeURIComponent(taskId)}`);
  }
  async listVideos(params = {}) {
    const qs = toQuery(params);
    return this._request('GET', `/v1/videos/generations${qs}`);
  }
  async deleteVideo(taskId) {
    return this._request('DELETE', `/v1/videos/generations/${encodeURIComponent(taskId)}`);
  }

  // ---------- Assets ----------
  async listAssets(params = {}) {
    const qs = toQuery(params);
    return this._request('GET', `/v1/assets${qs}`);
  }
  async createAsset(body) {
    return this._request('POST', '/v1/assets', body);
  }

  // ---------- internals ----------
  _request(method, pathname, body, { auth = true } = {}) {
    const url = new URL(this.baseUrl + pathname);
    const headers = { 'Accept': 'application/json' };
    if (auth) headers['Authorization'] = `Bearer ${this.apiKey}`;

    let payload = null;
    if (body !== null && body !== undefined) {
      payload = Buffer.from(JSON.stringify(body), 'utf8');
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = payload.length;
    }

    const lib = url.protocol === 'http:' ? http : https;
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'http:' ? 80 : 443),
      path: url.pathname + url.search,
      headers,
    };

    return new Promise((resolve, reject) => {
      const req = lib.request(opts, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const text = buf.toString('utf8');
          let data;
          try { data = text ? JSON.parse(text) : {}; }
          catch { data = { raw: text }; }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            const msg = (data && (data.error?.message || data.message)) || `HTTP ${res.statusCode}`;
            const err = new Error(`${method} ${pathname} → ${res.statusCode}: ${msg}`);
            err.status = res.statusCode;
            err.response = data;
            reject(err);
          }
        });
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }
}

function toQuery(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

module.exports = { XRTokenAPI };
