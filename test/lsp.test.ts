import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { HelaLspService } from '../src/lsp/lspService.js';
import { HelaLspServer } from '../src/lsp/server.js';
import { colorizeValue } from '../src/cli.js';

describe('HelaScript Language Server Protocol (LSP) Tests', () => {
  const service = new HelaLspService();

  describe('Diagnostics Engine', () => {
    it('returns empty diagnostics for valid HelaScript code', () => {
      const code = `
        දාන්න x = 10;
        දාන්න y = 20;
        වැඩේ එකතුව(a, b) {
          යවන්න a + b;
        }
        ලියන්න(එකතුව(x, y));
      `;
      const diagnostics = service.getDiagnostics(code, 'file:///main.hela');
      assert.strictEqual(diagnostics.length, 0);
    });

    it('returns error diagnostic for unclosed string literal', () => {
      const code = `දාන්න නම = "හෙළස්ක්‍රිප්ට්;`;
      const diagnostics = service.getDiagnostics(code, 'file:///error.hela');
      assert.strictEqual(diagnostics.length, 1);
      assert.strictEqual(diagnostics[0].range.start.line, 0);
      assert.ok(diagnostics[0].message.includes('අකුරු පෙළ') || diagnostics[0].message.includes('වසා නැත') || diagnostics[0].message.includes('string'));
    });

    it('returns error diagnostic for invalid syntax', () => {
      const code = `ඉදින් (x > 5 { ලියන්න("දෝෂය"); }`;
      const diagnostics = service.getDiagnostics(code, 'file:///syntax.hela');
      assert.strictEqual(diagnostics.length, 1);
      assert.ok(diagnostics[0].message.length > 0);
    });
  });

  describe('Autocompletion Engine', () => {
    it('provides core spoken Sinhala keywords and stdlib globals in global scope', () => {
      const code = `දාන්න අගය = 10;\n`;
      const items = service.getCompletions(code, { line: 1, character: 0 });

      const labels = items.map((i) => i.label);
      assert.ok(labels.includes('දාන්න'));
      assert.ok(labels.includes('වෙනස්නොවන'));
      assert.ok(labels.includes('වැඩේ'));
      assert.ok(labels.includes('උත්සාහ'));
      assert.ok(labels.includes('විසිකරන්න'));
      assert.ok(labels.includes('සමාන්තර'));
      assert.ok(labels.includes('ලියන්න'));
      assert.ok(labels.includes('api'));
      assert.ok(labels.includes('ගොනු'));
      assert.ok(labels.includes('කාලය'));
      assert.ok(labels.includes('ගණිතය'));
      assert.ok(labels.includes('අගය')); // declared variable in document
    });

    it('provides member completions for api module', () => {
      const code = `දාන්න පිළිතුර = api.`;
      const items = service.getCompletions(code, { line: 0, character: code.length });

      const labels = items.map((i) => i.label);
      assert.ok(labels.includes('ලබාගන්න'));
      assert.ok(labels.includes('යවන්න'));
      assert.ok(labels.includes('දමන්න'));
      assert.ok(labels.includes('මකන්න'));
    });

    it('provides member completions for ගොනු (File System) module', () => {
      const code = `ගොනු.`;
      const items = service.getCompletions(code, { line: 0, character: code.length });

      const labels = items.map((i) => i.label);
      assert.ok(labels.includes('කියවන්න'));
      assert.ok(labels.includes('ලියන්න'));
      assert.ok(labels.includes('එකතු_කරන්න'));
      assert.ok(labels.includes('තිබේද'));
      assert.ok(labels.includes('මකන්න'));
    });

    it('provides member completions for කාලය (Time) module', () => {
      const code = `කාලය.`;
      const items = service.getCompletions(code, { line: 0, character: code.length });

      const labels = items.map((i) => i.label);
      assert.ok(labels.includes('දැන්'));
      assert.ok(labels.includes('මිලිසෙකන්ඩ්'));
      assert.ok(labels.includes('නිදාගන්න'));
    });

    it('provides member completions for ගණිතය (Math) module', () => {
      const code = `ගණිතය.`;
      const items = service.getCompletions(code, { line: 0, character: code.length });

      const labels = items.map((i) => i.label);
      assert.ok(labels.includes('වර්ගමූලය'));
      assert.ok(labels.includes('සසම්භාවී'));
      assert.ok(labels.includes('අතර_සසම්භාවී'));
    });
  });

  describe('Hover Documentation Engine', () => {
    it('returns rich hover docs for language keywords', () => {
      const code = `දාන්න x = 10;`;
      const hover = service.getHover(code, { line: 0, character: 2 });

      assert.ok(hover);
      const val = typeof hover.contents === 'string' ? hover.contents : hover.contents.value;
      assert.ok(val.includes('දාන්න'));
      assert.ok(val.includes('Variable'));
    });

    it('returns rich hover docs for try-catch keywords', () => {
      const code = `උත්සාහ { } අල්ලන්න (e) { }`;
      const hover = service.getHover(code, { line: 0, character: 3 });

      assert.ok(hover);
      const val = typeof hover.contents === 'string' ? hover.contents : hover.contents.value;
      assert.ok(val.includes('උත්සාහ'));
      assert.ok(val.includes('Try-Catch'));
    });

    it('returns rich hover docs for member method call', () => {
      const code = `දාන්න දත්ත = api.ලබාගන්න("http://example.com");`;
      // Character 19 is inside `ලබාගන්න`
      const hover = service.getHover(code, { line: 0, character: 20 });

      assert.ok(hover);
      const val = typeof hover.contents === 'string' ? hover.contents : hover.contents.value;
      assert.ok(val.includes('api.ලබාගන්න'));
      assert.ok(val.includes('GET'));
    });

    it('returns null hover for unknown or empty tokens', () => {
      const code = `   `;
      const hover = service.getHover(code, { line: 0, character: 1 });
      assert.strictEqual(hover, null);
    });
  });

  describe('JSON-RPC LSP Server Stdio Protocol', () => {
    it('handles initialize request and returns server capabilities', () => {
      const responses: any[] = [];
      const server = new HelaLspServer(service, (output) => {
        const body = output.split('\r\n\r\n')[1];
        if (body) {
          responses.push(JSON.parse(body));
        }
      });

      const initMessage = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {},
      });
      const raw = `Content-Length: ${Buffer.byteLength(initMessage, 'utf8')}\r\n\r\n${initMessage}`;
      server.handleData(raw);

      assert.strictEqual(responses.length, 1);
      assert.strictEqual(responses[0].id, 1);
      assert.ok(responses[0].result.capabilities.hoverProvider);
      assert.strictEqual(responses[0].result.capabilities.textDocumentSync, 1);
      assert.strictEqual(responses[0].result.serverInfo.name, 'helascript-lsp');
    });

    it('handles didOpen and publishes diagnostics', () => {
      const messages: any[] = [];
      const server = new HelaLspServer(service, (output) => {
        const parts = output.split('\r\n\r\n');
        for (let i = 1; i < parts.length; i += 2) {
          if (parts[i]) {
            try {
              messages.push(JSON.parse(parts[i]));
            } catch {}
          }
        }
      });

      const docText = `දාන්න z = "අසම්පූර්ණ;`;
      const didOpen = JSON.stringify({
        jsonrpc: '2.0',
        method: 'textDocument/didOpen',
        params: {
          textDocument: {
            uri: 'file:///sample.hela',
            languageId: 'helascript',
            version: 1,
            text: docText,
          },
        },
      });
      server.handleData(`Content-Length: ${Buffer.byteLength(didOpen, 'utf8')}\r\n\r\n${didOpen}`);

      const diagMsg = messages.find((m) => m.method === 'textDocument/publishDiagnostics');
      assert.ok(diagMsg);
      assert.strictEqual(diagMsg.params.uri, 'file:///sample.hela');
      assert.strictEqual(diagMsg.params.diagnostics.length, 1);
    });

    it('handles textDocument/completion and returns items', () => {
      const responses: any[] = [];
      const server = new HelaLspServer(service, (output) => {
        const body = output.split('\r\n\r\n')[1];
        if (body) {
          responses.push(JSON.parse(body));
        }
      });

      // 1. Open document first
      const didOpen = JSON.stringify({
        jsonrpc: '2.0',
        method: 'textDocument/didOpen',
        params: {
          textDocument: {
            uri: 'file:///complete.hela',
            languageId: 'helascript',
            version: 1,
            text: 'දාන්න x = 10;\napi.',
          },
        },
      });
      server.handleData(`Content-Length: ${Buffer.byteLength(didOpen, 'utf8')}\r\n\r\n${didOpen}`);

      // 2. Request completion at line 1, col 4 (after `api.`)
      const completionReq = JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'textDocument/completion',
        params: {
          textDocument: { uri: 'file:///complete.hela' },
          position: { line: 1, character: 4 },
        },
      });
      server.handleData(`Content-Length: ${Buffer.byteLength(completionReq, 'utf8')}\r\n\r\n${completionReq}`);

      const completionResp = responses.find((r) => r.id === 2);
      assert.ok(completionResp);
      assert.ok(Array.isArray(completionResp.result.items));
      const labels = completionResp.result.items.map((i: any) => i.label);
      assert.ok(labels.includes('ලබාගන්න'));
      assert.ok(labels.includes('යවන්න'));
    });
  });

  describe('Enhanced REPL Syntax Colorization', () => {
    it('formats numbers with yellow ANSI codes', () => {
      const colored = colorizeValue(42);
      assert.ok(colored.includes('42'));
      assert.ok(colored.includes('\x1b[33m'));
    });

    it('formats strings with green ANSI codes', () => {
      const colored = colorizeValue('හෙළ');
      assert.ok(colored.includes('හෙළ'));
      assert.ok(colored.includes('\x1b[32m'));
    });

    it('formats booleans with magenta Sinhala labels', () => {
      const coloredTrue = colorizeValue(true);
      assert.ok(coloredTrue.includes('ඇත්ත (true)'));
      assert.ok(coloredTrue.includes('\x1b[35m'));

      const coloredFalse = colorizeValue(false);
      assert.ok(coloredFalse.includes('බොරු (false)'));
    });

    it('formats null with dim Sinhala label', () => {
      const colored = colorizeValue(null);
      assert.ok(colored.includes('හිස් (null)'));
      assert.ok(colored.includes('\x1b[2m'));
    });
  });
});
