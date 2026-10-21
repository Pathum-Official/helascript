/**
 * HelaScript Diagnostics & Error Handling
 * Provides spoken Sinhala error messages with visual line/column context.
 */

export interface SourceLocation {
  line: number;
  column: number;
  file?: string;
}

export class HelaError extends Error {
  public readonly line: number;
  public readonly column: number;
  public readonly file?: string;
  public readonly sourceCode?: string;
  public readonly hint?: string;

  constructor(
    message: string,
    location: SourceLocation,
    sourceCode?: string,
    hint?: string
  ) {
    super(message);
    this.name = 'HelaError';
    this.line = location.line;
    this.column = location.column;
    this.file = location.file;
    this.sourceCode = sourceCode;
    this.hint = hint;

    // Maintain prototype chain
    Object.setPrototypeOf(this, HelaError.prototype);
  }

  public format(): string {
    const lines: string[] = [];
    const locationStr = `පේළිය: ${this.line}, තීරුව: ${this.column}${this.file ? ` (${this.file})` : ''}`;
    
    lines.push(`\n❌ [HelaScript දෝෂයකි] - ${locationStr}`);
    lines.push(`───────────────────────────────────────────────────────`);

    if (this.sourceCode) {
      const codeLines = this.sourceCode.split('\n');
      const startLine = Math.max(1, this.line - 2);
      const endLine = Math.min(codeLines.length, this.line + 2);

      for (let i = startLine; i <= endLine; i++) {
        const lineContent = codeLines[i - 1] ?? '';
        const lineNumStr = String(i).padStart(4, ' ');
        const isTarget = i === this.line;
        const prefix = isTarget ? ' > ' : '   ';

        lines.push(`${prefix}${lineNumStr} | ${lineContent}`);

        if (isTarget) {
          const indent = ' '.repeat(Math.max(0, this.column - 1));
          lines.push(`        | ${indent}^`);
        }
      }
      lines.push(`───────────────────────────────────────────────────────`);
    }

    lines.push(`වැරැද්ද: ${this.message}`);
    if (this.hint) {
      lines.push(`💡 උපදෙස: ${this.hint}`);
    }
    lines.push('');

    return lines.join('\n');
  }
}

/**
 * Standard spoken Sinhala error message helpers
 */
export const SinhalaErrors = {
  unexpectedChar: (char: string) => `හඳුනා නොගත් සළකුණක්: '${char}'`,
  unclosedString: () => `අකුරු පෙළ (string) නිසි පරිදි වසා නැත (තනි හෝ ද්විත්ව උද්ධෘත ලකුණක් අඩුය)`,
  unexpectedToken: (found: string, expected?: string) =>
    expected
      ? `'${expected}' බලාපොරොත්තු විය, නමුත් '${found}' හමු විය`
      : `නොසිතූ සළකුණක් හමුවුණා: '${found}'`,
  undefinedVariable: (name: string) =>
    `'${name}' නමින් විචල්‍යයක් (variable) අර්ථ දක්වා නැත`,
  constReassignment: (name: string) =>
    `'${name}' යනු වෙනස්නොවන (වෙනස්නොවන / const) අගයකි. එයට අලුතින් අගයක් පැවරිය නොහැක!`,
  variableAlreadyDeclared: (name: string) =>
    `'${name}' නමින් විචල්‍යයක් මෙම වපසරිය තුළ දැනටමත් පවතී`,
  notCallable: (name: string) =>
    `'${name}' යනු ක්‍රියාවක් (function) නොවේ. එය ඇමතිය නොහැක!`,
  invalidOperand: (op: string, left: string, right: string) =>
    `'${op}' ක්‍රියාව '${left}' සහ '${right}' අතර කළ නොහැක`,
  divisionByZero: () => `බිංදුවෙන් (0) බෙදිය නොහැක`,
  moduleNotFound: (mod: string) =>
    `'${mod}' නමින් මොඩියුලයක් සොයාගත නොහැකි විය. කරුණාකර නම නිවැරදිදැයි පරීක්ෂා කරන්න.`,
  cannotAwaitNonAsync: () =>
    `'ඉන්න' (await) භාවිත කළ හැක්කේ 'නොපෙනෙන' (async) වැඩක් තුළ පමණි`,
  invalidAssignmentTarget: () =>
    `අගයක් පැවරිය හැක්කේ විචල්‍යයකට හෝ වස්තුවක ගුණාංගයකට (property) පමණි`,
  missingCondition: () =>
    `කොන්දේසිය (condition) වරහන් තුළ ලබා දිය යුතුය`,
  expectedBlock: () =>
    `සඟල වරහනක් '{' සහිත කේත කොටසක් බලාපොරොත්තු විය`,
  unhandledException: (msg: string) =>
    `වැඩසටහන ක්‍රියාත්මක කිරීමේදී නොසිතූ දෝෂයක් හටගත්තා: ${msg}`,
};
