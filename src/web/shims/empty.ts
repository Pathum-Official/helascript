/**
 * Empty Shim for Node.js built-ins in Browser bundle
 */

export const writeFileSync = () => {};
export const readFileSync = () => '';
export const existsSync = () => false;
export const appendFileSync = () => {};
export const unlinkSync = () => {};
export const readdirSync = () => [];
export const mkdirSync = () => {};
export const rmSync = () => {};
export const statSync = () => ({ size: 0, isFile: () => false, isDirectory: () => false, birthtime: new Date(), mtime: new Date() });

export const createRequire = () => () => ({});
export const createInterface = () => ({
  question: (_q: string, cb: (ans: string) => void) => cb(''),
  close: () => {},
});

export default {
  writeFileSync,
  readFileSync,
  existsSync,
  appendFileSync,
  unlinkSync,
  readdirSync,
  mkdirSync,
  rmSync,
  statSync,
  createRequire,
  createInterface,
};
