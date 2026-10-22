#!/usr/bin/env node

/**
 * HelaScript CLI, Enhanced Interactive REPL & LSP Daemon
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';
import { runFile, Evaluator, HelaError, parse } from './index.js';
import { startLspServer } from './lsp/server.js';

const VERSION = '1.0.0';

// ANSI terminal colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[96m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
};

export async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'repl') {
    return startRepl();
  }

  const firstArg = args[0];

  if (firstArg === '--version' || firstArg === '-v') {
    console.log(`${c.bold}${c.brightCyan}HelaScript v${VERSION}${c.reset} (${c.yellow}හෙළස්ක්‍රිප්ට්${c.reset})`);
    return;
  }

  if (firstArg === '--help' || firstArg === '-h') {
    printHelp();
    return;
  }

  if (firstArg === 'lsp' || firstArg === '--lsp') {
    // Start Language Server Protocol daemon on stdio
    startLspServer();
    return;
  }

  let filePath = firstArg;
  if (firstArg === 'run') {
    if (args.length < 2) {
      console.error(`${c.red}❌ දෝෂයකි: කරුණාකර ධාවනය කිරීමට .hela ගොනුවක් ලබා දෙන්න.${c.reset}`);
      console.error(`භාවිතය: ${c.yellow}hela run <ගොනුව.hela>${c.reset}`);
      process.exit(1);
    }
    filePath = args[1];
  }

  try {
    await runFile(filePath, { printErrors: true });
  } catch (err: any) {
    if (!(err instanceof HelaError)) {
      console.error(`${c.red}❌ නොසිතූ දෝෂයක්: ${err.message || err}${c.reset}`);
    }
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
${c.bold}${c.brightCyan}🇱🇰 HelaScript (හෙළස්ක්‍රිප්ට්) v${VERSION}${c.reset}
${c.dim}ස්වභාවික සිංහල ක්‍රමලේඛන භාෂාව (Spoken Sinhala Programming Engine)${c.reset}

${c.bold}භාවිතය (Usage):${c.reset}
  ${c.yellow}hela <file.hela>${c.reset}             .hela ගොනුවක් ධාවනය කරන්න (Run a .hela file)
  ${c.yellow}hela run <file.hela>${c.reset}         .hela ගොනුවක් ධාවනය කරන්න (Explicit run command)
  ${c.yellow}hela repl${c.reset}                    සජීවී අන්තර්ක්‍රියාකාරී REPL අරඹන්න (Start enhanced REPL)
  ${c.yellow}hela lsp${c.reset}                     LSP භාෂා සේවාදායකය අරඹන්න (Start Language Server)
  ${c.yellow}hela-pkg <command>${c.reset}           HelaScript පැකේජ කළමනාකරු (Package Manager: init, install, run)
  ${c.yellow}hela --help, -h${c.reset}              සහාය තොරතුරු බලන්න (Show help)
  ${c.yellow}hela --version, -v${c.reset}           භාෂාවේ සංස්කරණය බලන්න (Show version)

${c.bold}මූලික වදන් (Core Keywords):${c.reset}
  ${c.cyan}දාන්න${c.reset} x = 10;                විචල්‍යයක් සෑදීම (let)
  ${c.cyan}වෙනස්නොවන${c.reset} y = 20;            නියතයක් සෑදීම (const)
  ${c.cyan}ඉදින්${c.reset} (x > 5) { ... }       කොන්දේසි පරීක්ෂාව (if)
  ${c.cyan}නැත්තම්${c.reset} { ... }              විකල්ප පරීක්ෂාව (else)
  ${c.cyan}කියනකල්${c.reset} (x < 10) { ... }     ලූපය (while)
  ${c.cyan}හැම${c.reset} (දාන්න x ගෙන් arr)       ලැයිස්තු ලූපය (for-in / each)
  ${c.cyan}වැඩේ${c.reset} එකතුව(a, b) { ... }    ක්‍රියාව / ශ්‍රිතය (function)
  ${c.cyan}යවන්න${c.reset} අගය;                   ප්‍රතිඵලය ආපසු යැවීම (return)
  ${c.cyan}උත්සාහ${c.reset} { ... } ${c.cyan}අල්ලන්න${c.reset}       දෝෂ කළමනාකරණය (try-catch)
  ${c.cyan}විසිකරන්න${c.reset} "දෝෂය";            දෝෂයක් විසිකිරීම (throw)
  ${c.cyan}ඉන්න${c.reset} api.ලබාගන්න(...)        පොරොත්තු වීම (await)
  ${c.cyan}නොපෙනෙන වැඩේ${c.reset} ...             අසමමුහුර්ත ශ්‍රිත (async function)
  ${c.cyan}සමාන්තර${c.reset}([...])                සමාන්තර ධාවනය (Promise.all)
  ${c.cyan}ලියන්න${c.reset}(...)                  තිරයේ මුද්‍රණය (print / console.log)
  ${c.cyan}අරගන්න${c.reset}(...)                  පරිශීලකයාගෙන් ආදාන ගැනීම (input prompt)
`);
}

/**
 * Format evaluation results with ANSI terminal syntax colors
 */
export function colorizeValue(val: any): string {
  if (val === null || val === undefined) {
    return `${c.dim}හිස් (null)${c.reset}`;
  }
  if (typeof val === 'boolean') {
    return `${c.magenta}${val ? 'ඇත්ත (true)' : 'බොරු (false)'}${c.reset}`;
  }
  if (typeof val === 'number') {
    return `${c.yellow}${val}${c.reset}`;
  }
  if (typeof val === 'string') {
    return `${c.green}'${val}'${c.reset}`;
  }
  if (typeof val === 'function') {
    return `${c.cyan}[ක්‍රියාව / Function ${val.name || 'Anonymous'}]${c.reset}`;
  }
  if (Array.isArray(val)) {
    const items = val.map((item) => colorizeValue(item)).join(', ');
    return `[ ${items} ]`;
  }
  if (typeof val === 'object') {
    if (val.name && val.params) {
      return `${c.cyan}[වැඩේ ${val.name || 'නිර්නාමික'}]${c.reset}`;
    }
    try {
      const keys = Object.keys(val);
      if (keys.length === 0) return '{}';
      const pairs = keys.map((k) => `  ${c.cyan}${k}${c.reset}: ${colorizeValue(val[k])}`).join(',\n');
      return `{\n${pairs}\n}`;
    } catch {
      return String(val);
    }
  }
  return String(val);
}

/**
 * Counts unclosed delimiters: {, (, [
 */
function countOpenDelimiters(code: string): number {
  let count = 0;
  let inString = false;
  let quoteChar = '';

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const prev = i > 0 ? code[i - 1] : '';

    if ((ch === '"' || ch === "'") && prev !== '\\') {
      if (!inString) {
        inString = true;
        quoteChar = ch;
      } else if (quoteChar === ch) {
        inString = false;
      }
      continue;
    }

    if (inString) continue;

    if (ch === '{' || ch === '(' || ch === '[') {
      count++;
    } else if (ch === '}' || ch === ')' || ch === ']') {
      count--;
    }
  }

  return count;
}

/**
 * Start Enhanced HelaScript Terminal REPL
 */
async function startRepl() {
  console.log(`
${c.cyan}╔══════════════════════════════════════════════════════════════╗
║  ${c.bold}🇱🇰 HelaScript (හෙළස්ක්‍රිප්ට්) v${VERSION}${c.reset}${c.cyan}                          ║
║  ස්වභාවික සිංහල ක්‍රමලේඛන භාෂාව (Sinhala Programming Engine)   ║
║  පිටවීමට '.exit' හෝ Ctrl+C යොදන්න. (.help සහාය සඳහා)         ║
║  ඉතිහාසය: ~/.hela_history ස්වයංක්‍රීයව සුරැකේ.               ║
╚══════════════════════════════════════════════════════════════╝${c.reset}
`);

  const historyFilePath = path.join(os.homedir(), '.hela_history');
  let historyLines: string[] = [];

  if (fs.existsSync(historyFilePath)) {
    try {
      historyLines = fs
        .readFileSync(historyFilePath, 'utf8')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    } catch {
      // Ignore history read errors
    }
  }

  const evaluator = new Evaluator();
  const promptMain = `${c.bold}${c.brightCyan}hela>${c.reset} `;
  const promptCont = `${c.dim}...  ${c.reset} `;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: promptMain,
  });

  // Load persistent history in reverse chronological order
  if (historyLines.length > 0) {
    (rl as any).history = [...historyLines].reverse();
  }

  function appendHistory(entry: string) {
    try {
      if (entry.trim().length > 0) {
        fs.appendFileSync(historyFilePath, entry.trim() + '\n', 'utf8');
      }
    } catch {
      // Ignore history write errors
    }
  }

  let buffer = '';

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();

    if (buffer.length === 0) {
      if (trimmed === '.exit') {
        console.log(`${c.green}ස්තූතියි! HelaScript වෙතින් සමුගන්නා ලදී. 🙏${c.reset}`);
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
    }

    buffer = buffer ? `${buffer}\n${line}` : line;
    const openCount = countOpenDelimiters(buffer);

    // If there are unclosed brackets/braces/parens, continue multi-line mode
    if (openCount > 0) {
      rl.setPrompt(promptCont);
      rl.prompt();
      return;
    }

    const codeToExecute = buffer.trim();
    buffer = '';
    rl.setPrompt(promptMain);

    if (!codeToExecute) {
      rl.prompt();
      return;
    }

    appendHistory(codeToExecute);

    try {
      evaluator.setSource(codeToExecute, '<repl>');
      const program = parse(codeToExecute, '<repl>');
      const result = await evaluator.evaluateProgram(program);

      if (result !== null && result !== undefined) {
        console.log(`${c.dim}=>${c.reset} ${colorizeValue(result)}`);
      }
    } catch (err: any) {
      if (err instanceof HelaError) {
        console.error(err.format());
      } else {
        console.error(`${c.red}❌ දෝෂයකි: ${err.message || err}${c.reset}`);
      }
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log(`\n${c.green}ස්තූතියි! HelaScript වෙතින් සමුගන්නා ලදී. 🙏${c.reset}`);
    process.exit(0);
  });
}

// Auto-execute if run as main script
if (process.argv[1] && (process.argv[1].endsWith('cli.ts') || process.argv[1].endsWith('cli.js') || process.argv[1].endsWith('hela.js'))) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
