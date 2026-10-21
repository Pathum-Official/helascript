/**
 * HelaScript Node.js / NPM / Module Interoperability
 * Resolves and imports standard Node.js built-ins, NPM packages,
 * local JavaScript files, and other .hela modules.
 */

import { createRequire } from 'module';
import * as path from 'path';
import * as fs from 'fs';
import { HelaError, SinhalaErrors, SourceLocation } from '../diagnostics/error.js';

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

    // 2. Try loading as Node.js built-in or CommonJS / NPM module using require
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
