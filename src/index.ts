/**
 * HelaScript (.hela) Engine
 * A modern, spoken-Sinhala programming language engine.
 */

import * as fs from 'fs';
import * as path from 'path';
import { HelaError } from './diagnostics/error.js';
import { Evaluator, EvaluatorOptions } from './evaluator/evaluator.js';
import { Lexer } from './lexer/lexer.js';
import { Token, TokenType } from './lexer/token.js';
import { Program } from './parser/ast.js';
import { Parser } from './parser/parser.js';

export * from './diagnostics/error.js';
export * from './evaluator/environment.js';
export * from './evaluator/evaluator.js';
export * from './evaluator/values.js';
export * from './interop/moduleLoader.js';
export * from './lexer/lexer.js';
export * from './lexer/token.js';
export * from './parser/ast.js';
export * from './parser/parser.js';
export * from './stdlib/stdlib.js';
export * from './lsp/protocol.js';
export * from './lsp/lspService.js';
export * from './lsp/server.js';

export interface HelaRunOptions extends EvaluatorOptions {
  printErrors?: boolean;
}

/**
 * Tokenize source code into HelaScript tokens
 */
export function tokenize(source: string, filePath?: string): Token[] {
  const lexer = new Lexer(source, filePath);
  return lexer.tokenize();
}

/**
 * Parse source code into an AST Program
 */
export function parse(source: string, filePath?: string): Program {
  const tokens = tokenize(source, filePath);
  const parser = new Parser(tokens, source, filePath);
  return parser.parse();
}

/**
 * Execute HelaScript code directly
 */
export async function run(
  source: string,
  options: HelaRunOptions = {}
): Promise<any> {
  const evaluator = new Evaluator(options);
  evaluator.setSource(source, options.filePath);

  try {
    const program = parse(source, options.filePath);
    return await evaluator.evaluateProgram(program);
  } catch (err: any) {
    if (options.printErrors !== false && err instanceof HelaError) {
      console.error(err.format());
    }
    throw err;
  }
}

/**
 * Execute a .hela file
 */
export async function runFile(
  filePath: string,
  options: HelaRunOptions = {}
): Promise<any> {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new HelaError(
      `'${filePath}' ගොනුව සොයාගත නොහැකි විය`,
      { line: 1, column: 1, file: filePath },
      undefined,
      `ගොනු මාර්ගය (file path) නිවැරදිදැයි පරීක්ෂා කරන්න.`
    );
  }

  const source = fs.readFileSync(absolutePath, 'utf-8');
  return await run(source, {
    ...options,
    filePath: absolutePath,
    basePath: path.dirname(absolutePath),
  });
}
