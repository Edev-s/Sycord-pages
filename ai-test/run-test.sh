#!/bin/bash

cd "$(dirname "$0")"

echo "Installing dependencies..."
npm install

echo ""
echo "Running AI Gateway test..."
npx tsx src/index.ts
