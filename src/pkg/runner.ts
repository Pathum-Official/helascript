/**
 * HelaScript Package Script Runner (hela-pkg run <script>)
 */

import { execSync } from 'child_process';
import { readManifest } from './manifest.js';

export function runScript(scriptName: string, cwd: string = process.cwd()): void {
  const manifest = readManifest(cwd);
  const scripts = manifest.scripts || {};

  if (!scripts[scriptName]) {
    const available = Object.keys(scripts).join(', ') || 'කිසිත් නැත';
    throw new Error(
      `'${scriptName}' නමින් script එකක් '${manifest.name}' තුළ හමු නොවීය.\nලබාගත හැකි scripts: ${available}`
    );
  }

  const command = scripts[scriptName];
  console.log(`> ${manifest.name}@${manifest.version} ${scriptName}`);
  console.log(`> ${command}\n`);

  execSync(command, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
}
