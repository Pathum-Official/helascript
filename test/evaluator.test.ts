import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { run } from '../src/index.js';
import { HelaError } from '../src/diagnostics/error.js';

describe('HelaScript Evaluator & Runtime Tests', () => {
  it('evaluates variables and arithmetic', async () => {
    const code = `
      දාන්න x = 10;
      දාන්න y = 20;
      යවන්න x + y * 2;
    `;
    const result = await run(code);
    assert.strictEqual(result, 50);
  });

  it('enforces const immutability with Sinhala error', async () => {
    const code = `
      වෙනස්නොවන නම = "කමල්";
      නම = "නිමල්";
    `;
    await assert.rejects(
      async () => {
        await run(code, { printErrors: false });
      },
      (err: any) => {
        assert.ok(err instanceof HelaError);
        assert.ok(err.message.includes('වෙනස්නොවන'));
        return true;
      }
    );
  });

  it('evaluates if-else branching', async () => {
    const code = `
      දාන්න වයස = 20;
      දාන්න තත්ත්වය = "කිසිවක් නැත";
      ඉදින් (වයස >= 18) {
          තත්ත්වය = "වැඩිහිටි";
      } නැත්තම් {
          තත්ත්වය = "ළමා";
      }
      යවන්න තත්ත්වය;
    `;
    const result = await run(code);
    assert.strictEqual(result, 'වැඩිහිටි');
  });

  it('evaluates while loops with accumulation', async () => {
    const code = `
      දාන්න i = 0;
      දාන්න එකතුව = 0;
      කියනකල් (i < 5) {
          එකතුව = එකතුව + i;
          i = i + 1;
      }
      යවන්න එකතුව;
    `;
    const result = await run(code);
    assert.strictEqual(result, 10);
  });

  it('evaluates for-in loops over arrays', async () => {
    const code = `
      දාන්න අංක = [10, 20, 30];
      දාන්න මුළු_එකතුව = 0;
      හැම (දාන්න අගය ගෙන් අංක) {
          මුළු_එකතුව = මුළු_එකතුව + අගය;
      }
      යවන්න මුළු_එකතුව;
    `;
    const result = await run(code);
    assert.strictEqual(result, 60);
  });

  it('evaluates functions, parameters, and return statements', async () => {
    const code = `
      වැඩේ ගුණ_කරන්න(a, b) {
          යවන්න a * b;
      }
      යවන්න ගුණ_කරන්න(6, 7);
    `;
    const result = await run(code);
    assert.strictEqual(result, 42);
  });

  it('evaluates recursion (factorial)', async () => {
    const code = `
      වැඩේ factorial(n) {
          ඉදින් (n <= 1) {
              යවන්න 1;
          }
          යවන්න n * factorial(n - 1);
      }
      යවන්න factorial(5);
    `;
    const result = await run(code);
    assert.strictEqual(result, 120);
  });

  it('evaluates async/await flow', async () => {
    const code = `
      වැඩේ නොපෙනෙන ප්‍රමාදය() {
          ඉන්න නිදන්න(50);
          යවන්න "සාර්ථකයි!";
      }
      දාන්න ප්‍රතිඵලය = ඉන්න ප්‍රමාදය();
      යවන්න ප්‍රතිඵලය;
    `;
    const result = await run(code);
    assert.strictEqual(result, 'සාර්ථකයි!');
  });

  it('evaluates standard library functions', async () => {
    const code = `
      දාන්න පදය = "හෙළස්ක්‍රිප්ට්";
      දාන්න දිග_ප්‍රමාණය = දිග(පදය);
      දාන්න වර්ගය_නම = වර්ගය(පදය);
      දාන්න අංකය = සංඛ්‍යාව("123");
      යවන්න [දිග_ප්‍රමාණය > 0, වර්ගය_නම, අංකය];
    `;
    const result = await run(code);
    assert.strictEqual(result[0], true);
    assert.strictEqual(result[1], 'අකුරු');
    assert.strictEqual(result[2], 123);
  });
});
