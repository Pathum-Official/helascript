import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { run } from '../src/index.js';
import { HelaError } from '../src/diagnostics/error.js';

describe('HelaScript Diagnostics Tests', () => {
  it('formats friendly spoken Sinhala error messages with pointers', async () => {
    const code = `
      දාන්න a = 10;
      දාන්න b = c + 5;
    `;
    try {
      await run(code, { printErrors: false });
      assert.fail('Expected error but succeeded');
    } catch (err: any) {
      assert.ok(err instanceof HelaError);
      const formatted = err.format();
      assert.ok(formatted.includes('[HelaScript දෝෂයකි]'));
      assert.ok(formatted.includes('පේළිය: 3'));
      assert.ok(formatted.includes('^'));
      assert.ok(formatted.includes("'c' නමින් විචල්‍යයක්"));
    }
  });

  it('reports unclosed string errors with helpful Sinhala hint', async () => {
    const code = `දාන්න නම = "අසම්පූර්ණ;`;
    try {
      await run(code, { printErrors: false });
      assert.fail('Expected error but succeeded');
    } catch (err: any) {
      assert.ok(err instanceof HelaError);
      const formatted = err.format();
      assert.ok(formatted.includes('අකුරු පෙළ'));
      assert.ok(formatted.includes('උපදෙස:'));
    }
  });

  it('reports division by zero in spoken Sinhala', async () => {
    const code = `
      දාන්න ප්‍රතිඵලය = 100 / 0;
    `;
    try {
      await run(code, { printErrors: false });
      assert.fail('Expected error but succeeded');
    } catch (err: any) {
      assert.ok(err instanceof HelaError);
      assert.ok(err.message.includes('බිංදුවෙන් (0) බෙදිය නොහැක'));
    }
  });
});
