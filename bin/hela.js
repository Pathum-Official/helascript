#!/usr/bin/env node

/**
 * HelaScript CLI & Interactive REPL
 */

import * as readline from 'readline';
import { runFile, run, Evaluator, formatValue, HelaError, parse } from '../dist/index.js';

const VERSION = '1.0.0';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'repl') {
    return startRepl();
  }

  const firstArg = args[0];

  if (firstArg === '--version' || firstArg === '-v') {
    console.log(`HelaScript v${VERSION} (හෙළස්ක්‍රිප්ට්)`);
    return;
  }

  if (firstArg === '--help' || firstArg === '-h') {
    printHelp();
    return;
  }

  let filePath = firstArg;
  if (firstArg === 'run') {
    if (args.length < 2) {
      console.error('❌ දෝෂයකි: කරුණාකර ධාවනය කිරීමට .hela ගොනුවක් ලබා දෙන්න.');
      console.error('භාවිතය: hela run <ගොනුව.hela>');
      process.exit(1);
    }
    filePath = args[1];
  }

  try {
    await runFile(filePath, { printErrors: true });
  } catch (err) {
    if (!(err instanceof HelaError)) {
      console.error(`❌ නොසිතූ දෝෂයක්: ${err.message || err}`);
    }
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
🇱🇰 HelaScript (හෙළස්ක්‍රිප්ට්) v${VERSION}
ස්වභාවික සිංහල ක්‍රමලේඛන භාෂාව (Spoken Sinhala Programming Engine)

භාවිතය (Usage):
  hela <file.hela>             .hela ගොනුවක් ධාවනය කරන්න (Run a .hela file)
  hela run <file.hela>         .hela ගොනුවක් ධාවනය කරන්න (Explicit run command)
  hela repl                    සජීවී REPL කවුළුව අරඹන්න (Start interactive REPL)
  hela --help, -h              සහාය තොරතුරු බලන්න (Show help)
  hela --version, -v           භාෂාවේ සංස්කරණය බලන්න (Show version)

මූලික වදන් (Core Keywords):
  දාන්න x = 10;                විචල්‍යයක් සෑදීම (let)
  වෙනස්නොවන y = 20;            නියතයක් සෑදීම (const)
  ඉදින් (x > 5) { ... }       කොන්දේසි පරීක්ෂාව (if)
  නැත්තම් { ... }              විකල්ප පරීක්ෂාව (else)
  කියනකල් (x < 10) { ... }     ලූපය (while)
  හැම (දාන්න i = 0; ...)       ලූපය (for)
  හැම (දාන්න x ගෙන් arr)       ලැයිස්තු ලූපය (for-in / each)
  වැඩේ එකතුව(a, b) { ... }    ක්‍රියාව / ශ්‍රිතය (function)
  යවන්න අගය;                   ප්‍රතිඵලය ආපසු යැවීම (return)
  ඉන්න ලබාගන්න(...)            පොරොත්තු වීම (await)
  නොපෙනෙන වැඩේ ...             අසමමුහුර්ත ශ්‍රිත (async function)
  ගෙන්නන්න fs "fs" ගෙන්;       මොඩියුල ගෙන්වීම (import Node.js/npm module)
  ලියන්න(...)                  තිරයේ මුද්‍රණය (print / console.log)
  අරගන්න(...)                  පරිශීලකයාගෙන් ආදාන ගැනීම (input prompt)
`);
}

async function startRepl() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🇱🇰 HelaScript (හෙළස්ක්‍රිප්ට්) v${VERSION}                          ║
║  ස්වභාවික සිංහල ක්‍රමලේඛන භාෂාව (Sinhala Programming Engine)   ║
║  පිටවීමට '.exit' හෝ Ctrl+C යොදන්න. (.help සහාය සඳහා)         ║
╚══════════════════════════════════════════════════════════════╝
`);

  const evaluator = new Evaluator();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'hela> ',
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();

    if (trimmed === '.exit') {
      console.log('ස්තූතියි! HelaScript වෙතින් සමුගන්නා ලදී. 🙏');
      process.exit(0);
    }

    if (trimmed === '.help') {
      printHelp();
      rl.prompt();
      return;
    }

    if (trimmed === '.clear') {
      console.clear();
      rl.prompt();
      return;
    }

    if (!trimmed) {
      rl.prompt();
      return;
    }

    try {
      evaluator.setSource(trimmed, '<repl>');
      const program = parse(trimmed, '<repl>');
      const result = await evaluator.evaluateProgram(program);

      if (result !== null && result !== undefined) {
        console.log(`=> ${formatValue(result)}`);
      }
    } catch (err) {
      if (err instanceof HelaError) {
        console.error(err.format());
      } else {
        console.error(`❌ දෝෂයකි: ${err.message || err}`);
      }
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nස්තූතියි! HelaScript වෙතින් සමුගන්නා ලදී. 🙏');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
