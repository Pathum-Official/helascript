/**
 * HelaScript Standard Library
 * Built-in functions and objects in spoken Sinhala.
 */

import * as readline from 'readline';
import { Environment } from '../evaluator/environment.js';
import { HelaNativeFunction } from '../evaluator/values.js';

export function setupStandardLibrary(env: Environment): void {
  // ලියන්න (console.log / print)
  env.define(
    'ලියන්න',
    new HelaNativeFunction('ලියන්න', (...args: any[]) => {
      const formatted = args.map((arg) => formatValue(arg));
      console.log(...formatted);
      return null;
    }),
    true
  );

  // අරගන්න (prompt user input from terminal async)
  env.define(
    'අරගන්න',
    new HelaNativeFunction(
      'අරගන්න',
      async (promptText: string = ''): Promise<string> => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        return new Promise((resolve) => {
          rl.question(String(promptText), (answer: string) => {
            rl.close();
            resolve(answer);
          });
        });
      },
      true
    ),
    true
  );

  // ලබාගන්න (fetch HTTP request async)
  env.define(
    'ලබාගන්න',
    new HelaNativeFunction(
      'ලබාගන්න',
      async (url: string, options?: RequestInit): Promise<any> => {
        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await response.json();
        }
        return await response.text();
      },
      true
    ),
    true
  );

  // නිදන්න (sleep / delay in milliseconds)
  env.define(
    'නිදන්න',
    new HelaNativeFunction(
      'නිදන්න',
      async (ms: number): Promise<void> => {
        return new Promise((resolve) => setTimeout(resolve, Number(ms) || 0));
      },
      true
    ),
    true
  );

  // දිග (length of array, string, or object)
  env.define(
    'දිග',
    new HelaNativeFunction('දිග', (item: any): number => {
      if (item === null || item === undefined) return 0;
      if (typeof item === 'string' || Array.isArray(item)) return item.length;
      if (typeof item === 'object') return Object.keys(item).length;
      return 0;
    }),
    true
  );

  // වර්ගය (typeof in Sinhala)
  env.define(
    'වර්ගය',
    new HelaNativeFunction('වර්ගය', (item: any): string => {
      if (item === null || item === undefined) return 'හිස්';
      if (Array.isArray(item)) return 'ලැයිස්තුව';
      if (typeof item === 'string') return 'අකුරු';
      if (typeof item === 'number') return 'සංඛ්‍යාව';
      if (typeof item === 'boolean') return 'බූලීය';
      if (typeof item === 'function' || item.call) return 'වැඩේ';
      if (typeof item === 'object') return 'වස්තුව';
      return typeof item;
    }),
    true
  );

  // සංඛ්‍යාව (convert to number)
  env.define(
    'සංඛ්‍යාව',
    new HelaNativeFunction('සංඛ්‍යාව', (val: any): number => {
      return Number(val);
    }),
    true
  );

  // අකුරු (convert to string)
  env.define(
    'අකුරු',
    new HelaNativeFunction('අකුරු', (val: any): string => {
      return formatValue(val);
    }),
    true
  );

  // කාලය (current timestamp and date/time helpers)
  const timeFn = new HelaNativeFunction('කාලය', (): number => {
    return Date.now();
  });
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
    year: () => new Date().getFullYear(),
    month: () => new Date().getMonth() + 1,
    day: () => new Date().getDate(),
    now: () => Date.now(),
  });
  env.define('කාලය', timeFn, true);

  // ගණිතය (Math library with English and Sinhala aliases, range random, logs)
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
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
    min: Math.min,
    max: Math.max,
    random: (min?: number, max?: number) => {
      if (min !== undefined && max !== undefined) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      return Math.random();
    },
    sqrt: Math.sqrt,
    pow: Math.pow,
    abs: Math.abs,
    log: Math.log,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
  };
  env.define('ගණිතය', mathObj, true);
  env.define('Math', mathObj, true);

  // process and console for Node environment integration
  if (typeof process !== 'undefined') {
    env.define('process', process, true);
  }
}

/**
 * Pretty-print values with Sinhala conventions
 */
export function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'හිස්';
  }
  if (value === true) {
    return 'ඇත්ත';
  }
  if (value === false) {
    return 'බොරු';
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => formatValue(v)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    if (value.name && value.params) {
      return `[වැඩේ ${value.name || 'නිර්නාමික'}]`;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
