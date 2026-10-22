import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';
import { run } from '../src/index.js';

describe('HelaScript Native File System Tests', () => {
  const testDir = path.resolve(process.cwd(), 'test_temp_fs');
  const testFile = path.resolve(testDir, 'test.txt');

  before(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  after(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('writes and reads a file using ගොනු.ලියන්න and ගොනු.කියවන්න', async () => {
    const code = `
      ගෙන්නන්න ගොනු "fs" ගෙන්;
      ගොනු.ලියන්න("${testFile.replace(/\\/g, '/')}", "හෙළස්ක්‍රිප්ට් ගොනු පද්ධතිය");
      දාන්න අන්තර්ගතය = ගොනු.කියවන්න("${testFile.replace(/\\/g, '/')}");
      යවන්න අන්තර්ගතය;
    `;
    const result = await run(code);
    assert.strictEqual(result, 'හෙළස්ක්‍රිප්ට් ගොනු පද්ධතිය');
  });

  it('appends to an existing file using ගොනු.එකතු_කරන්න', async () => {
    const code = `
      ගෙන්නන්න ගොනු "fs" ගෙන්;
      ගොනු.එකතු_කරන්න("${testFile.replace(/\\/g, '/')}", " - අලුත් දත්ත");
      දාන්න අන්තර්ගතය = ගොනු.කියවන්න("${testFile.replace(/\\/g, '/')}");
      යවන්න අන්තර්ගතය;
    `;
    const result = await run(code);
    assert.strictEqual(result, 'හෙළස්ක්‍රිප්ට් ගොනු පද්ධතිය - අලුත් දත්ත');
  });

  it('checks file existence with ගොනු.තිබේද and retrieves stats with ගොනු.විස්තර', async () => {
    const code = `
      ගෙන්නන්න ගොනු "fs" ගෙන්;
      දාන්න පවතීද = ගොනු.තිබේද("${testFile.replace(/\\/g, '/')}");
      දාන්න තොරතුරු = ගොනු.විස්තර("${testFile.replace(/\\/g, '/')}");
      යවන්න [පවතීද, තොරතුරු.දිග > 0, තොරතුරු.ගොනුවක්ද];
    `;
    const result = await run(code);
    assert.deepStrictEqual(result, [true, true, true]);
  });

  it('deletes a file with ගොනු.මකන්න and confirms it no longer exists', async () => {
    const code = `
      ගෙන්නන්න ගොනු "fs" ගෙන්;
      ගොනු.මකන්න("${testFile.replace(/\\/g, '/')}");
      දාන්න පවතීද = ගොනු.තිබේද("${testFile.replace(/\\/g, '/')}");
      යවන්න පවතීද;
    `;
    const result = await run(code);
    assert.strictEqual(result, false);
  });

  it('supports global ගොනු built-in without explicit import', async () => {
    const filePath = path.resolve(testDir, 'global_test.txt').replace(/\\/g, '/');
    const code = `
      ගොනු.ලියන්න("${filePath}", "ගෝලීය ගොනු පාලනය");
      දාන්න අන්තර්ගතය = ගොනු.කියවන්න("${filePath}");
      ගොනු.මකන්න("${filePath}");
      යවන්න අන්තර්ගතය;
    `;
    const result = await run(code);
    assert.strictEqual(result, 'ගෝලීය ගොනු පාලනය');
  });

  it('throws friendly Sinhala error when reading non-existent file', async () => {
    const nonExistent = path.resolve(testDir, 'does_not_exist.txt').replace(/\\/g, '/');
    const code = `
      ගෙන්නන්න ගොනු "fs" ගෙන්;
      ගොනු.කියවන්න("${nonExistent}");
    `;
    await assert.rejects(async () => {
      await run(code);
    }, (err: any) => {
      return err.message.includes('ගොනුව සොයාගත නොහැකි විය');
    });
  });
});
