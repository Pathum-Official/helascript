/**
 * HelaScript Browser Runtime & Web Playground Engine
 * Runs completely in client-side Web Workers or browser environments.
 */

import { Lexer } from '../lexer/lexer.js';
import { Parser } from '../parser/parser.js';
import { Environment } from '../evaluator/environment.js';
import { Evaluator } from '../evaluator/evaluator.js';
import { HelaNativeFunction, ReturnSignal } from '../evaluator/values.js';
import { createHttpClientModule } from '../interop/apiClient.js';
import { formatValue } from '../stdlib/stdlib.js';

export interface WebExecutionResult {
  success: boolean;
  result?: any;
  output: string[];
  executionTimeMs: number;
  error?: string;
}

export function setupBrowserStandardLibrary(
  env: Environment,
  outputCapture: string[]
): void {
  const def = (name: string, val: any) => env.define(name, val, true, undefined, true);

  // ලියන්න (console.log / captured output)
  def(
    'ලියන්න',
    new HelaNativeFunction('ලියන්න', (...args: any[]) => {
      const formatted = args.map((arg) => formatValue(arg)).join(' ');
      outputCapture.push(formatted);
      if (typeof console !== 'undefined' && console.log) {
        console.log(...args);
      }
      return null;
    })
  );

  // ලබාගන්න (fetch)
  def(
    'ලබාගන්න',
    new HelaNativeFunction(
      'ලබාගන්න',
      async (url: string, options?: RequestInit): Promise<any> => {
        const fetchFn = typeof fetch !== 'undefined' ? fetch : globalThis.fetch;
        const response = await fetchFn(url, options);
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await response.json();
        }
        return await response.text();
      },
      true
    )
  );

  // නිදන්න (sleep)
  def(
    'නිදන්න',
    new HelaNativeFunction(
      'නිදන්න',
      async (ms: number): Promise<void> => {
        return new Promise((resolve) => setTimeout(resolve, Number(ms) || 0));
      },
      true
    )
  );

  // සමාන්තර (Promise.all)
  const parallelFn = new HelaNativeFunction(
    'සමාන්තර',
    async (tasks: any[]): Promise<any[]> => {
      if (!Array.isArray(tasks)) {
        return [tasks];
      }
      return await Promise.all(tasks);
    },
    true
  );
  def('සමාන්තර', parallelFn);
  def('parallel', parallelFn);

  // දිග (length)
  def(
    'දිග',
    new HelaNativeFunction('දිග', (item: any): number => {
      if (item === null || item === undefined) return 0;
      if (typeof item === 'string' || Array.isArray(item)) return item.length;
      if (typeof item === 'object') return Object.keys(item).length;
      return 0;
    })
  );

  // වර්ගය (typeof)
  def(
    'වර්ගය',
    new HelaNativeFunction('වර්ගය', (item: any): string => {
      if (item === null || item === undefined) return 'හිස්';
      if (Array.isArray(item)) return 'ලැයිස්තුව';
      if (typeof item === 'string') return 'අකුරු';
      if (typeof item === 'number') return 'සංඛ්‍යාව';
      if (typeof item === 'boolean') return 'බූලීය';
      if (typeof item === 'function' || item?.call) return 'වැඩේ';
      if (typeof item === 'object') return 'වස්තුව';
      return typeof item;
    })
  );

  // සංඛ්‍යාව (Number conversion)
  def(
    'සංඛ්‍යාව',
    new HelaNativeFunction('සංඛ්‍යාව', (val: any): number => Number(val))
  );

  // අකුරු (String conversion)
  def(
    'අකුරු',
    new HelaNativeFunction('අකුරු', (val: any): string => formatValue(val))
  );

  // කාලය (Date & Time)
  const timeFn = new HelaNativeFunction('කාලය', (): number => Date.now());
  Object.assign(timeFn, {
    දැන්: () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },
    වර්ෂය: () => new Date().getFullYear(),
    මාසය: () => new Date().getMonth() + 1,
    දිනය: () => new Date().getDate(),
    පැය: () => new Date().getHours(),
    මිනිත්තු: () => new Date().getMinutes(),
    තත්පර: () => new Date().getSeconds(),
    මිලි_තත්පර: () => Date.now(),
  });
  def('කාලය', timeFn);

  // ගණිතය (Math)
  const mathObj: Record<string, any> = {
    pi: Math.PI,
    e: Math.E,
    වටයන්න: Math.round,
    පහළට: Math.floor,
    ඉහළට: Math.ceil,
    අවම: Math.min,
    උපරිම: Math.max,
    සසම්භාවී: (min?: number, max?: number) => {
      if (min !== undefined && max !== undefined) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      return Math.random();
    },
    වර්ගමූලය: Math.sqrt,
    බලය: Math.pow,
    නිරපේක්ෂ: Math.abs,
    ලඝු: Math.log,
  };
  def('ගණිතය', mathObj);
  def('Math', mathObj);

  // api (HTTP client)
  def('api', createHttpClientModule());
}

/**
 * Execute HelaScript in browser
 */
export async function runWeb(code: string): Promise<WebExecutionResult> {
  const output: string[] = [];
  const start = performance.now();

  try {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens, code);
    const program = parser.parse();

    const evaluator = new Evaluator({ sourceCode: code });
    setupBrowserStandardLibrary(evaluator.globalEnv, output);

    let result: any = null;
    try {
      result = await evaluator.evaluateProgram(program);
    } catch (sig) {
      if (sig instanceof ReturnSignal) {
        result = sig.value;
      } else {
        throw sig;
      }
    }

    const duration = performance.now() - start;
    return {
      success: true,
      result,
      output,
      executionTimeMs: Math.round(duration * 100) / 100,
    };
  } catch (err: any) {
    const duration = performance.now() - start;
    const msg = typeof err.format === 'function' ? err.format() : err.message;
    return {
      success: false,
      output,
      error: msg,
      executionTimeMs: Math.round(duration * 100) / 100,
    };
  }
}

/**
 * Tokenize code for visual inspection
 */
export function tokenizeWeb(code: string) {
  const lexer = new Lexer(code);
  return lexer.tokenize();
}

/**
 * Parse code into AST for visual inspection
 */
export function parseWeb(code: string) {
  const lexer = new Lexer(code);
  const parser = new Parser(lexer.tokenize(), code);
  return parser.parse();
}
