/**
 * Lightweight browser path shim
 */

export const resolve = (...args: string[]) => args.filter(Boolean).join('/').replace(/\/+/g, '/');
export const join = (...args: string[]) => args.filter(Boolean).join('/').replace(/\/+/g, '/');
export const isAbsolute = (p: string) => p.startsWith('/') || p.startsWith('http://') || p.startsWith('https://');
export const basename = (p: string) => p.split(/[\\/]/).pop() || '';
export const dirname = (p: string) => {
  const parts = p.split(/[\\/]/);
  parts.pop();
  return parts.join('/') || '.';
};

export default {
  resolve,
  join,
  isAbsolute,
  basename,
  dirname,
};
