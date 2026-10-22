/**
 * HelaScript Package Manifest Management (hela.json)
 */

import * as fs from 'fs';
import * as path from 'path';

export interface HelaManifest {
  name: string;
  version: string;
  description?: string;
  main?: string;
  author?: string;
  license?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export const MANIFEST_FILENAME = 'hela.json';

export function getManifestPath(cwd: string = process.cwd()): string {
  return path.resolve(cwd, MANIFEST_FILENAME);
}

export function manifestExists(cwd: string = process.cwd()): boolean {
  return fs.existsSync(getManifestPath(cwd));
}

export function readManifest(cwd: string = process.cwd()): HelaManifest {
  const filePath = getManifestPath(cwd);
  if (!fs.existsSync(filePath)) {
    throw new Error(`'${MANIFEST_FILENAME}' ගොනුව සොයාගත නොහැකි විය. පළමුව 'hela-pkg init' ධාවනය කරන්න.`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export function writeManifest(manifest: HelaManifest, cwd: string = process.cwd()): void {
  const filePath = getManifestPath(cwd);
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}

export function initManifest(
  name?: string,
  cwd: string = process.cwd()
): HelaManifest {
  const folderName = path.basename(path.resolve(cwd));
  const pkgName = (name || folderName).toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  const manifest: HelaManifest = {
    name: pkgName,
    version: '1.0.0',
    description: 'A modern HelaScript project',
    main: 'index.hela',
    scripts: {
      start: 'hela run index.hela',
      test: 'hela run test.hela'
    },
    dependencies: {},
  };

  writeManifest(manifest, cwd);
  return manifest;
}
