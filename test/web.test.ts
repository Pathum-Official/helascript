import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { runWeb, tokenizeWeb, parseWeb } from '../src/web/helascript-web.js';

describe('HelaScript Web Playground Runtime Tests', () => {
  it('executes code in browser runtime and captures console output', async () => {
    const code = `
      ලියන්න("වෙබ් පරීක්ෂාව සාර්ථකයි");
      දාන්න x = 15 * 3;
      ලියන්න("x =", x);
      යවන්න x;
    `;
    const res = await runWeb(code);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.result, 45);
    assert.strictEqual(res.output.length, 2);
    assert.strictEqual(res.output[0], 'වෙබ් පරීක්ෂාව සාර්ථකයි');
    assert.strictEqual(res.output[1], 'x = 45');
    assert.ok(res.executionTimeMs >= 0);
  });

  it('tokenizes code into token stream for web explorer', () => {
    const code = 'දාන්න වයස = 21;';
    const tokens = tokenizeWeb(code);
    assert.ok(tokens.length >= 4);
    assert.strictEqual(tokens[0].value, 'දාන්න');
    assert.strictEqual(tokens[1].value, 'වයස');
  });

  it('parses code into AST structure for web explorer', () => {
    const code = 'වැඩේ පරීක්ෂාව() { යවන්න 100; }';
    const ast = parseWeb(code);
    assert.strictEqual(ast.type, 'Program');
    assert.strictEqual(ast.statements[0].type, 'FunctionDeclaration');
  });

  it('catches runtime errors safely and returns structured error object', async () => {
    const code = 'දාන්න z = නොපවතින_විචල්‍යය + 5;';
    const res = await runWeb(code);
    assert.strictEqual(res.success, false);
    assert.ok(res.error);
    assert.ok(res.error.includes('නොපවතින_විචල්‍යය'));
  });
});
