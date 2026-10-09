#!/usr/bin/env node
const { spawn } = require('child_process');

// Collect passed arguments
const rawArgs = process.argv.slice(2);

// Map custom/shorthand tunnel arguments to Expo CLI's --tunnel
const mappedArgs = rawArgs.map((arg) => {
  if (arg === '--start-tunnel') return '--tunnel';
  return arg;
});

// Spawn expo start with forwarded arguments
const isBun = process.env.npm_execpath && process.env.npm_execpath.includes('bun');
const bin = isBun ? 'bunx' : 'npx';
const child = spawn(bin, ['expo', 'start', ...mappedArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
  },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('Failed to start Expo:', err);
  process.exit(1);
});
