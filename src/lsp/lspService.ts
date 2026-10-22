/**
 * HelaScript Language Server Service
 * Provides diagnostics, autocompletion, and hover documentation
 * in spoken Sinhala for Anti Gravity IDE and VS Code.
 */

import { Lexer } from '../lexer/lexer.js';
import { Parser } from '../parser/parser.js';
import { HelaError } from '../diagnostics/error.js';
import {
  Position,
  Diagnostic,
  DiagnosticSeverity,
  CompletionItem,
  CompletionItemKind,
  Hover,
} from './protocol.js';

export class HelaLspService {
  /**
   * Generates syntax and lexical diagnostics for a HelaScript document
   */
  public getDiagnostics(documentText: string, uri: string = '<document>'): Diagnostic[] {
    if (!documentText.trim()) {
      return [];
    }

    try {
      const tokens = new Lexer(documentText, uri).tokenize();
      const parser = new Parser(tokens, documentText, uri);
      parser.parse();
      return [];
    } catch (err: any) {
      if (err instanceof HelaError) {
        const line = Math.max(0, err.line - 1);
        const col = Math.max(0, err.column - 1);
        return [
          {
            range: {
              start: { line, character: col },
              end: { line, character: col + 4 },
            },
            severity: DiagnosticSeverity.Error,
            message: `${err.message}${err.hint ? `\n💡 ඉඟිය: ${err.hint}` : ''}`,
            source: 'helascript',
          },
        ];
      }

      return [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
          },
          severity: DiagnosticSeverity.Error,
          message: err?.message || String(err),
          source: 'helascript',
        },
      ];
    }
  }

  /**
   * Computes autocompletion items based on cursor position
   */
  public getCompletions(documentText: string, position: Position): CompletionItem[] {
    const lines = documentText.split(/\r?\n/);
    const line = lines[position.line] ?? '';
    const prefix = line.slice(0, position.character);

    // 1. Member access completion (e.g. `api.`, `ගොනු.`, `කාලය.`, `ගණිතය.`)
    const memberMatch = prefix.match(/([\u0D80-\u0DFFa-zA-Z0-9_]+)\.\s*$/);
    if (memberMatch) {
      const target = memberMatch[1];
      return this.getMemberCompletions(target);
    }

    // 2. Global scope completions: Keywords, Stdlib, and In-file Identifiers
    const completions: CompletionItem[] = [
      // Spoken Sinhala Keywords
      {
        label: 'දාන්න',
        kind: CompletionItemKind.Keyword,
        detail: 'විචල්‍යයක් සෑදීම (let declaration)',
        documentation: 'නව වෙනස් කළ හැකි විචල්‍යයක් ප්‍රකාශයට පත් කරයි.\n```hela\nදාන්න x = 10;\n```',
        insertText: 'දාන්න ',
      },
      {
        label: 'වෙනස්නොවන',
        kind: CompletionItemKind.Keyword,
        detail: 'නියතයක් සෑදීම (const declaration)',
        documentation: 'නැවත අගය වෙනස් කළ නොහැකි නියතයක් සාදයි.\n```hela\nවෙනස්නොවන PI = 3.14159;\n```',
        insertText: 'වෙනස්නොවන ',
      },
      {
        label: 'වැඩේ',
        kind: CompletionItemKind.Keyword,
        detail: 'ක්‍රියාවක් / ශ්‍රිතයක් (function declaration)',
        documentation: 'නව ශ්‍රිතයක් ප්‍රකාශයට පත් කරයි.\n```hela\nවැඩේ නම(පරාමිතිය) {\n    යවන්න පරාමිතිය;\n}\n```',
        insertText: 'වැඩේ ',
      },
      {
        label: 'නොපෙනෙන වැඩේ',
        kind: CompletionItemKind.Keyword,
        detail: 'අසමමුහුර්ත ශ්‍රිතය (async function)',
        documentation: 'පසුබිමේ ධාවනය වන අසමමුහුර්ත ශ්‍රිතයක් සාදයි.\n```hela\nනොපෙනෙන වැඩේ දත්ත_ගන්න() {\n    දාන්න x = ඉන්න api.ලබාගන්න("url");\n    යවන්න x;\n}\n```',
        insertText: 'නොපෙනෙන වැඩේ ',
      },
      {
        label: 'ඉදින්',
        kind: CompletionItemKind.Keyword,
        detail: 'කොන්දේසි පරීක්ෂාව (if statement)',
        documentation: 'කොන්දේසිය සත්‍ය නම් පමණක් කොටස ක්‍රියාත්මක කරයි.\n```hela\nඉදින් (x > 5) {\n    ලියන්න("ලොකුයි");\n}\n```',
        insertText: 'ඉදින් (',
      },
      {
        label: 'නැත්තම්',
        kind: CompletionItemKind.Keyword,
        detail: 'විකල්ප පරීක්ෂාව (else / else-if)',
        documentation: 'ඉදින් කොන්දේසිය අසත්‍ය වූ විට ක්‍රියාත්මක වේ.',
        insertText: 'නැත්තම් {\n    \n}',
      },
      {
        label: 'කියනකල්',
        kind: CompletionItemKind.Keyword,
        detail: 'ලූපය (while loop)',
        documentation: 'කොන්දේසිය සත්‍ය වන තුරු නැවත නැවත ක්‍රියාත්මක කරයි.\n```hela\nකියනකල් (x < 10) {\n    x += 1;\n}\n```',
        insertText: 'කියනකල් (',
      },
      {
        label: 'හැම',
        kind: CompletionItemKind.Keyword,
        detail: 'ලූපය (for / for-in loop)',
        documentation: 'සංඛ්‍යා පරාසයක් හෝ ලැයිස්තුවක අයිතම හරහා යයි.\n```hela\nහැම (දාන්න අයිතමය ගෙන් ලැයිස්තුව) {\n    ලියන්න(අයිතමය);\n}\n```',
        insertText: 'හැම (',
      },
      {
        label: 'යවන්න',
        kind: CompletionItemKind.Keyword,
        detail: 'ප්‍රතිඵලය ආපසු යැවීම (return statement)',
        documentation: 'ශ්‍රිතයකින් ප්‍රතිඵලයක් ආපසු යවයි.\n```hela\nයවන්න ප්‍රතිඵලය;\n```',
        insertText: 'යවන්න ',
      },
      {
        label: 'ඉන්න',
        kind: CompletionItemKind.Keyword,
        detail: 'පොරොත්තු වීම (await promise)',
        documentation: 'අසමමුහුර්ත කාර්යයක් අවසන් වන තෙක් පොරොත්තු වේ.\n```hela\nදාන්න දත්ත = ඉන්න api.ලබාගන්න("url");\n```',
        insertText: 'ඉන්න ',
      },
      {
        label: 'උත්සාහ',
        kind: CompletionItemKind.Keyword,
        detail: 'දෝෂ කළමනාකරණය (try block)',
        documentation: 'දෝෂ ඇතිවිය හැකි කේත ධාවනය කර ආරක්ෂිතව අල්ලයි.\n```hela\nඋත්සාහ {\n    දාන්න දත්ත = ගොනු.කියවන්න("file.txt");\n} අල්ලන්න (දෝෂය) {\n    ලියන්න("දෝෂය:", දෝෂය);\n}\n```',
        insertText: 'උත්සාහ {\n    \n} අල්ලන්න (දෝෂය) {\n    \n}',
      },
      {
        label: 'විසිකරන්න',
        kind: CompletionItemKind.Keyword,
        detail: 'දෝෂයක් විසිකිරීම (throw error)',
        documentation: 'නව දෝෂයක් ජනනය කර විසිකරයි.\n```hela\nවිසිකරන්න "වලංගු නොවන අගයකි!";\n```',
        insertText: 'විසිකරන්න ',
      },
      {
        label: 'ගෙන්නන්න',
        kind: CompletionItemKind.Keyword,
        detail: 'මොඩියුල ගෙන්වීම (import module)',
        documentation: 'බාහිර මොඩියුලයක් හෝ npm පැකේජයක් ගෙන්වා ගනී.\n```hela\nගෙන්නන්න math "my-math-lib" ගෙන්;\n```',
        insertText: 'ගෙන්නන්න ',
      },
      {
        label: 'ඇත්ත',
        kind: CompletionItemKind.Value,
        detail: 'සත්‍ය බූලීය අගය (true)',
      },
      {
        label: 'බොරු',
        kind: CompletionItemKind.Value,
        detail: 'අසත්‍ය බූලීය අගය (false)',
      },
      {
        label: 'හිස්',
        kind: CompletionItemKind.Value,
        detail: 'හිස් අගය (null)',
      },

      // Standard Library Globals
      {
        label: 'ලියන්න',
        kind: CompletionItemKind.Function,
        detail: 'ලියන්න(...args): void (console.log / print)',
        documentation: 'තිරයේ හෝ කොන්සෝලයේ අගයන් මුද්‍රණය කරයි.\n```hela\nලියන්න("හෙලෝ ලෝකය!", 42);\n```',
        insertText: 'ලියන්න(',
      },
      {
        label: 'අරගන්න',
        kind: CompletionItemKind.Function,
        detail: 'ඉන්න අරගන්න(ප්‍රශ්නය): Promise<string> (prompt user input)',
        documentation: 'ටර්මිනලයෙන් පරිශීලක ආදාන කියවා ලබාගනී.\n```hela\nදාන්න නම = ඉන්න අරගන්න("ඔබේ නම කුමක්ද? ");\n```',
        insertText: 'අරගන්න(',
      },
      {
        label: 'සමාන්තර',
        kind: CompletionItemKind.Function,
        detail: 'සමාන්තර([කාර්යයන්]): Promise<any[]> (Promise.all)',
        documentation: 'කාර්යයන් කිහිපයක් එකවර සමාන්තරව ධාවනය කර සියලු ප්‍රතිඵල ලබාදෙයි.\n```hela\nදාන්න ප්‍රතිඵල = ඉන්න සමාන්තර([කාර්යය1(), කාර්යය2()]);\n```',
        insertText: 'සමාන්තර([',
      },
      {
        label: 'api',
        kind: CompletionItemKind.Module,
        detail: 'api (REST API Client)',
        documentation: 'HTTP API ඉල්ලීම් යැවීම සඳහා වන built-in මොඩියුලය (GET, POST, PUT, DELETE).',
      },
      {
        label: 'ගොනු',
        kind: CompletionItemKind.Module,
        detail: 'ගොනු (File System Module)',
        documentation: 'ගොනු කියවීම, ලිවීම සහ කළමනාකරණය සඳහා වන built-in මොඩියුලය.',
      },
      {
        label: 'කාලය',
        kind: CompletionItemKind.Module,
        detail: 'කාලය (Date & Time Module)',
        documentation: 'දිනය, වේලාව සහ නින්ද (sleep/delay) ලබාගැනීමේ මොඩියුලය.',
      },
      {
        label: 'ගණිතය',
        kind: CompletionItemKind.Module,
        detail: 'ගණිතය (Math Module)',
        documentation: 'ගණිතමය ගණනය කිරීම් සහ ශ්‍රිත සඳහා වන built-in මොඩියුලය.',
      },
      {
        label: 'දත්තගබඩාව',
        kind: CompletionItemKind.Module,
        detail: 'දත්තගබඩාව (SQLite Database Module)',
        documentation: 'දේශීය SQLite දත්ත සමුදායක් සාදා SQL විමසුම් ධාවනය කරයි.',
      },
      {
        label: 'ජාලය',
        kind: CompletionItemKind.Module,
        detail: 'ජාලය (HTTP Web Server Module)',
        documentation: 'දේශීය HTTP වෙබ් සේවාදායකයක් ආරම්භ කරයි.',
      },
    ];

    // Extract local identifiers defined in the document
    const idRegex = /(?:දාන්න|වෙනස්නොවන|වැඩේ)\s+([\u0D80-\u0DFFa-zA-Z0-9_]+)/g;
    let match: RegExpExecArray | null;
    const existingLabels = new Set(completions.map((c) => c.label));

    while ((match = idRegex.exec(documentText)) !== null) {
      const id = match[1];
      if (!existingLabels.has(id)) {
        existingLabels.add(id);
        completions.push({
          label: id,
          kind: CompletionItemKind.Variable,
          detail: `දේශීය විචල්‍යය / ශ්‍රිතය: ${id}`,
        });
      }
    }

    return completions;
  }

  /**
   * Autocompletions for module members
   */
  private getMemberCompletions(moduleName: string): CompletionItem[] {
    switch (moduleName) {
      case 'api':
        return [
          {
            label: 'ලබාගන්න',
            kind: CompletionItemKind.Method,
            detail: 'api.ලබාගන්න(url, options): Promise<any>',
            documentation: 'HTTP GET ඉල්ලීමක් යවා ප්‍රතිචාරය (JSON හෝ Text) ලබාගනී.\n```hela\nදාන්න දත්ත = ඉන්න api.ලබාගන්න("https://api.example.com/todos/1");\n```',
            insertText: 'ලබාගන්න(',
          },
          {
            label: 'යවන්න',
            kind: CompletionItemKind.Method,
            detail: 'api.යවන්න(url, body, options): Promise<any>',
            documentation: 'HTTP POST ඉල්ලීමක් යවයි.\n```hela\nදාන්න පිළිතුර = ඉන්න api.යවන්න("https://api.example.com/items", { නම: "පොත" });\n```',
            insertText: 'යවන්න(',
          },
          {
            label: 'දමන්න',
            kind: CompletionItemKind.Method,
            detail: 'api.දමන්න(url, body, options): Promise<any>',
            documentation: 'HTTP PUT ඉල්ලීමක් යවයි.',
            insertText: 'දමන්න(',
          },
          {
            label: 'මකන්න',
            kind: CompletionItemKind.Method,
            detail: 'api.මකන්න(url, options): Promise<any>',
            documentation: 'HTTP DELETE ඉල්ලීමක් යවයි.',
            insertText: 'මකන්න(',
          },
        ];

      case 'ගොනු':
        return [
          {
            label: 'කියවන්න',
            kind: CompletionItemKind.Method,
            detail: 'ගොනු.කියවන්න(path): string',
            documentation: 'ගොනුවේ සියලු අන්තර්ගතය පෙළ (text) ලෙස කියවා ආපසු ලබාදෙයි.\n```hela\nදාන්න පෙළ = ගොනු.කියවන්න("data.txt");\n```',
            insertText: 'කියවන්න(',
          },
          {
            label: 'ලියන්න',
            kind: CompletionItemKind.Method,
            detail: 'ගොනු.ලියන්න(path, content): void',
            documentation: 'ගොනුවක් සාදා එහි අන්තර්ගතය ලියයි (පවතින ගොනුවක් නම් උඩින් ලියයි).\n```hela\nගොනු.ලියන්න("output.txt", "හෙළස්ක්‍රිප්ට් සාදරයෙන් පිළිගනී");\n```',
            insertText: 'ලියන්න(',
          },
          {
            label: 'එකතු_කරන්න',
            kind: CompletionItemKind.Method,
            detail: 'ගොනු.එකතු_කරන්න(path, content): void',
            documentation: 'පවතින ගොනුවක අගට අලුත් පෙළ එක් කරයි (Append file).',
            insertText: 'එකතු_කරන්න(',
          },
          {
            label: 'තිබේද',
            kind: CompletionItemKind.Method,
            detail: 'ගොනු.තිබේද(path): boolean',
            documentation: 'යම් ලිපිගොනුවක් පවතීදැයි පරීක්ෂා කර `ඇත්ත` හෝ `බොරු` ලබාදෙයි.',
            insertText: 'තිබේද(',
          },
          {
            label: 'විස්තර',
            kind: CompletionItemKind.Method,
            detail: 'ගොනු.විස්තර(path): object',
            documentation: 'ගොනුවේ ප්‍රමාණය සහ වෙනස් කළ වේලාව ආදී විස්තර ලබාදෙයි.',
            insertText: 'විස්තර(',
          },
          {
            label: 'මකන්න',
            kind: CompletionItemKind.Method,
            detail: 'ගොනු.මකන්න(path): void',
            documentation: 'ගොනුවක් ගොනු පද්ධතියෙන් ස්ථිරව මකා දමයි.',
            insertText: 'මකන්න(',
          },
          {
            label: 'නාමාවලිය',
            kind: CompletionItemKind.Method,
            detail: 'ගොනු.නාමාවලිය(path): string[]',
            documentation: 'ෆෝල්ඩරයක් තුළ ඇති සියලු ගොනු සහ ෆෝල්ඩර ලැයිස්තුගත කරයි.',
            insertText: 'නාමාවලිය(',
          },
        ];

      case 'කාලය':
        return [
          {
            label: 'දැන්',
            kind: CompletionItemKind.Method,
            detail: 'කාලය.දැන්(): string',
            documentation: 'වත්මන් දිනය සහ වේලාව ISO ආකෘතියෙන් ලබාදෙයි.',
            insertText: 'දැන්()',
          },
          {
            label: 'මිලිසෙකන්ඩ්',
            kind: CompletionItemKind.Method,
            detail: 'කාලය.මිලිසෙකන්ඩ්(): number',
            documentation: 'වත්මන් Unix epoch timestamp එක මිලිසෙකන්ඩ් වලින් ලබාදෙයි.',
            insertText: 'මිලිසෙකන්ඩ්()',
          },
          {
            label: 'නිදාගන්න',
            kind: CompletionItemKind.Method,
            detail: 'ඉන්න කාලය.නිදාගන්න(ms): Promise<void>',
            documentation: 'වැඩසටහන ලබාදුන් මිලිසෙකන්ඩ් ගණනකට ප්‍රමාද කරයි (Sleep/Delay).\n```hela\nඉන්න කාලය.නිදාගන්න(1000); // 1s sleep\n```',
            insertText: 'නිදාගන්න(',
          },
          {
            label: 'දිනය',
            kind: CompletionItemKind.Method,
            detail: 'කාලය.දිනය(): string',
            documentation: 'වත්මන් දිනය ලබාදෙයි.',
            insertText: 'දිනය()',
          },
          {
            label: 'වෙලාව',
            kind: CompletionItemKind.Method,
            detail: 'කාලය.වෙලාව(): string',
            documentation: 'වත්මන් වේලාව ලබාදෙයි.',
            insertText: 'වෙලාව()',
          },
        ];

      case 'ගණිතය':
        return [
          {
            label: 'වර්ගමූලය',
            kind: CompletionItemKind.Method,
            detail: 'ගණිතය.වර්ගමූලය(n): number',
            documentation: 'සංඛ්‍යාවක වර්ගමූලය ගණනය කරයි (Square root).',
            insertText: 'වර්ගමූලය(',
          },
          {
            label: 'බලය',
            kind: CompletionItemKind.Method,
            detail: 'ගණිතය.බලය(base, exp): number',
            documentation: 'පාදයක බලය ගණනය කරයි (Math.pow).',
            insertText: 'බලය(',
          },
          {
            label: 'වටයන්න',
            kind: CompletionItemKind.Method,
            detail: 'ගණිතය.වටයන්න(n): number',
            documentation: 'සංඛ්‍යාව ළඟම නිඛිලයට වටයයි (Math.round).',
            insertText: 'වටයන්න(',
          },
          {
            label: 'උඩට',
            kind: CompletionItemKind.Method,
            detail: 'ගණිතය.උඩට(n): number',
            documentation: 'සංඛ්‍යාව ඉහළ නිඛිලයට වටයයි (Math.ceil).',
            insertText: 'උඩට(',
          },
          {
            label: 'යටට',
            kind: CompletionItemKind.Method,
            detail: 'ගණිතය.යටට(n): number',
            documentation: 'සංඛ්‍යාව පහළ නිඛිලයට වටයයි (Math.floor).',
            insertText: 'යටට(',
          },
          {
            label: 'සසම්භාවී',
            kind: CompletionItemKind.Method,
            detail: 'ගණිතය.සසම්භාවී(): number',
            documentation: '0 සහ 1 අතර අහඹු දශම සංඛ්‍යාවක් ලබාදෙයි (Math.random).',
            insertText: 'සසම්භාවී()',
          },
          {
            label: 'අතර_සසම්භාවී',
            kind: CompletionItemKind.Method,
            detail: 'ගණිතය.අතර_සසම්භාවී(min, max): number',
            documentation: 'ලබාදුන් අවම සහ උපරිම සීමාවන් අතර අහඹු නිඛිලයක් ලබාදෙයි.',
            insertText: 'අතර_සසම්භාවී(',
          },
          {
            label: 'නිරපේක්ෂ',
            kind: CompletionItemKind.Method,
            detail: 'ගණිතය.නිරපේක්ෂ(n): number',
            documentation: 'සංඛ්‍යාවක නිරපේක්ෂ ධන අගය (Math.abs) ලබාදෙයි.',
            insertText: 'නිරපේක්ෂ(',
          },
          {
            label: 'ලඝු',
            kind: CompletionItemKind.Method,
            detail: 'ගණිතය.ලඝු(n): number',
            documentation: 'ස්වභාවික ලඝුගණක අගය (Math.log) ගණනය කරයි.',
            insertText: 'ලඝු(',
          },
        ];

      default:
        return [];
    }
  }

  /**
   * Computes hover documentation at cursor position
   */
  public getHover(documentText: string, position: Position): Hover | null {
    const lines = documentText.split(/\r?\n/);
    const line = lines[position.line];
    if (line === undefined) return null;

    // Check if cursor is on a member expression like `api.ලබාගන්න`
    const memberRegex = /([\u0D80-\u0DFFa-zA-Z0-9_]+)\.([\u0D80-\u0DFFa-zA-Z0-9_]+)/g;
    let mMatch: RegExpExecArray | null;
    while ((mMatch = memberRegex.exec(line)) !== null) {
      const start = mMatch.index;
      const end = start + mMatch[0].length;
      if (position.character >= start && position.character <= end) {
        const mod = mMatch[1];
        const prop = mMatch[2];
        const memberDocs = this.getMemberCompletions(mod);
        const item = memberDocs.find((d) => d.label === prop);
        if (item) {
          return {
            contents: {
              kind: 'markdown',
              value: `### \`${mod}.${prop}\`\n\n**${item.detail || ''}**\n\n${typeof item.documentation === 'string' ? item.documentation : ''}`,
            },
            range: {
              start: { line: position.line, character: start },
              end: { line: position.line, character: end },
            },
          };
        }
      }
    }

    // Find the word under cursor
    const wordRegex = /[\u0D80-\u0DFFa-zA-Z0-9_]+/g;
    let match: RegExpExecArray | null;
    while ((match = wordRegex.exec(line)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (position.character >= start && position.character <= end) {
        const word = match[0];
        const docs = this.getDocumentationForWord(word);
        if (docs) {
          return {
            contents: {
              kind: 'markdown',
              value: docs,
            },
            range: {
              start: { line: position.line, character: start },
              end: { line: position.line, character: end },
            },
          };
        }
      }
    }

    return null;
  }

  private getDocumentationForWord(word: string): string | null {
    switch (word) {
      case 'දාන්න':
        return `### \`දාන්න\` (Let Variable Declaration)
නව වෙනස් කළ හැකි විචල්‍යයක් ප්‍රකාශයට පත් කරයි.
\`\`\`hela
දාන්න අගය = 100;
\`\`\``;

      case 'වෙනස්නොවන':
        return `### \`වෙනස්නොවන\` (Const Constant Declaration)
නැවත අගය වෙනස් කළ නොහැකි නියතයක් ප්‍රකාශයට පත් කරයි.
\`\`\`hela
වෙනස්නොවන වේගය = 299792458;
\`\`\``;

      case 'වැඩේ':
        return `### \`වැඩේ\` (Function Declaration)
ස්වභාවික සිංහල ක්‍රියාවක් හෝ ශ්‍රිතයක් නිර්මාණය කරයි.
\`\`\`hela
වැඩේ එකතුව(a, b) {
    යවන්න a + b;
}
\`\`\``;

      case 'නොපෙනෙන':
        return `### \`නොපෙනෙන\` (Async Function)
පසුබිමේ අසමමුහුර්තව ධාවනය වන non-blocking ශ්‍රිතයක් සාදයි.
\`\`\`hela
නොපෙනෙන වැඩේ දත්ත_ලබාගන්න() {
    දාන්න ප්‍රතිචාරය = ඉන්න api.ලබාගන්න("https://example.com");
    යවන්න ප්‍රතිචාරය;
}
\`\`\``;

      case 'ඉන්න':
        return `### \`ඉන්න\` (Await)
අසමමුහුර්ත ප්‍රතිඵලයක් (Promise) සම්පූර්ණ වන තෙක් ප්‍රධාන වැඩසටහන බාධාවකින් තොරව පොරොත්තු කරවයි.`;

      case 'ඉදින්':
        return `### \`ඉදින්\` (If Conditional)
කොන්දේසිය සත්‍ය නම් කේත ඛණ්ඩය ක්‍රියාත්මක කරයි.
\`\`\`hela
ඉදින් (ලකුණු >= 75) {
    ලියන්න("විශිෂ්ට සාමාර්ථයකි!");
}
\`\`\``;

      case 'නැත්තම්':
        return `### \`නැත්තම්\` (Else Conditional)
\`ඉදින්\` කොන්දේසිය අසත්‍ය වූ විට ක්‍රියාත්මක වන විකල්ප කේත ඛණ්ඩය.`;

      case 'කියනකල්':
        return `### \`කියනකල්\` (While Loop)
කොන්දේසිය සත්‍යව පවතින තාක්කල් කේතය නැවත නැවත ක්‍රියාත්මක කරයි.
\`\`\`hela
කියනකල් (ගණනය < 10) {
    ගණනය += 1;
}
\`\`\``;

      case 'හැම':
        return `### \`හැම\` (For Loop)
පරාස හෝ ලැයිස්තු අයිතම ඔස්සේ පුනරාවර්තනය වන ලූපය.
\`\`\`hela
හැම (දාන්න x ගෙන් අගයන්) {
    ලියන්න(x);
}
\`\`\``;

      case 'යවන්න':
        return `### \`යවන්න\` (Return Statement)
ශ්‍රිතයකින් හෝ වැඩේකින් ප්‍රතිඵලයක් ආපසු යවයි.
\`\`\`hela
යවන්න ප්‍රතිඵලය;
\`\`\``;

      case 'උත්සාහ':
        return `### \`උත්සාහ { ... } අල්ලන්න (දෝෂය) { ... }\` (Error Handling / Try-Catch)
ධාවන කාලයේදී හටගන්නා දෝෂ ආරක්ෂිතව හසුරුවා පද්ධතිය බිඳවැටීම වළක්වයි.
\`\`\`hela
උත්සාහ {
    දාන්න අන්තර්ගතය = ගොනු.කියවන්න("දත්ත.txt");
} අල්ලන්න (දෝෂය) {
    ලියන්න("දෝෂය:", දෝෂය);
}
\`\`\``;

      case 'අල්ලන්න':
      case 'අල්ලාගන්න':
        return `### \`අල්ලන්න (දෝෂය)\` (Catch Block)
\`උත්සාහ\` කොටසේ හටගන්නා දෝෂය අල්ලා විස්තර ලබා දෙයි.`;

      case 'විසිකරන්න':
        return `### \`විසිකරන්න\` (Throw Statement)
පරිශීලක අභිරුචි දෝෂයක් (Exception) ජනනය කර පද්ධතිය වෙත විසිකරයි.
\`\`\`hela
විසිකරන්න "වලංගු නොවන ශිෂ්‍ය අංකයකි!";
\`\`\``;

      case 'සමාන්තර':
        return `### \`සමාන්තර([කාර්යයන්])\` (Parallel Execution / Promise.all)
කාර්යයන් කිහිපයක් එකවර සමාන්තරව (concurrently) ධාවනය කර සියලු ප්‍රතිඵල ලැයිස්තුවක් ලෙස ආපසු ලබාදෙයි.
\`\`\`hela
දාන්න ප්‍රතිඵල = ඉන්න සමාන්තර([කාර්යය_1(), කාර්යය_2()]);
\`\`\``;

      case 'ලියන්න':
        return `### \`ලියන්න(...args)\` (Print to Console)
අගයන් කොන්සෝලයේ හෝ ටර්මිනලයේ මුද්‍රණය කරයි.
\`\`\`hela
ලියන්න("හෙළස්ක්‍රිප්ට්", 2026);
\`\`\``;

      case 'අරගන්න':
        return `### \`අරගන්න(ප්‍රශ්නය)\` (Prompt Input)
පරිශීලකයාගෙන් terminal හරහා පෙළ ආදාන ලබාගනී.
\`\`\`hela
දාන්න නම = ඉන්න අරගන්න("ඔබේ නම: ");
\`\`\``;

      case 'api':
        return `### \`api\` (REST API Client Module)
බාහිර HTTP REST APIs වෙත GET, POST, PUT, DELETE ඉල්ලීම් යැවීම සඳහා වන built-in මොඩියුලය.`;

      case 'ගොනු':
        return `### \`ගොනු\` (File System Module)
දේශීය ලිපිගොනු කියවීම, ලිවීම, සංස්කරණය සහ මකාදැමීම සඳහා වන built-in මොඩියුලය.`;

      case 'කාලය':
        return `### \`කාලය\` (Time & Date Module)
දිනය, වේලාව, කාල මුද්‍රා සහ ප්‍රමාද (Delay/Sleep) සඳහා වන මොඩියුලය.`;

      case 'ගණිතය':
        return `### \`ගණිතය\` (Math Module)
වර්ගමූල, බල, අහඹු සංඛ්‍යා සහ වටයෑම් ඇතුළු ගණිතමය කාර්යයන් සඳහා වන මොඩියුලය.`;

      default:
        return null;
    }
  }
}
