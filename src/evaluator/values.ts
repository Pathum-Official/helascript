/**
 * HelaScript Runtime Values and Control Flow Signals
 */

import { BlockStatement } from '../parser/ast.js';
import { Environment } from './environment.js';

export interface HelaCallable {
  isAsync: boolean;
  name?: string;
  call(evaluator: any, args: any[]): Promise<any>;
}

export class HelaFunction implements HelaCallable {
  public readonly name?: string;
  public readonly params: string[];
  public readonly body: BlockStatement;
  public readonly closure: Environment;
  public readonly isAsync: boolean;

  constructor(
    name: string | undefined,
    params: string[],
    body: BlockStatement,
    closure: Environment,
    isAsync: boolean = false
  ) {
    this.name = name;
    this.params = params;
    this.body = body;
    this.closure = closure;
    this.isAsync = isAsync;
  }

  public async call(evaluator: any, args: any[]): Promise<any> {
    const environment = this.closure.createChildScope();

    // Bind parameters
    for (let i = 0; i < this.params.length; i++) {
      const paramName = this.params[i];
      const argValue = i < args.length ? args[i] : null;
      environment.define(paramName, argValue, false);
    }

    try {
      await evaluator.executeBlock(this.body, environment);
    } catch (signal) {
      if (signal instanceof ReturnSignal) {
        return signal.value;
      }
      throw signal;
    }

    return null;
  }
}

export class HelaNativeFunction implements HelaCallable {
  public readonly name: string;
  public readonly fn: (...args: any[]) => any;
  public readonly isAsync: boolean;

  constructor(name: string, fn: (...args: any[]) => any, isAsync: boolean = false) {
    this.name = name;
    this.fn = fn;
    this.isAsync = isAsync;
  }

  public async call(_evaluator: any, args: any[]): Promise<any> {
    const result = this.fn(...args);
    if (result instanceof Promise) {
      return await result;
    }
    return result;
  }
}

export class ReturnSignal {
  public readonly value: any;
  constructor(value: any) {
    this.value = value;
  }
}

export class BreakSignal {}
export class ContinueSignal {}
