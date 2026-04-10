#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  console.log('Installing dependencies...\n');
  execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
  
  console.log('\n\nRunning AI Gateway test...\n');
  execSync('npx tsx src/index.ts', { cwd: __dirname, stdio: 'inherit' });
} catch (error) {
  console.error('Error running test:', error);
  process.exit(1);
}
