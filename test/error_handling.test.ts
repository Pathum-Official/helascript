import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { run } from '../src/index.js';

describe('HelaScript Spoken-Sinhala Error Handling & Concurrency Tests', () => {
  it('catches runtime division or math errors with උත්සාහ ... අල්ලන්න', async () => {
    const code = `
      දාන්න පණිවිඩය = "";
      උත්සාහ {
        දාන්න x = 10 / 0;
      } අල්ලන්න (දෝෂය) {
        පණිවිඩය = "අල්ලගත්තා: " + දෝෂය;
      }
      යවන්න පණිවිඩය;
    `;
    const result = await run(code);
    assert.ok(result.includes('අල්ලගත්තා:'));
    assert.ok(result.includes('බිංදුවෙන් (0) බෙදිය නොහැක'));
  });

  it('supports spoken idiom උත්සාහ කරන්න ... අල්ලාගන්න', async () => {
    const code = `
      දාන්න අගය = 0;
      උත්සාහ කරන්න {
        විසිකරන්න "පරීක්ෂණ දෝෂයකි";
        අගය = 100;
      } අල්ලාගන්න (e) {
        අගය = 500;
      }
      යවන්න අගය;
    `;
    const result = await run(code);
    assert.strictEqual(result, 500);
  });

  it('gracefully handles missing file errors in file operations', async () => {
    const code = `
      ගෙන්නන්න ගොනු "fs" ගෙන්;
      දාන්න තත්ත්වය = "සාර්ථකයි";
      උත්සාහ {
        ගොනු.කියවන්න("invalid_path_xyz.txt");
      } අල්ලන්න (err) {
        තත්ත්වය = "දෝෂය හසුකරගන්නා ලදී";
      }
      යවන්න තත්ත්වය;
    `;
    const result = await run(code);
    assert.strictEqual(result, 'දෝෂය හසුකරගන්නා ලදී');
  });

  it('evaluates parallel async tasks concurrently using සමාන්තර', async () => {
    const code = `
      වැඩේ නොපෙනෙන කර්තව්‍යය1() {
        ඉන්න නිදන්න(10);
        යවන්න "පළමු_ප්‍රතිඵලය";
      }

      වැඩේ නොපෙනෙන කර්තව්‍යය2() {
        ඉන්න නිදන්න(10);
        යවන්න "දෙවන_ප්‍රතිඵලය";
      }

      දාන්න ප්‍රතිඵල = ඉන්න සමාන්තර([කර්තව්‍යය1(), කර්තව්‍යය2()]);
      යවන්න ප්‍රතිඵල;
    `;
    const result = await run(code);
    assert.deepStrictEqual(result, ['පළමු_ප්‍රතිඵලය', 'දෙවන_ප්‍රතිඵලය']);
  });
});
