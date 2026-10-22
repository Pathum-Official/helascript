import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';
import { initManifest, readManifest, writeManifest } from '../src/pkg/manifest.js';
import { installPackage } from '../src/pkg/installer.js';
import { run } from '../src/index.js';

describe('HelaScript Package Manager (hela-pkg) Tests', () => {
  const sandboxDir = path.resolve(process.cwd(), 'test_temp_pkg_sandbox');
  const libDir = path.resolve(sandboxDir, 'my_math_lib');

  before(() => {
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
    fs.mkdirSync(sandboxDir, { recursive: true });
    fs.mkdirSync(libDir, { recursive: true });

    // Create a mock library package
    const libManifest = {
      name: 'my-math-lib',
      version: '1.0.0',
      main: 'math.hela',
    };
    fs.writeFileSync(path.join(libDir, 'hela.json'), JSON.stringify(libManifest));
    fs.writeFileSync(
      path.join(libDir, 'math.hela'),
      `
      වැඩේ ගුණ_කරන්න(a, b) {
        යවන්න a * b;
      }
      `
    );
  });

  after(() => {
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  });

  it('initializes a valid hela.json manifest via initManifest', () => {
    const manifest = initManifest('test-project', sandboxDir);
    assert.strictEqual(manifest.name, 'test-project');
    assert.strictEqual(manifest.version, '1.0.0');
    assert.strictEqual(manifest.main, 'index.hela');

    const readBack = readManifest(sandboxDir);
    assert.strictEqual(readBack.name, 'test-project');
  });

  it('installs a local package into hela_modules and records dependency', async () => {
    const result = await installPackage(libDir, sandboxDir, true);
    assert.strictEqual(result.packageName, 'my-math-lib');
    assert.ok(fs.existsSync(path.join(sandboxDir, 'hela_modules', 'my-math-lib', 'math.hela')));

    const manifest = readManifest(sandboxDir);
    assert.ok(manifest.dependencies);
    assert.ok(manifest.dependencies['my-math-lib']);
  });

  it('imports and executes an installed package from hela_modules', async () => {
    const code = `
      ගෙන්නන්න math "my-math-lib" ගෙන්;
      දාන්න උත්තරය = math.ගුණ_කරන්න(6, 7);
      යවන්න උත්තරය;
    `;
    const result = await run(code, { basePath: sandboxDir });
    assert.strictEqual(result, 42);
  });
});
