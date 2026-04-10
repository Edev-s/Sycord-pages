#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Installing dependencies...\n');

// Install dependencies
const install = spawn('npm', ['install'], {
  cwd: __dirname,
  stdio: 'inherit',
});

install.on('close', (code) => {
  if (code !== 0) {
    console.error('Failed to install dependencies');
    process.exit(1);
  }

  console.log('\n\nRunning AI Gateway test...\n');

  // Run the test
  const test = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: __dirname,
    stdio: 'inherit',
  });

  test.on('close', (code) => {
    if (code !== 0) {
      console.error('Test failed');
      process.exit(1);
    }
    console.log('\nTest completed successfully!');
  });
});
