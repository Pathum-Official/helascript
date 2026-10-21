/**
 * HelaScript Lexical Scope & Environment
 * Handles variable storage, lexical scoping, const immutability,
 * and spoken Sinhala error reporting.
 */

import { HelaError, SinhalaErrors, SourceLocation } from '../diagnostics/error.js';

interface VariableBinding {
  value: any;
  isConst: boolean;
}

export class Environment {
  private readonly bindings: Map<string, VariableBinding> = new Map();
  public readonly parent?: Environment;
  private sourceCode?: string;

  constructor(parent?: Environment, sourceCode?: string) {
    this.parent = parent;
    this.sourceCode = sourceCode ?? parent?.sourceCode;
  }

  public setSourceCode(source: string): void {
    this.sourceCode = source;
  }

  /**
   * Define a new variable in the current scope
   */
  public define(
    name: string,
    value: any,
    isConst: boolean = false,
    loc?: SourceLocation
  ): void {
    if (this.bindings.has(name)) {
      throw new HelaError(
        SinhalaErrors.variableAlreadyDeclared(name),
        loc ?? { line: 1, column: 1 },
        this.sourceCode,
        `වෙනත් නමක් භාවිතා කරන්න, නැතහොත් නව අගයක් පැවරීම (assignment) පමණක් සිදු කරන්න.`
      );
    }
    this.bindings.set(name, { value, isConst });
  }

  /**
   * Assign an existing variable in this scope or parent scopes
   */
  public assign(name: string, value: any, loc?: SourceLocation): void {
    if (this.bindings.has(name)) {
      const binding = this.bindings.get(name)!;
      if (binding.isConst) {
        throw new HelaError(
          SinhalaErrors.constReassignment(name),
          loc ?? { line: 1, column: 1 },
          this.sourceCode,
          `'වෙනස්නොවන' ලෙස නම් කළ විචල්‍යයන්ගේ අගය වෙනස් කළ නොහැක. අගය වෙනස් කිරීමට අවශ්‍ය නම් 'දාන්න' යොදන්න.`
        );
      }
      binding.value = value;
      return;
    }

    if (this.parent) {
      this.parent.assign(name, value, loc);
      return;
    }

    throw new HelaError(
      SinhalaErrors.undefinedVariable(name),
      loc ?? { line: 1, column: 1 },
      this.sourceCode,
      `පළමුව 'දාන්න ${name} = ...' ලෙස විචල්‍යය ප්‍රකාශයට පත් කරන්න.`
    );
  }

  /**
   * Retrieve variable value from this scope or parent scopes
   */
  public get(name: string, loc?: SourceLocation): any {
    if (this.bindings.has(name)) {
      return this.bindings.get(name)!.value;
    }

    if (this.parent) {
      return this.parent.get(name, loc);
    }

    throw new HelaError(
      SinhalaErrors.undefinedVariable(name),
      loc ?? { line: 1, column: 1 },
      this.sourceCode,
      `විචල්‍යයේ නම නිවැරදිදැයි බලන්න. ('${name}')`
    );
  }

  /**
   * Check if a variable exists in current or any parent scope
   */
  public has(name: string): boolean {
    if (this.bindings.has(name)) {
      return true;
    }
    if (this.parent) {
      return this.parent.has(name);
    }
    return false;
  }

  /**
   * Create an enclosed child environment
   */
  public createChildScope(): Environment {
    return new Environment(this, this.sourceCode);
  }

  /**
   * Return all bindings in this environment as a plain JS object (for module exports)
   */
  public getExports(): Record<string, any> {
    const exportsObj: Record<string, any> = {};
    for (const [key, binding] of this.bindings.entries()) {
      exportsObj[key] = binding.value;
    }
    return exportsObj;
  }
}
