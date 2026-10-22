/**
 * HelaScript Node.js / NPM / Module Interoperability
 * Resolves and imports standard Node.js built-ins, NPM packages,
 * local JavaScript files, and other .hela modules.
 */

import { createRequire } from 'module';
import * as path from 'path';
import * as fs from 'fs';
import { HelaError, SinhalaErrors, SourceLocation } from '../diagnostics/error.js';
import { createFileSystemModule } from './fileSystem.js';
import { createHttpClientModule } from './apiClient.js';

export { createFileSystemModule } from './fileSystem.js';
export { createHttpClientModule } from './apiClient.js';

export class ModuleLoader {
  private require: NodeRequire;
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
    try {
      this.require = createRequire(path.join(basePath, 'dummy.js'));
    } catch {
      const fallback = typeof __filename !== 'undefined'
        ? __filename
        : (typeof process !== 'undefined' ? process.cwd() : '.');
      this.require = createRequire(fallback);
    }
  }

  public setBasePath(basePath: string): void {
    this.basePath = basePath;
    try {
      this.require = createRequire(path.join(basePath, 'dummy.js'));
    } catch {
      const fallback = typeof __filename !== 'undefined'
        ? __filename
        : (typeof process !== 'undefined' ? process.cwd() : '.');
      this.require = createRequire(fallback);
    }
  }

  /**
   * Load module by specifier (e.g. 'fs', 'path', 'axios', './helper.js', './math.hela')
   */
  public async loadModule(
    source: string,
    loc: SourceLocation,
    evaluator?: any
  ): Promise<any> {
    // 1. Check if loading a local .hela file
    if (source.endsWith('.hela')) {
      const resolvedPath = path.isAbsolute(source)
        ? source
        : path.resolve(this.basePath, source);

      if (!fs.existsSync(resolvedPath)) {
        throw new HelaError(
          `'.hela' ගොනුව සොයාගත නොහැකි විය: '${resolvedPath}'`,
          loc
        );
      }

      if (!evaluator) {
        throw new HelaError(
          `HelaScript මොඩියුලයක් පූරණය කිරීමට evaluator අවශ්‍ය වේ`,
          loc
        );
      }

      const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
      const modEnv = await evaluator.runModule(fileContent, resolvedPath);
      // Return exported bindings as an object
      return modEnv.getExports();
    }

    // 2. Check if loading from hela_modules (installed via hela-pkg)
    const helaModDir = path.resolve(this.basePath, 'hela_modules', source);
    if (fs.existsSync(helaModDir)) {
      let entryFile = path.join(helaModDir, 'index.hela');
      const manifestPath = path.join(helaModDir, 'hela.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          if (manifest.main || manifest.entry) {
            entryFile = path.resolve(helaModDir, manifest.main || manifest.entry);
          }
        } catch {}
      }
      if (fs.existsSync(entryFile)) {
        return this.loadModule(entryFile, loc, evaluator);
      }
    }

    // 2. Built-in SQLite Database Support: ගෙන්නන්න db "sqlite" ගෙන්;
    if (source === 'sqlite' || source === 'node:sqlite' || source === 'db') {
      try {
        const { DatabaseSync } = this.require('node:sqlite');
        const basePath = this.basePath;
        return {
          open: (filePath: string = ':memory:') => {
            const resolved = filePath === ':memory:' ? ':memory:' : path.resolve(basePath, filePath);
            const rawDb = new DatabaseSync(resolved);
            return {
              exec: (sql: string) => rawDb.exec(sql),
              run: (sql: string, params: any[] = []) => {
                const stmt = rawDb.prepare(sql);
                return stmt.run(...(Array.isArray(params) ? params : [params]));
              },
              query: (sql: string, params: any[] = []) => {
                const stmt = rawDb.prepare(sql);
                return stmt.all(...(Array.isArray(params) ? params : [params]));
              },
              get: (sql: string, params: any[] = []) => {
                const stmt = rawDb.prepare(sql);
                return stmt.get(...(Array.isArray(params) ? params : [params]));
              },
              close: () => rawDb.close(),
              // Sinhala Aliases
              ක්‍රියාත්මක: (sql: string) => rawDb.exec(sql),
              ඇතුළත්: (sql: string, params: any[] = []) => {
                const stmt = rawDb.prepare(sql);
                return stmt.run(...(Array.isArray(params) ? params : [params]));
              },
              සොයන්න: (sql: string, params: any[] = []) => {
                const stmt = rawDb.prepare(sql);
                return stmt.all(...(Array.isArray(params) ? params : [params]));
              },
              වසන්න: () => rawDb.close(),
              raw: rawDb,
            };
          },
          Database: DatabaseSync,
        };
      } catch (err: any) {
        throw new HelaError(
          `SQLite මොඩියුලය පූරණය කිරීමේදී දෝෂයක්: ${err.message}`,
          loc
        );
      }
    }

    // 3. Built-in Native File System Support: ගෙන්නන්න ගොනු "fs" ගෙන්;
    if (source === 'fs' || source === 'node:fs' || source === 'ගොනු') {
      return createFileSystemModule(this.basePath, loc);
    }

    // 4. Built-in HTTP Client & Web Server Support: ගෙන්නන්න api "http" ගෙන්; or "api"
    if (
      source === 'server' ||
      source === 'http' ||
      source === 'node:http' ||
      source === 'api' ||
      source === 'client' ||
      source === 'fetch'
    ) {
      const http = this.require('http');
      return createHttpClientModule(evaluator, http, loc);
    }

    // 4. Try loading as Node.js built-in or CommonJS / NPM module using require
    try {
      return this.require(source);
    } catch (reqErr: any) {
      // 3. Try loading via dynamic ESM import()
      try {
        let importTarget = source;
        if (source.startsWith('.') || source.startsWith('/')) {
          importTarget = path.isAbsolute(source)
            ? 'file://' + source
            : 'file://' + path.resolve(this.basePath, source);
        }
        const esmModule = await import(importTarget);
        return esmModule.default || esmModule;
      } catch (importErr: any) {
        throw new HelaError(
          SinhalaErrors.moduleNotFound(source),
          loc,
          undefined,
          `'${source}' නමින් Node.js මොඩියුලයක් හෝ npm පැකේජයක් ස්ථාපනය කර තිබේදැයි බලන්න. (${reqErr?.message || importErr?.message})`
        );
      }
    }
  }
}
