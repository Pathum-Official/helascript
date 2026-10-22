/**
 * Build browser-compatible HelaScript web bundle
 */

import * as esbuild from 'esbuild';
import * as path from 'path';

async function buildWeb() {
  await esbuild.build({
    entryPoints: ['src/web/helascript-web.ts'],
    bundle: true,
    format: 'iife',
    globalName: 'HelaScriptWeb',
    outfile: 'dist/helascript-web.js',
    alias: {
      'fs': path.resolve('src/web/shims/empty.ts'),
      'readline': path.resolve('src/web/shims/empty.ts'),
      'module': path.resolve('src/web/shims/empty.ts'),
      'path': path.resolve('src/web/shims/path.ts'),
    },
    minify: false,
    sourcemap: true,
  });

  console.log('✅ HelaScript browser bundle created at dist/helascript-web.js');
}

buildWeb().catch((err) => {
  console.error('Failed to build web bundle:', err);
  process.exit(1);
});
