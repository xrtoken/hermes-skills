'use strict';

function info(msg) { console.log(msg); }
function ok(msg)   { console.log(msg); }
function warn(msg) { console.error(`[warn] ${msg}`); }
function error(msg){ console.error(`[error] ${msg}`); }
function json(obj) { console.log(JSON.stringify(obj, null, 2)); }

module.exports = { info, ok, warn, error, json };
