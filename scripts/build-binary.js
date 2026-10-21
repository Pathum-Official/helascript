#!/usr/bin/env node

/**
 * HelaScript Standalone Binary Builder
 * Compiles the CLI engine into a standalone binary using esbuild and Node.js SEA (Single Executable Application).
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = process.cwd();
const BUILD_DIR = path.join(ROOT_DIR, 'build');
const BINARIES_DIR = path.join(ROOT_DIR, 'binaries');
const BUNDLE_PATH = path.join(BUILD_DIR, 'bundle.cjs');
const SEA_CONFIG_PATH = path.join(ROOT_DIR, 'sea-config.json');
const BLOB_PATH = path.join(BUILD_DIR, 'sea-prep.blob');

console.log('🚀 Building HelaScript standalone binary...');

// 1. Ensure output directories exist
if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR, { recursive: true });
if (!fs.existsSync(BINARIES_DIR)) fs.mkdirSync(BINARIES_DIR, { recursive: true });

// 2. Bundle with esbuild
console.log('📦 Step 1: Bundling with esbuild...');
execSync(`npx esbuild src/cli.ts --bundle --platform=node --format=cjs --outfile="${BUNDLE_PATH}"`, {
  stdio: 'inherit',
});

// 3. Generate SEA preparation blob
console.log('⚙️  Step 2: Generating SEA blob...');
execSync(`node --experimental-sea-config "${SEA_CONFIG_PATH}"`, {
  stdio: 'inherit',
});

// 4. Determine output binary name for host platform
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

const binaryName = isWindows ? 'hela-win.exe' : isMac ? 'hela-macos' : 'hela-linux';
const targetPath = path.join(BINARIES_DIR, binaryName);

console.log(`🔨 Step 3: Preparing host binary for ${process.platform}...`);
fs.copyFileSync(process.execPath, targetPath);

// 5. Inject blob using postject
console.log(`💉 Step 4: Injecting blob into ${binaryName}...`);

if (isMac) {
  try {
    execSync(`codesign --remove-signature "${targetPath}"`, { stdio: 'inherit' });
  } catch (signErr) {
    console.warn('codesign remove-signature warning:', signErr.message);
  }
}

const postjectArgs = [
  `"${targetPath}"`,
  'NODE_SEA_BLOB',
  `"${BLOB_PATH}"`,
  '--sentinel-fuse',
  'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
];

if (isMac) {
  postjectArgs.push('--macho-segment-name', 'NODE_SEA');
}

execSync(`npx postject ${postjectArgs.join(' ')}`, {
  stdio: 'inherit',
});

if (isMac) {
  try {
    execSync(`codesign --sign - "${targetPath}"`, { stdio: 'inherit' });
  } catch (signErr) {
    console.warn('codesign sign warning:', signErr.message);
  }
}

// Ensure execute permissions on Unix systems
if (!isWindows) {
  fs.chmodSync(targetPath, 0o755);
}

console.log(`✅ Standalone binary created successfully at: ${targetPath}`);
