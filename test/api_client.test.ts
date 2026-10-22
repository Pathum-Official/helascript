import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import * as http from 'http';
import { run } from '../src/index.js';

describe('HelaScript REST API Client Tests', () => {
  let server: http.Server;
  let port: number;

  before(async () => {
    server = http.createServer((req, res) => {
      if (req.method === 'GET' && req.url === '/data') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ message: 'සාර්ථකයි', code: 200 }));
      } else if (req.method === 'POST' && req.url === '/create') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          const parsed = JSON.parse(body || '{}');
          res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ id: 999, ...parsed }));
        });
      } else if (req.url === '/404') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Plain text response');
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        port = addr.port;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('performs GET request via api.ලබාගන්න and parses JSON', async () => {
    const code = `
      ගෙන්නන්න api "http" ගෙන්;
      දාන්න ප්‍රතිඵලය = api.ලබාගන්න("http://127.0.0.1:${port}/data");
      යවන්න [ප්‍රතිඵලය.message, ප්‍රතිඵලය.code];
    `;
    const result = await run(code);
    assert.deepStrictEqual(result, ['සාර්ථකයි', 200]);
  });

  it('performs POST request via api.යවන්න with payload', async () => {
    const code = `
      ගෙන්නන්න api "http" ගෙන්;
      දාන්න payload = { title: "HelaScript API Test", author: "Pathum" };
      දාන්න ප්‍රතිචාරය = api.යවන්න("http://127.0.0.1:${port}/create", payload);
      යවන්න [ප්‍රතිචාරය.id, ප්‍රතිචාරය.title, ප්‍රතිචාරය.author];
    `;
    const result = await run(code);
    assert.deepStrictEqual(result, [999, 'HelaScript API Test', 'Pathum']);
  });

  it('supports importing api from "api" module alias', async () => {
    const code = `
      ගෙන්නන්න api "api" ගෙන්;
      දාන්න දත්ත = api.get("http://127.0.0.1:${port}/data");
      යවන්න දත්ත.code;
    `;
    const result = await run(code);
    assert.strictEqual(result, 200);
  });

  it('supports global api built-in without explicit import', async () => {
    const code = `
      දාන්න දත්ත = api.ලබාගන්න("http://127.0.0.1:${port}/data");
      යවන්න දත්ත.message;
    `;
    const result = await run(code);
    assert.strictEqual(result, 'සාර්ථකයි');
  });

  it('throws friendly error on 404 responses', async () => {
    const code = `
      ගෙන්නන්න api "http" ගෙන්;
      api.ලබාගන්න("http://127.0.0.1:${port}/404");
    `;
    await assert.rejects(async () => {
      await run(code);
    }, (err: any) => {
      return err.message.includes('API ඉල්ලීම අසාර්ථක විය') && err.message.includes('404');
    });
  });
});
