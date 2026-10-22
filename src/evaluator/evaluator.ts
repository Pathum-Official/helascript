/**
 * HelaScript AST Evaluator & Runtime
 * Executes Abstract Syntax Tree with lexical environments,
 * asynchronous flow, and Node.js interoperability.
 */

import { HelaError, SinhalaErrors, SourceLocation } from '../diagnostics/error.js';
import { Lexer } from '../lexer/lexer.js';
import {
  ArrayLiteral,
  AssignmentExpression,
  BinaryExpression,
  BlockStatement,
  CallExpression,
  Expression,
  ForInStatement,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  IfStatement,
  ImportStatement,
  Literal,
  LogicalExpression,
  MemberExpression,
  ObjectLiteral,
  Program,
  ReturnStatement,
  Statement,
  TryCatchStatement,
  UnaryExpression,
  VarDeclaration,
  WhileStatement,
  AwaitExpression,
} from '../parser/ast.js';
import { Parser } from '../parser/parser.js';
import { ModuleLoader } from '../interop/moduleLoader.js';
import { setupStandardLibrary } from '../stdlib/stdlib.js';
import { Environment } from './environment.js';
import {
  BreakSignal,
  ContinueSignal,
  HelaFunction,
  HelaNativeFunction,
  ReturnSignal,
} from './values.js';

export interface EvaluatorOptions {
  filePath?: string;
  sourceCode?: string;
  basePath?: string;
}

export class Evaluator {
  public readonly globalEnv: Environment;
  public readonly moduleLoader: ModuleLoader;
  private filePath?: string;
  private sourceCode?: string;

  constructor(options: EvaluatorOptions = {}) {
    this.filePath = options.filePath;
    this.sourceCode = options.sourceCode;
    this.globalEnv = new Environment(undefined, this.sourceCode);
    this.moduleLoader = new ModuleLoader(options.basePath);
    setupStandardLibrary(this.globalEnv);
  }

  public setSource(source: string, filePath?: string): void {
    this.sourceCode = source;
    this.filePath = filePath;
    this.globalEnv.setSourceCode(source);
    if (filePath) {
      const dir = filePath.includes('/')
        ? filePath.substring(0, filePath.lastIndexOf('/'))
        : filePath.includes('\\')
        ? filePath.substring(0, filePath.lastIndexOf('\\'))
        : process.cwd();
      this.moduleLoader.setBasePath(dir);
    }
  }

  /**
   * Run a parsed program AST
   */
  public async evaluateProgram(program: Program): Promise<any> {
    let lastResult: any = null;

    try {
      for (const stmt of program.statements) {
        lastResult = await this.executeStatement(stmt, this.globalEnv);
      }
    } catch (signal) {
      if (signal instanceof ReturnSignal) {
        return signal.value;
      }
      throw signal;
    }

    return lastResult;
  }

  /**
   * Run another .hela file as a module and return its environment
   */
  public async runModule(source: string, filePath: string): Promise<Environment> {
    const lexer = new Lexer(source, filePath);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, source, filePath);
    const program = parser.parse();

    const moduleEnv = new Environment(this.globalEnv, source);
    try {
      for (const stmt of program.statements) {
        await this.executeStatement(stmt, moduleEnv);
      }
    } catch (signal) {
      if (!(signal instanceof ReturnSignal)) {
        throw signal;
      }
    }

    return moduleEnv;
  }

  // ─────────────────────────────────────────────────────────────
  // Statement Execution
  // ─────────────────────────────────────────────────────────────

  public async executeStatement(stmt: Statement, env: Environment): Promise<any> {
    const loc: SourceLocation = {
      line: stmt.line,
      column: stmt.column,
      file: this.filePath,
    };

    switch (stmt.type) {
      case 'VarDeclaration': {
        const initVal = stmt.initializer
          ? await this.evaluate(stmt.initializer, env)
          : null;
        env.define(stmt.name, initVal, stmt.isConst, loc);
        return null;
      }

      case 'FunctionDeclaration': {
        const fn = new HelaFunction(
          stmt.name,
          stmt.params,
          stmt.body,
          env,
          stmt.isAsync
        );
        env.define(stmt.name, fn, true, loc);
        return null;
      }

      case 'IfStatement': {
        const condition = await this.evaluate(stmt.condition, env);
        if (this.isTruthy(condition)) {
          return await this.executeStatement(stmt.consequent, env);
        } else if (stmt.alternate) {
          return await this.executeStatement(stmt.alternate, env);
        }
        return null;
      }

      case 'WhileStatement': {
        let lastResult: any = null;
        while (this.isTruthy(await this.evaluate(stmt.condition, env))) {
          try {
            lastResult = await this.executeStatement(stmt.body, env);
          } catch (signal) {
            if (signal instanceof BreakSignal) {
              break;
            }
            if (signal instanceof ContinueSignal) {
              continue;
            }
            throw signal;
          }
        }
        return lastResult;
      }

      case 'ForStatement': {
        const loopEnv = env.createChildScope();
        if (stmt.init) {
          await this.executeStatement(stmt.init, loopEnv);
        }

        let lastResult: any = null;
        while (true) {
          if (stmt.condition) {
            const cond = await this.evaluate(stmt.condition, loopEnv);
            if (!this.isTruthy(cond)) break;
          }

          try {
            lastResult = await this.executeStatement(stmt.body, loopEnv);
          } catch (signal) {
            if (signal instanceof BreakSignal) {
              break;
            }
            if (signal instanceof ContinueSignal) {
              // fall through to update
            } else {
              throw signal;
            }
          }

          if (stmt.update) {
            await this.evaluate(stmt.update, loopEnv);
          }
        }
        return lastResult;
      }

      case 'ForInStatement': {
        const iterable = await this.evaluate(stmt.iterable, env);
        let items: any[] = [];

        if (Array.isArray(iterable)) {
          items = iterable;
        } else if (typeof iterable === 'string') {
          items = Array.from(iterable);
        } else if (iterable && typeof iterable === 'object') {
          items = Object.keys(iterable);
        } else {
          throw new HelaError(
            `'${typeof iterable}' අගයක් හරහා ලූපයක් (loop) ධාවනය කළ නොහැක`,
            loc,
            this.sourceCode
          );
        }

        let lastResult: any = null;
        for (const item of items) {
          const loopEnv = env.createChildScope();
          loopEnv.define(stmt.variable, item, stmt.isConst, loc);

          try {
            lastResult = await this.executeStatement(stmt.body, loopEnv);
          } catch (signal) {
            if (signal instanceof BreakSignal) {
              break;
            }
            if (signal instanceof ContinueSignal) {
              continue;
            }
            throw signal;
          }
        }
        return lastResult;
      }

      case 'BlockStatement': {
        return await this.executeBlock(stmt, env.createChildScope());
      }

      case 'ReturnStatement': {
        const val = stmt.argument
          ? await this.evaluate(stmt.argument, env)
          : null;
        throw new ReturnSignal(val);
      }

      case 'BreakStatement': {
        throw new BreakSignal();
      }

      case 'ContinueStatement': {
        throw new ContinueSignal();
      }

      case 'TryCatchStatement': {
        try {
          return await this.executeBlock(stmt.tryBlock, env.createChildScope());
        } catch (err: any) {
          if (err instanceof ReturnSignal || err instanceof BreakSignal || err instanceof ContinueSignal) {
            throw err;
          }
          const catchEnv = env.createChildScope();
          if (stmt.catchVar) {
            const errVal = err instanceof HelaError ? err.message : String(err?.message ?? err);
            catchEnv.define(stmt.catchVar, errVal, false, loc);
          }
          return await this.executeBlock(stmt.catchBlock, catchEnv);
        }
      }

      case 'ImportStatement': {
        const moduleVal = await this.moduleLoader.loadModule(
          stmt.source,
          loc,
          this
        );

        if (typeof stmt.importSpecifier === 'string') {
          env.define(stmt.importSpecifier, moduleVal, true, loc, true);
        } else if (Array.isArray(stmt.importSpecifier)) {
          for (const spec of stmt.importSpecifier) {
            const val = moduleVal ? moduleVal[spec] : undefined;
            env.define(spec, val, true, loc, true);
          }
        }
        return null;
      }

      case 'ExpressionStatement': {
        return await this.evaluate(stmt.expression, env);
      }

      default:
        throw new HelaError(
          `හඳුනා නොගත් ප්‍රකාශන වර්ගය: ${(stmt as any).type}`,
          loc,
          this.sourceCode
        );
    }
  }

  public async executeBlock(block: BlockStatement, env: Environment): Promise<any> {
    let lastResult: any = null;
    for (const stmt of block.statements) {
      lastResult = await this.executeStatement(stmt, env);
    }
    return lastResult;
  }

  // ─────────────────────────────────────────────────────────────
  // Expression Evaluation
  // ─────────────────────────────────────────────────────────────

  public async evaluate(expr: Expression, env: Environment): Promise<any> {
    const loc: SourceLocation = {
      line: expr.line,
      column: expr.column,
      file: this.filePath,
    };

    switch (expr.type) {
      case 'Literal':
        return expr.value;

      case 'Identifier':
        return env.get(expr.name, loc);

      case 'BinaryExpression': {
        const left = await this.evaluate(expr.left, env);
        const right = await this.evaluate(expr.right, env);

        switch (expr.operator) {
          case '+':
            if (typeof left === 'string' || typeof right === 'string') {
              return String(left) + String(right);
            }
            return Number(left) + Number(right);

          case '-':
            return Number(left) - Number(right);

          case '*':
            return Number(left) * Number(right);

          case '/':
            if (Number(right) === 0) {
              throw new HelaError(
                SinhalaErrors.divisionByZero(),
                loc,
                this.sourceCode
              );
            }
            return Number(left) / Number(right);

          case '%':
            return Number(left) % Number(right);

          case '==':
            return left === right;

          case '!=':
            return left !== right;

          case '<':
            return left < right;

          case '<=':
            return left <= right;

          case '>':
            return left > right;

          case '>=':
            return left >= right;

          default:
            throw new HelaError(
              `හඳුනා නොගත් ගණිත ක්‍රියාව: '${expr.operator}'`,
              loc,
              this.sourceCode
            );
        }
      }

      case 'UnaryExpression': {
        const arg = await this.evaluate(expr.argument, env);
        if (expr.operator === '!' || expr.operator === 'නැත') {
          return !this.isTruthy(arg);
        }
        if (expr.operator === '-') {
          return -Number(arg);
        }
        if (expr.operator === '+') {
          return +Number(arg);
        }
        throw new HelaError(
          `හඳුනා නොගත් ඒකීය ක්‍රියාව: '${expr.operator}'`,
          loc,
          this.sourceCode
        );
      }

      case 'LogicalExpression': {
        const left = await this.evaluate(expr.left, env);

        if (expr.operator === '||' || expr.operator === 'හෝ') {
          if (this.isTruthy(left)) return left;
          return await this.evaluate(expr.right, env);
        }

        if (expr.operator === '&&' || expr.operator === 'සහ') {
          if (!this.isTruthy(left)) return left;
          return await this.evaluate(expr.right, env);
        }

        throw new HelaError(
          `හඳුනා නොගත් තාර්කික ක්‍රියාව: '${expr.operator}'`,
          loc,
          this.sourceCode
        );
      }

      case 'AssignmentExpression': {
        const value = await this.evaluate(expr.right, env);

        if (expr.left.type === 'Identifier') {
          let finalVal = value;
          if (expr.operator !== '=') {
            const current = env.get(expr.left.name, loc);
            if (expr.operator === '+=') finalVal = current + value;
            else if (expr.operator === '-=') finalVal = current - value;
            else if (expr.operator === '*=') finalVal = current * value;
            else if (expr.operator === '/=') finalVal = current / value;
          }
          env.assign(expr.left.name, finalVal, loc);
          return finalVal;
        }

        if (expr.left.type === 'MemberExpression') {
          const targetObj = await this.evaluate(expr.left.object, env);
          const propKey = expr.left.computed
            ? await this.evaluate(expr.left.property, env)
            : (expr.left.property as Identifier).name;

          if (targetObj === null || targetObj === undefined) {
            throw new HelaError(
              `හිස් (null) අගයකට ගුණාංග පැවරිය නොහැක`,
              loc,
              this.sourceCode
            );
          }

          let finalVal = value;
          if (expr.operator !== '=') {
            const current = targetObj[propKey];
            if (expr.operator === '+=') finalVal = current + value;
            else if (expr.operator === '-=') finalVal = current - value;
            else if (expr.operator === '*=') finalVal = current * value;
            else if (expr.operator === '/=') finalVal = current / value;
          }

          targetObj[propKey] = finalVal;
          return finalVal;
        }

        throw new HelaError(
          SinhalaErrors.invalidAssignmentTarget(),
          loc,
          this.sourceCode
        );
      }

      case 'CallExpression': {
        let callee: any;
        let thisContext: any = null;

        if (expr.callee.type === 'MemberExpression') {
          const memberExpr = expr.callee;
          thisContext = await this.evaluate(memberExpr.object, env);
          const propKey = memberExpr.computed
            ? await this.evaluate(memberExpr.property, env)
            : (memberExpr.property as Identifier).name;

          if (thisContext === null || thisContext === undefined) {
            throw new HelaError(
              `හිස් (null) අගයකින් '${propKey}' ක්‍රියාව කැඳවිය නොහැක`,
              loc,
              this.sourceCode
            );
          }

          callee = thisContext[propKey];
        } else {
          callee = await this.evaluate(expr.callee, env);
        }

        const args: any[] = [];
        for (const argExpr of expr.arguments) {
          args.push(await this.evaluate(argExpr, env));
        }

        if (callee instanceof HelaFunction || callee instanceof HelaNativeFunction) {
          return await callee.call(this, args);
        }

        if (typeof callee === 'function') {
          // Native JavaScript function (e.g. from Node.js module like fs.readFileSync)
          try {
            const result = callee.apply(thisContext, args);
            if (result instanceof Promise) {
              return await result;
            }
            return result;
          } catch (callErr: any) {
            if (callErr instanceof HelaError) {
              throw callErr;
            }
            throw new HelaError(
              `කාර්යය ඉටුකිරීමේදී ගැටළුවක්: ${callErr.message}`,
              loc,
              this.sourceCode
            );
          }
        }

        const calleeName =
          expr.callee.type === 'Identifier'
            ? expr.callee.name
            : expr.callee.type === 'MemberExpression'
            ? (expr.callee.property as Identifier).name || 'property'
            : 'expression';

        throw new HelaError(
          SinhalaErrors.notCallable(calleeName),
          loc,
          this.sourceCode
        );
      }

      case 'MemberExpression': {
        const obj = await this.evaluate(expr.object, env);
        if (obj === null || obj === undefined) {
          throw new HelaError(
            `හිස් (null) අගයකින් ගුණාංග ලබා ගත නොහැක`,
            loc,
            this.sourceCode
          );
        }

        const prop = expr.computed
          ? await this.evaluate(expr.property, env)
          : (expr.property as Identifier).name;

        // Support Sinhala length alias if array or string
        if (prop === 'දිග' && (Array.isArray(obj) || typeof obj === 'string')) {
          return obj.length;
        }

        return obj[prop];
      }

      case 'ArrayLiteral': {
        const elements: any[] = [];
        for (const el of expr.elements) {
          elements.push(await this.evaluate(el, env));
        }
        return elements;
      }

      case 'ObjectLiteral': {
        const obj: Record<string, any> = {};
        for (const prop of expr.properties) {
          obj[prop.key] = await this.evaluate(prop.value, env);
        }
        return obj;
      }

      case 'AwaitExpression': {
        const val = await this.evaluate(expr.argument, env);
        if (val instanceof Promise) {
          return await val;
        }
        return val;
      }

      case 'FunctionExpression': {
        return new HelaFunction(
          expr.name,
          expr.params,
          expr.body,
          env,
          expr.isAsync
        );
      }

      default:
        throw new HelaError(
          `හඳුනා නොගත් ප්‍රකාශනය: ${(expr as any).type}`,
          loc,
          this.sourceCode
        );
    }
  }

  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0 && !isNaN(value);
    if (typeof value === 'string') return value.length > 0;
    return true;
  }
}
