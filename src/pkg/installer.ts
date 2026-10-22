/**
 * HelaScript Package Installer
 * Installs libraries and dependencies into 'hela_modules/'
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { readManifest, writeManifest, manifestExists } from './manifest.js';

export const MODULES_DIR = 'hela_modules';

export function getModulesDir(cwd: string = process.cwd()): string {
  return path.resolve(cwd, MODULES_DIR);
}

export interface InstallResult {
  packageName: string;
  versionOrSource: string;
  installPath: string;
}

export function copyDirectoryRecursive(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip node_modules and .git
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === MODULES_DIR) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Install a package from local path or git URL
 */
export async function installPackage(
  source: string,
  cwd: string = process.cwd(),
  saveToManifest: boolean = true
): Promise<InstallResult> {
  const modulesDir = getModulesDir(cwd);
  if (!fs.existsSync(modulesDir)) {
    fs.mkdirSync(modulesDir, { recursive: true });
  }

  let packageName: string;
  let targetPath: string;

  // 1. Check if source is a local path
  const resolvedLocal = path.resolve(cwd, source);
  if (fs.existsSync(resolvedLocal)) {
    // Read package name from its manifest if present, else folder basename
    const localManifest = path.join(resolvedLocal, 'hela.json');
    if (fs.existsSync(localManifest)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(localManifest, 'utf-8'));
        packageName = parsed.name;
      } catch {
        packageName = path.basename(resolvedLocal);
      }
    } else {
      packageName = path.basename(resolvedLocal);
    }

    targetPath = path.join(modulesDir, packageName);
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
    copyDirectoryRecursive(resolvedLocal, targetPath);
  } else if (source.startsWith('http://') || source.startsWith('https://') || source.startsWith('git@') || source.includes('/')) {
    // 2. Git URL or GitHub shorthand (e.g. owner/repo)
    let gitUrl = source;
    let branch: string | undefined;

    if (source.includes('#')) {
      const parts = source.split('#');
      gitUrl = parts[0];
      branch = parts[1];
    }

    if (!gitUrl.startsWith('http') && !gitUrl.startsWith('git@') && gitUrl.split('/').length === 2) {
      gitUrl = `https://github.com/${gitUrl}.git`;
    }

    const repoName = gitUrl.replace(/\.git$/, '').split('/').pop() || 'hela-pkg';
    packageName = repoName.toLowerCase();
    targetPath = path.join(modulesDir, packageName);

    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }

    const branchFlag = branch ? `--branch ${branch}` : '';
    execSync(`git clone --depth 1 ${branchFlag} "${gitUrl}" "${targetPath}"`, {
      stdio: 'pipe',
      timeout: 30000,
    });
  } else {
    throw new Error(`හඳුනාගත නොහැකි පැකේජ මූලාශ්‍රයකි: '${source}'. කරුණාකර local path එකක් හෝ GitHub repository එකක් ලබා දෙන්න.`);
  }

  // Update hela.json if manifest exists
  if (saveToManifest && manifestExists(cwd)) {
    const manifest = readManifest(cwd);
    manifest.dependencies = manifest.dependencies || {};
    manifest.dependencies[packageName] = source;
    writeManifest(manifest, cwd);
  }

  return {
    packageName,
    versionOrSource: source,
    installPath: targetPath,
  };
}

/**
 * Install all dependencies declared in hela.json
 */
export async function installAll(cwd: string = process.cwd()): Promise<InstallResult[]> {
  const manifest = readManifest(cwd);
  const results: InstallResult[] = [];
  if (!manifest.dependencies || Object.keys(manifest.dependencies).length === 0) {
    return results;
  }

  for (const [name, source] of Object.entries(manifest.dependencies)) {
    const res = await installPackage(source, cwd, false);
    results.push(res);
  }
  return results;
}
