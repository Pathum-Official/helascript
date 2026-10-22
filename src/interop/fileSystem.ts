/**
 * HelaScript Native File System Module
 * Wraps Node.js 'fs' with spoken Sinhala method aliases and path resolution.
 */

import * as fs from 'fs';
import * as path from 'path';
import { HelaError, SourceLocation } from '../diagnostics/error.js';

export function createFileSystemModule(basePath: string = process.cwd(), loc?: SourceLocation): Record<string, any> {
  const safeLoc: SourceLocation = loc || { line: 1, column: 1 };

  const resolvePath = (filePath: string): string => {
    return path.isAbsolute(filePath) ? filePath : path.resolve(basePath, filePath);
  };

  return {
    ...fs,
    raw: fs,

    // ලිවීම (Writing to a file)
    ලියන්න: (filePath: string, content: any, encoding: BufferEncoding = 'utf-8'): boolean => {
      try {
        const fullPath = resolvePath(filePath);
        const str = typeof content === 'object' && content !== null
          ? JSON.stringify(content, null, 2)
          : String(content ?? '');
        fs.writeFileSync(fullPath, str, encoding);
        return true;
      } catch (err: any) {
        throw new HelaError(`ගොනුව ලිවීමේදී දෝෂයකි ('${filePath}'): ${err.message}`, safeLoc);
      }
    },
    write: (filePath: string, content: any, encoding: BufferEncoding = 'utf-8'): boolean => {
      const fullPath = resolvePath(filePath);
      const str = typeof content === 'object' && content !== null
        ? JSON.stringify(content, null, 2)
        : String(content ?? '');
      fs.writeFileSync(fullPath, str, encoding);
      return true;
    },
    writeFile: (filePath: string, content: any, encoding: BufferEncoding = 'utf-8'): boolean => {
      const fullPath = resolvePath(filePath);
      const str = typeof content === 'object' && content !== null
        ? JSON.stringify(content, null, 2)
        : String(content ?? '');
      fs.writeFileSync(fullPath, str, encoding);
      return true;
    },

    // කියවීම (Reading from a file)
    කියවන්න: (filePath: string, encoding: BufferEncoding = 'utf-8'): string => {
      const fullPath = resolvePath(filePath);
      if (!fs.existsSync(fullPath)) {
        throw new HelaError(`ගොනුව සොයාගත නොහැකි විය: '${filePath}'`, safeLoc);
      }
      try {
        return fs.readFileSync(fullPath, encoding);
      } catch (err: any) {
        throw new HelaError(`ගොනුව කියවීමේදී දෝෂයකි ('${filePath}'): ${err.message}`, safeLoc);
      }
    },
    read: (filePath: string, encoding: BufferEncoding = 'utf-8'): string => {
      const fullPath = resolvePath(filePath);
      if (!fs.existsSync(fullPath)) {
        throw new HelaError(`ගොනුව සොයාගත නොහැකි විය: '${filePath}'`, safeLoc);
      }
      return fs.readFileSync(fullPath, encoding);
    },
    readFile: (filePath: string, encoding: BufferEncoding = 'utf-8'): string => {
      const fullPath = resolvePath(filePath);
      if (!fs.existsSync(fullPath)) {
        throw new HelaError(`ගොනුව සොයාගත නොහැකි විය: '${filePath}'`, safeLoc);
      }
      return fs.readFileSync(fullPath, encoding);
    },

    // එකතු කිරීම (Appending to a file)
    එකතු_කරන්න: (filePath: string, content: any, encoding: BufferEncoding = 'utf-8'): boolean => {
      try {
        const fullPath = resolvePath(filePath);
        const str = typeof content === 'object' && content !== null
          ? JSON.stringify(content, null, 2)
          : String(content ?? '');
        fs.appendFileSync(fullPath, str, encoding);
        return true;
      } catch (err: any) {
        throw new HelaError(`ගොනුවට එකතු කිරීමේදී දෝෂයකි ('${filePath}'): ${err.message}`, safeLoc);
      }
    },
    append: (filePath: string, content: any, encoding: BufferEncoding = 'utf-8'): boolean => {
      const fullPath = resolvePath(filePath);
      const str = typeof content === 'object' && content !== null
        ? JSON.stringify(content, null, 2)
        : String(content ?? '');
      fs.appendFileSync(fullPath, str, encoding);
      return true;
    },

    // ගොනුව පවතීදැයි පරීක්ෂාව (File exists check)
    තිබේද: (filePath: string): boolean => {
      return fs.existsSync(resolvePath(filePath));
    },
    exists: (filePath: string): boolean => {
      return fs.existsSync(resolvePath(filePath));
    },

    // මැකීම (Deleting a file)
    මකන්න: (filePath: string): boolean => {
      const fullPath = resolvePath(filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    },
    delete: (filePath: string): boolean => {
      const fullPath = resolvePath(filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    },

    // ෆෝල්ඩරයේ ඇති ගොනු ලැයිස්තුව (Directory list)
    ලැයිස්තුව: (dirPath: string = '.'): string[] => {
      const fullPath = resolvePath(dirPath);
      if (!fs.existsSync(fullPath)) {
        throw new HelaError(`ෆෝල්ඩරය සොයාගත නොහැකි විය: '${dirPath}'`, safeLoc);
      }
      return fs.readdirSync(fullPath);
    },
    list: (dirPath: string = '.'): string[] => {
      return fs.readdirSync(resolvePath(dirPath));
    },

    // නව ෆෝල්ඩරයක් සෑදීම (Make directory)
    ෆෝල්ඩරය_හදන්න: (dirPath: string): boolean => {
      fs.mkdirSync(resolvePath(dirPath), { recursive: true });
      return true;
    },
    mkdir: (dirPath: string): boolean => {
      fs.mkdirSync(resolvePath(dirPath), { recursive: true });
      return true;
    },

    // ෆෝල්ඩරයක් මැකීම (Remove directory)
    ෆෝල්ඩරය_මකන්න: (dirPath: string): boolean => {
      const fullPath = resolvePath(dirPath);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        return true;
      }
      return false;
    },
    rmdir: (dirPath: string): boolean => {
      const fullPath = resolvePath(dirPath);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        return true;
      }
      return false;
    },

    // ගොනු විස්තර (File metadata / stat)
    විස්තර: (filePath: string) => {
      const fullPath = resolvePath(filePath);
      if (!fs.existsSync(fullPath)) {
        throw new HelaError(`ගොනුව සොයාගත නොහැකි විය: '${filePath}'`, safeLoc);
      }
      const s = fs.statSync(fullPath);
      return {
        දිග: s.size,
        size: s.size,
        ගොනුවක්ද: s.isFile(),
        isFile: s.isFile(),
        ෆෝල්ඩරයක්ද: s.isDirectory(),
        isDirectory: s.isDirectory(),
        සෑදූ_දිනය: s.birthtime,
        වෙනස්කළ_දිනය: s.mtime,
      };
    },
    stat: (filePath: string) => {
      const fullPath = resolvePath(filePath);
      if (!fs.existsSync(fullPath)) {
        throw new HelaError(`ගොනුව සොයාගත නොහැකි විය: '${filePath}'`, safeLoc);
      }
      const s = fs.statSync(fullPath);
      return {
        දිග: s.size,
        size: s.size,
        ගොනුවක්ද: s.isFile(),
        isFile: s.isFile(),
        ෆෝල්ඩරයක්ද: s.isDirectory(),
        isDirectory: s.isDirectory(),
        birthtime: s.birthtime,
        mtime: s.mtime,
      };
    },
  };
}
