#!/usr/bin/env node
'use strict';

// Walks every (namespace, command) pair, runs `--help`, and emits docs/CLI.md.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ENTRY = path.join(__dirname, 'xrtoken.js');
const OUT   = path.join(__dirname, '..', 'docs', 'CLI.md');

const COMMANDS = {
  video: ['create', 'get', 'list', 'delete', 'check-pending'],
  image: ['create', 'edit', 'async-create', 'check-pending'],
  models: ['list'],
  asset: ['list', 'create'],
};

function runHelp(args) {
  const res = spawnSync('node', [ENTRY, ...args], { encoding: 'utf8' });
  return (res.stdout || '') + (res.stderr || '');
}

function main() {
  const sections = [];
  sections.push('# XRToken Skill — CLI Reference\n');
  sections.push('Auto-generated from each command\'s `--help`. Run `node scripts/generate-docs.js` to refresh.\n');

  sections.push('## Top-level usage\n');
  sections.push('```\n' + runHelp(['--help']).trim() + '\n```\n');

  for (const [ns, cmds] of Object.entries(COMMANDS)) {
    sections.push(`## ${ns}\n`);
    for (const cmd of cmds) {
      sections.push(`### \`xrtoken ${ns} ${cmd}\`\n`);
      sections.push('```\n' + runHelp([ns, cmd, '--help']).trim() + '\n```\n');
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, sections.join('\n'));
  console.log(`Wrote ${OUT}`);
}

main();
