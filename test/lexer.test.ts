import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { Lexer } from '../src/lexer/lexer.js';
import { TokenType } from '../src/lexer/token.js';

describe('HelaScript Lexer Tests', () => {
  it('tokenizes Sinhala variable keywords and identifiers', () => {
    const code = `
      දාන්න නම = "පැතුම්";
      වෙනස්නොවන වයස = 21;
    `;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.DAANNA);
    assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[1].value, 'නම');
    assert.strictEqual(tokens[2].type, TokenType.ASSIGN);
    assert.strictEqual(tokens[3].type, TokenType.STRING);
    assert.strictEqual(tokens[3].literal, 'පැතුම්');
    assert.strictEqual(tokens[4].type, TokenType.SEMICOLON);

    assert.strictEqual(tokens[5].type, TokenType.VENAS_NOVANA);
    assert.strictEqual(tokens[6].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[6].value, 'වයස');
    assert.strictEqual(tokens[7].type, TokenType.ASSIGN);
    assert.strictEqual(tokens[8].type, TokenType.NUMBER);
    assert.strictEqual(tokens[8].literal, 21);
  });

  it('handles Sinhala Unicode with ZWJ and complex ligatures', () => {
    const code = `දාන්න ප්‍රතිඵලය_ක්‍රියාව = 100;`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.DAANNA);
    assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[1].value, 'ප්‍රතිඵලය_ක්‍රියාව');
    assert.strictEqual(tokens[2].type, TokenType.ASSIGN);
    assert.strictEqual(tokens[3].literal, 100);
  });

  it('tokenizes control flow and loops', () => {
    const code = `
      ඉදින් (වයස >= 18) {
          ලියන්න("හරි");
      } නැත්තම් {
          ලියන්න("මදි");
      }
      කියනකල් (i < 5) { }
      හැම (දාන්න x ගෙන් arr) { }
    `;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    const types = tokens.map(t => t.type);
    assert.ok(types.includes(TokenType.IDIN));
    assert.ok(types.includes(TokenType.GREATER_EQUAL));
    assert.ok(types.includes(TokenType.NATTAM));
    assert.ok(types.includes(TokenType.KIYANAKAL));
    assert.ok(types.includes(TokenType.HAMA));
    assert.ok(types.includes(TokenType.GEN));
  });

  it('tokenizes async function keywords', () => {
    const code = `
      වැඩේ එකතු_කරන්න(a, b) {
          යවන්න a + b;
      }
      වැඩේ නොපෙනෙන දත්ත_ගන්න() {
          දාන්න x = ඉන්න ලබාගන්න("url");
      }
    `;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    const types = tokens.map(t => t.type);
    assert.ok(types.includes(TokenType.WADE));
    assert.ok(types.includes(TokenType.YAVANNA));
    assert.ok(types.includes(TokenType.NOPENENA));
    assert.ok(types.includes(TokenType.INNA));
  });

  it('tokenizes imports with ගෙන්නන්න and ගෙන්', () => {
    const code = `ගෙන්නන්න fs "fs" ගෙන්;`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.GENNANNNA);
    assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[1].value, 'fs');
    assert.strictEqual(tokens[2].type, TokenType.STRING);
    assert.strictEqual(tokens[2].literal, 'fs');
    assert.strictEqual(tokens[3].type, TokenType.GEN);
  });

  it('tokenizes booleans and null', () => {
    const code = `දාන්න a = ඇත්ත; දාන්න b = බොරු; දාන්න c = හිස්;`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[3].type, TokenType.ATTA);
    assert.strictEqual(tokens[3].literal, true);
    assert.strictEqual(tokens[8].type, TokenType.BORU);
    assert.strictEqual(tokens[8].literal, false);
    assert.strictEqual(tokens[13].type, TokenType.HIS);
    assert.strictEqual(tokens[13].literal, null);
  });
});
