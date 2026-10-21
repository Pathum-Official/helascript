import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';
import {
  FunctionDeclaration,
  IfStatement,
  ImportStatement,
  VarDeclaration,
  WhileStatement,
} from '../src/parser/ast.js';

describe('HelaScript Parser Tests', () => {
  it('parses variable declarations (let and const)', () => {
    const code = `
      දාන්න x = 10;
      වෙනස්නොවන y = 20;
    `;
    const tokens = new Lexer(code).tokenize();
    const program = new Parser(tokens).parse();

    assert.strictEqual(program.statements.length, 2);
    const s1 = program.statements[0] as VarDeclaration;
    assert.strictEqual(s1.type, 'VarDeclaration');
    assert.strictEqual(s1.name, 'x');
    assert.strictEqual(s1.isConst, false);

    const s2 = program.statements[1] as VarDeclaration;
    assert.strictEqual(s2.type, 'VarDeclaration');
    assert.strictEqual(s2.name, 'y');
    assert.strictEqual(s2.isConst, true);
  });

  it('parses function declarations with parameters', () => {
    const code = `
      වැඩේ එකතු_කරන්න(a, b) {
          යවන්න a + b;
      }
    `;
    const tokens = new Lexer(code).tokenize();
    const program = new Parser(tokens).parse();

    assert.strictEqual(program.statements.length, 1);
    const fn = program.statements[0] as FunctionDeclaration;
    assert.strictEqual(fn.type, 'FunctionDeclaration');
    assert.strictEqual(fn.name, 'එකතු_කරන්න');
    assert.deepStrictEqual(fn.params, ['a', 'b']);
    assert.strictEqual(fn.isAsync, false);
    assert.strictEqual(fn.body.statements.length, 1);
  });

  it('parses async functions', () => {
    const code = `
      වැඩේ නොපෙනෙන දත්ත_ගන්න() {
          දාන්න උත්තරේ = ඉන්න ලබාගන්න("url");
          යවන්න උත්තරේ;
      }
    `;
    const tokens = new Lexer(code).tokenize();
    const program = new Parser(tokens).parse();

    const fn = program.statements[0] as FunctionDeclaration;
    assert.strictEqual(fn.isAsync, true);
    assert.strictEqual(fn.name, 'දත්ත_ගන්න');
  });

  it('parses if-else statements', () => {
    const code = `
      ඉදින් (වයස >= 18) {
          ලියන්න("හරි");
      } නැත්තම් {
          ලියන්න("මදි");
      }
    `;
    const tokens = new Lexer(code).tokenize();
    const program = new Parser(tokens).parse();

    const ifStmt = program.statements[0] as IfStatement;
    assert.strictEqual(ifStmt.type, 'IfStatement');
    assert.ok(ifStmt.alternate);
  });

  it('parses while loops', () => {
    const code = `
      කියනකල් (i < 5) {
          i = i + 1;
      }
    `;
    const tokens = new Lexer(code).tokenize();
    const program = new Parser(tokens).parse();

    const whileStmt = program.statements[0] as WhileStatement;
    assert.strictEqual(whileStmt.type, 'WhileStatement');
  });

  it('parses module imports', () => {
    const code = `ගෙන්නන්න fs "fs" ගෙන්;`;
    const tokens = new Lexer(code).tokenize();
    const program = new Parser(tokens).parse();

    const imp = program.statements[0] as ImportStatement;
    assert.strictEqual(imp.type, 'ImportStatement');
    assert.strictEqual(imp.importSpecifier, 'fs');
    assert.strictEqual(imp.source, 'fs');
  });
});
