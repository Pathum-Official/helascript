import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { run } from '../src/index.js';

let hasSqlite = false;
try {
  const sqliteMod = await import('node:sqlite');
  hasSqlite = typeof sqliteMod.DatabaseSync === 'function';
} catch {}

describe('HelaScript Next-Level Standard Library Tests', () => {
  it('creates and queries in-memory SQLite database using Sinhala methods', async (t) => {
    if (!hasSqlite) {
      t.skip('Node.js >= 22.5.0 required for native node:sqlite');
      return;
    }

    const code = `
      ගෙන්නන්න db "sqlite" ගෙන්;
      දාන්න myDb = db.open(":memory:");

      myDb.ක්‍රියාත්මක("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);");
      myDb.ඇතුළත්("INSERT INTO users (name, age) VALUES (?, ?);", ["පැතුම්", 21]);
      myDb.ඇතුළත්("INSERT INTO users (name, age) VALUES (?, ?);", ["කසුන්", 25]);

      දාන්න ප්‍රතිඵලය = myDb.සොයන්න("SELECT * FROM users ORDER BY age ASC;");
      myDb.වසන්න();

      යවන්න ප්‍රතිඵලය;
    `;
    const result = await run(code);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].name, 'පැතුම්');
    assert.strictEqual(result[0].age, 21);
    assert.strictEqual(result[1].name, 'කසුන්');
    assert.strictEqual(result[1].age, 25);
  });

  it('supports standard query/run/exec on SQLite database', async (t) => {
    if (!hasSqlite) {
      t.skip('Node.js >= 22.5.0 required for native node:sqlite');
      return;
    }

    const code = `
      ගෙන්නන්න sqlite "sqlite" ගෙන්;
      දාන්න db = sqlite.open(":memory:");
      db.exec("CREATE TABLE items (id INTEGER, title TEXT);");
      db.run("INSERT INTO items VALUES (?, ?);", [1, "පොතක්"]);
      දාන්න rows = db.query("SELECT * FROM items WHERE id = ?;", [1]);
      db.close();
      යවන්න rows[0].title;
    `;
    const result = await run(code);
    assert.strictEqual(result, 'පොතක්');
  });

  it('evaluates enhanced කාලය (Time & Date) functions', async () => {
    const code = `
      දාන්න ts = කාලය();
      දාන්න දැන් = කාලය.දැන්();
      දාන්න වසර = කාලය.වර්ෂය();
      දාන්න මාසය = කාලය.මාසය();
      දාන්න දිනය = කාලය.දිනය();

      යවන්න [ts > 0, දිග(දැන්) > 10, වසර >= 2024, මාසය >= 1, දිනය >= 1];
    `;
    const result = await run(code);
    assert.deepStrictEqual(result, [true, true, true, true, true]);
  });

  it('evaluates enhanced ගණිතය (Math) range random and log', async () => {
    const code = `
      දාන්න rnd = ගණිතය.සසම්භාවී(50, 60);
      දාන්න l = ගණිතය.ලඝු(ගණිතය.e);
      යවන්න [rnd >= 50 සහ rnd <= 60, l == 1];
    `;
    const result = await run(code);
    assert.deepStrictEqual(result, [true, true]);
  });
});
