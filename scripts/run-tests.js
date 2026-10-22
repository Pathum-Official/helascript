#!/usr/bin/env node

/**
 * Platform-independent HelaScript Test Runner
 * Recursively discovers and executes all .test.ts files across Windows, Linux, and macOS.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const testDir = path.resolve(rootDir, 'test');

/**
 * Recursively find all test files ending with .test.ts or .test.js
 */
function findTestFiles(dir) {
  let testFiles = [];
  if (!fs.existsSync(dir)) {
    return testFiles;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      testFiles = testFiles.concat(findTestFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.js'))) {
      testFiles.push(fullPath);
    }
  }

  return testFiles;
}

async function run() {
  const testFiles = findTestFiles(testDir).sort();

  if (testFiles.length === 0) {
    console.error(`❌ No test files found in ${testDir}`);
    process.exit(1);
  }

  // Sequentially import each test file so they register on node:test runner
  for (const file of testFiles) {
    try {
      const fileUrl = pathToFileURL(file).href;
      await import(fileUrl);
    } catch (err) {
      console.error(`❌ Failed to load test file: ${file}`);
      console.error(err);
      process.exitCode = 1;
    }
  }
}

run().catch((err) => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
