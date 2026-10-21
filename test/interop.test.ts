import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { run } from '../src/index.js';

describe('HelaScript Node.js Interoperability Tests', () => {
  it('imports Node.js path module and calls its methods', async () => {
    const code = `
      ගෙන්නන්න path "path" ගෙන්;
      දාන්න සම්පූර්ණ = path.join("dir", "file.txt");
      යවන්න සම්පූර්ණ;
    `;
    const result = await run(code);
    assert.ok(result.includes('file.txt'));
  });

  it('imports Node.js fs module and checks existing files', async () => {
    const code = `
      ගෙන්නන්න fs "fs" ගෙන්;
      දාන්න පවතීද = fs.existsSync("package.json");
      යවන්න පවතීද;
    `;
    const result = await run(code);
    assert.strictEqual(result, true);
  });

  it('supports named imports from Node.js modules', async () => {
    const code = `
      ගෙන්නන්න { existsSync } "fs" ගෙන්;
      දාන්න පවතීද = existsSync("package.json");
      යවන්න පවතීද;
    `;
    const result = await run(code);
    assert.strictEqual(result, true);
  });
});
