#!/usr/bin/env node
'use strict';

const { parseArgs } = require('./lib/args');
const log = require('./lib/log');

const COMMANDS = {
  'video': {
    'create': () => require('./commands/video-create'),
    'get': () => require('./commands/video-get'),
    'list': () => require('./commands/video-list'),
    'delete': () => require('./commands/video-delete'),
    'check-pending': () => require('./commands/video-check-pending'),
  },
  'image': {
    'create': () => require('./commands/image-create'),
    'edit': () => require('./commands/image-edit'),
    'async-create': () => require('./commands/image-async-create'),
    'check-pending': () => require('./commands/image-check-pending'),
  },
  'models': {
    'list': () => require('./commands/models-list'),
  },
  'asset': {
    'list': () => require('./commands/asset-list'),
    'create': () => require('./commands/asset-create'),
  },
};

function printHelp() {
  console.log(`xrtoken — XRToken AI image & video generation wrapper

Usage:
  xrtoken <namespace> <command> [options]

Namespaces:
  video           Video generation (Seedance)
    create        Submit video task (async)
    get           Query single task
    list          List recent tasks
    delete        Cancel/delete task
    check-pending Poll all pending and download completed

  image           Image generation (Seedream / etc.)
    create        Sync image generation
    edit          Image edit / img2img
    async-create  Async image task (Pro models)
    check-pending Poll all pending image tasks

  models          Model registry
    list          List available models (--type image|video|text|audio)

  asset           Asset library
    list          List assets in a group
    create        Register a canonical asset

Common options:
  --api-key <key>           Override API key (else: settings → ~/.openclaw → ~/.hermes/.env → env)
  --base-url <url>          Override XRTOKEN_BASE_URL
  --json                    Print raw JSON response
  --help, -h                Show this help

Run \`xrtoken <namespace> <command> --help\` for command-specific options.
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    printHelp();
    return;
  }

  const [ns, cmd, ...rest] = argv;
  if (!COMMANDS[ns]) {
    log.error(`Unknown namespace: ${ns}`);
    printHelp();
    process.exit(2);
  }
  if (!cmd || !COMMANDS[ns][cmd]) {
    log.error(`Unknown command: ${ns} ${cmd || '(none)'}`);
    printHelp();
    process.exit(2);
  }

  const opts = parseArgs(rest);
  if (opts.notify !== undefined) {
    require('./lib/notify').setEnabled(Boolean(opts.notify));
  }
  const handler = COMMANDS[ns][cmd]();
  try {
    await handler(opts);
  } catch (err) {
    log.error(err.message || String(err));
    if (process.env.XRTOKEN_DEBUG) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
