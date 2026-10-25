#!/usr/bin/env node
/**
 * Runs every check in this folder.
 *
 * Usage: node tests/run-all.js
 * Exit code 0 when all checks pass, 1 otherwise.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const CHECKS = ['homepage-check.js', 'policy-pages-check.js'];

let failed = 0;

for (const file of CHECKS) {
  console.log(`\n=== ${file} ===`);
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (result.status !== 0) failed++;
}

if (failed) {
  console.error(`\n${failed} check file(s) failed`);
  process.exit(1);
}

console.log('\nall check files passed');
