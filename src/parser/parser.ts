/**
 * HelaScript Recursive Descent Parser
 * Parses tokens into an Abstract Syntax Tree (AST) with precedence climbing
 * and spoken Sinhala error reporting.
 */

import { HelaError, SinhalaErrors } from '../diagnostics/error.js';
import { Token, TokenType } from '../lexer/token.js';
import {
  ArrayLiteral,
  AssignmentExpression,
  BinaryExpression,
  BlockStatement,
  BreakStatement,
  CallExpression,
  ContinueStatement,
  Expression,
  ExpressionStatement,
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
  ObjectProperty,
  Program,
  ReturnStatement,
  Statement,
  TryCatchStatement,
  ThrowStatement,
  UnaryExpression,
  VarDeclaration,
  WhileStatement,
  AwaitExpression,
} from './ast.js';

export class Parser {
  private readonly tokens: Token[];
  private readonly source?: string;
  private readonly filePath?: string;
  private current: number = 0;

  constructor(tokens: Token[], source?: string, filePath?: string) {
    this.tokens = tokens;
    this.source = source;
    this.filePath = filePath;
  }

  public parse(): Program {
    const statements: Statement[] = [];
    const startToken = this.peek();

    while (!this.isAtEnd()) {
      // Skip redundant semicolons
      if (this.match(TokenType.SEMICOLON)) {
        continue;
      }
      statements.push(this.parseStatement());
    }

    return {
      type: 'Program',
      statements,
      line: startToken.line,
      column: startToken.column,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Statements
  // ─────────────────────────────────────────────────────────────

  private parseStatement(): Statement {
    // Variable Declaration: 'දාන්න' (let) or 'වෙනස්නොවන' (const)
    if (this.match(TokenType.DAANNA)) {
      return this.parseVarDeclaration(false);
    }
    if (this.match(TokenType.VENAS_NOVANA)) {
      return this.parseVarDeclaration(true);
    }

    // Function Declaration: 'වැඩේ' or 'නොපෙනෙන වැඩේ'
    if (this.check(TokenType.NOPENENA) && this.checkNext(TokenType.WADE)) {
      this.advance(); // consume 'නොපෙනෙන'
      this.advance(); // consume 'වැඩේ'
      return this.parseFunctionDeclaration(true);
    }
    if (this.match(TokenType.WADE)) {
      // Check if async keyword follows: 'වැඩේ නොපෙනෙන ...'
      let isAsync = false;
      if (this.match(TokenType.NOPENENA)) {
        isAsync = true;
      }
      return this.parseFunctionDeclaration(isAsync);
    }

    // If Statement: 'ඉදින්'
    if (this.match(TokenType.IDIN)) {
      return this.parseIfStatement();
    }

    // While Statement: 'කියනකල්'
    if (this.match(TokenType.KIYANAKAL)) {
      return this.parseWhileStatement();
    }

    // For Statement: 'හැම'
    if (this.match(TokenType.HAMA)) {
      return this.parseForStatement();
    }

    // Return Statement: 'යවන්න'
    if (this.match(TokenType.YAVANNA)) {
      return this.parseReturnStatement();
    }

    // Break Statement: 'නවත්වන්න' / 'බිඳින්න'
    if (this.match(TokenType.BINDINNA)) {
      const token = this.previous();
      this.consumeOptionalSemicolon();
      return {
        type: 'BreakStatement',
        line: token.line,
        column: token.column,
      };
    }

    // Continue Statement: 'ඊළඟ' / 'ඉදිරියට'
    if (this.match(TokenType.EELANGA)) {
      const token = this.previous();
      this.consumeOptionalSemicolon();
      return {
        type: 'ContinueStatement',
        line: token.line,
        column: token.column,
      };
    }

    // Try-Catch: 'උත්සාහ' ... 'අල්ලන්න'
    if (this.match(TokenType.UTSAHA)) {
      return this.parseTryCatchStatement();
    }

    // Throw: 'විසිකරන්න' / 'විසි_කරන්න'
    if (this.match(TokenType.VISIKARANNA)) {
      return this.parseThrowStatement();
    }

    // Import: 'ගෙන්නන්න'
    if (this.match(TokenType.GENNANNNA)) {
      return this.parseImportStatement();
    }

    // Block Statement: '{'
    if (this.check(TokenType.LBRACE)) {
      return this.parseBlockStatement();
    }

    // Expression Statement
    return this.parseExpressionStatement();
  }

  private parseVarDeclaration(isConst: boolean): VarDeclaration {
    const token = this.previous();
    const nameToken = this.consume(
      TokenType.IDENTIFIER,
      `විචල්‍යයේ නම (variable name) බලාපොරොත්තු විය`
    );

    let initializer: Expression | undefined = undefined;
    if (this.match(TokenType.ASSIGN)) {
      initializer = this.parseExpression();
    } else if (isConst) {
      throw new HelaError(
        `වෙනස්නොවන (const) විචල්‍යයන් සඳහා ආරම්භක අගයක් (initial value) අනිවාර්ය වේ`,
        { line: token.line, column: token.column, file: this.filePath },
        this.source
      );
    }

    this.consumeOptionalSemicolon();

    return {
      type: 'VarDeclaration',
      name: nameToken.value,
      isConst,
      initializer,
      line: token.line,
      column: token.column,
    };
  }

  private parseFunctionDeclaration(isAsync: boolean): FunctionDeclaration {
    const token = this.previous();
    const nameToken = this.consume(
      TokenType.IDENTIFIER,
      `වැඩේ (function) සඳහා නමක් ලබා දිය යුතුය`
    );

    this.consume(TokenType.LPAREN, `'(' වරහන බලාපොරොත්තු විය`);
    const params: string[] = [];

    if (!this.check(TokenType.RPAREN)) {
      do {
        const paramToken = this.consume(
          TokenType.IDENTIFIER,
          `පරාමිතියක් (parameter) සඳහා නමක් බලාපොරොත්තු විය`
        );
        params.push(paramToken.value);
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, `')' වරහන බලාපොරොත්තු විය`);
    const body = this.parseBlockStatement();

    return {
      type: 'FunctionDeclaration',
      name: nameToken.value,
      params,
      body,
      isAsync,
      line: token.line,
      column: token.column,
    };
  }

  private parseIfStatement(): IfStatement {
    const token = this.previous();
    const hasParen = this.match(TokenType.LPAREN);
    const condition = this.parseExpression();
    if (hasParen) {
      this.consume(TokenType.RPAREN, `කොන්දේසිය අවසානයේ ')' වරහන බලාපොරොත්තු විය`);
    }

    const consequent = this.parseStatement();
    let alternate: Statement | undefined = undefined;

    // 'නැත්තම්' (else) or 'නැත්තම් ඉදින්' (else if)
    if (this.match(TokenType.NATTAM)) {
      if (this.match(TokenType.IDIN)) {
        alternate = this.parseIfStatement();
      } else {
        alternate = this.parseStatement();
      }
    }

    return {
      type: 'IfStatement',
      condition,
      consequent,
      alternate,
      line: token.line,
      column: token.column,
    };
  }

  private parseWhileStatement(): WhileStatement {
    const token = this.previous();
    const hasParen = this.match(TokenType.LPAREN);
    const condition = this.parseExpression();
    if (hasParen) {
      this.consume(TokenType.RPAREN, `කොන්දේසිය අවසානයේ ')' වරහන බලාපොරොත්තු විය`);
    }

    const body = this.parseStatement();

    return {
      type: 'WhileStatement',
      condition,
      body,
      line: token.line,
      column: token.column,
    };
  }

  private parseForStatement(): Statement {
    const token = this.previous();
    const hasParen = this.match(TokenType.LPAREN);

    // Check for for-in style: හැම (දාන්න x ගෙන් ලැයිස්තුව)
    if (this.check(TokenType.DAANNA) || this.check(TokenType.VENAS_NOVANA)) {
      const isConst = this.advance().type === TokenType.VENAS_NOVANA;
      const varName = this.consume(
        TokenType.IDENTIFIER,
        `විචල්‍යයේ නම බලාපොරොත්තු විය`
      ).value;

      // Check if followed by 'ගෙන්' (from/in)
      if (this.match(TokenType.GEN)) {
        const iterable = this.parseExpression();
        if (hasParen) {
          this.consume(TokenType.RPAREN, `')' වරහන බලාපොරොත්තු විය`);
        }
        const body = this.parseStatement();
        return {
          type: 'ForInStatement',
          variable: varName,
          isConst,
          iterable,
          body,
          line: token.line,
          column: token.column,
        };
      } else {
        // Standard C-style for loop starting with variable declaration:
        // හැම (දාන්න i = 0; i < 5; i = i + 1)
        let initializer: Expression | undefined = undefined;
        if (this.match(TokenType.ASSIGN)) {
          initializer = this.parseExpression();
        }
        this.consume(TokenType.SEMICOLON, `';' සළකුණ බලාපොරොත්තු විය`);

        let condition: Expression | undefined = undefined;
        if (!this.check(TokenType.SEMICOLON)) {
          condition = this.parseExpression();
        }
        this.consume(TokenType.SEMICOLON, `';' සළකුණ බලාපොරොත්තු විය`);

        let update: Expression | undefined = undefined;
        if (!this.check(TokenType.RPAREN)) {
          update = this.parseExpression();
        }

        if (hasParen) {
          this.consume(TokenType.RPAREN, `')' වරහන බලාපොරොත්තු විය`);
        }

        const body = this.parseStatement();

        return {
          type: 'ForStatement',
          init: {
            type: 'VarDeclaration',
            name: varName,
            isConst,
            initializer,
            line: token.line,
            column: token.column,
          },
          condition,
          update,
          body,
          line: token.line,
          column: token.column,
        };
      }
    }

    // Standard C-style for without variable keyword: හැම (i = 0; i < 5; i = i + 1)
    let init: Statement | undefined = undefined;
    if (!this.match(TokenType.SEMICOLON)) {
      init = this.parseExpressionStatement();
    }

    let condition: Expression | undefined = undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.parseExpression();
    }
    this.consume(TokenType.SEMICOLON, `';' සළකුණ බලාපොරොත්තු විය`);

    let update: Expression | undefined = undefined;
    if (!this.check(TokenType.RPAREN)) {
      update = this.parseExpression();
    }

    if (hasParen) {
      this.consume(TokenType.RPAREN, `')' වරහන බලාපොරොත්තු විය`);
    }

    const body = this.parseStatement();

    return {
      type: 'ForStatement',
      init,
      condition,
      update,
      body,
      line: token.line,
      column: token.column,
    };
  }

  private parseReturnStatement(): ReturnStatement {
    const token = this.previous();
    let argument: Expression | undefined = undefined;

    // Check if next token could be an expression
    if (!this.check(TokenType.SEMICOLON) && !this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      argument = this.parseExpression();
    }

    this.consumeOptionalSemicolon();

    return {
      type: 'ReturnStatement',
      argument,
      line: token.line,
      column: token.column,
    };
  }

  private parseTryCatchStatement(): TryCatchStatement {
    const token = this.previous();
    // Allow optional 'කරන්න' after 'උත්සාහ'
    if (this.check(TokenType.IDENTIFIER) && this.peek().value === 'කරන්න') {
      this.advance();
    }
    const tryBlock = this.parseBlockStatement();

    this.consume(TokenType.ALLANNA, `'අල්ලන්න' හෝ 'අල්ලාගන්න' (catch) කොටස බලාපොරොත්තු විය`);

    let catchVar: string | undefined = undefined;
    if (this.match(TokenType.LPAREN)) {
      const varToken = this.consume(
        TokenType.IDENTIFIER,
        `දෝෂය සඳහා විචල්‍ය නමක් බලාපොරොත්තු විය`
      );
      catchVar = varToken.value;
      this.consume(TokenType.RPAREN, `')' වරහන බලාපොරොත්තු විය`);
    }

    const catchBlock = this.parseBlockStatement();

    return {
      type: 'TryCatchStatement',
      tryBlock,
      catchVar,
      catchBlock,
      line: token.line,
      column: token.column,
    };
  }

  private parseThrowStatement(): ThrowStatement {
    const token = this.previous();
    const argument = this.parseExpression();
    this.consumeOptionalSemicolon();
    return {
      type: 'ThrowStatement',
      argument,
      line: token.line,
      column: token.column,
    };
  }

  /**
   * Import syntax:
   * ගෙන්නන්න fs "fs" ගෙන්;
   * ගෙන්නන්න fs "fs";
   * ගෙන්නන්න { readFile, writeFile } "fs" ගෙන්;
   */
  private parseImportStatement(): ImportStatement {
    const token = this.previous();
    let importSpecifier: string | string[];

    if (this.match(TokenType.LBRACE)) {
      // Named imports: { a, b }
      const names: string[] = [];
      do {
        const nameToken = this.consume(
          TokenType.IDENTIFIER,
          `මොඩියුලයෙන් ලබාගන්නා අගයේ නම බලාපොරොත්තු විය`
        );
        names.push(nameToken.value);
      } while (this.match(TokenType.COMMA));

      this.consume(TokenType.RBRACE, `'}' වරහන බලාපොරොත්තු විය`);
      importSpecifier = names;
    } else {
      const nameToken = this.consume(
        TokenType.IDENTIFIER,
        `මොඩියුලය හැඳින්වීමට නමක් (identifier) බලාපොරොත්තු විය`
      );
      importSpecifier = nameToken.value;
    }

    // Source string (e.g. "fs", "path", "./myModule.hela")
    const sourceToken = this.consume(
      TokenType.STRING,
      `මොඩියුලයේ නම (string) උද්ධෘත ලකුණු තුළ බලාපොරොත්තු විය`
    );

    // Optional 'ගෙන්' (from)
    this.match(TokenType.GEN);

    this.consumeOptionalSemicolon();

    return {
      type: 'ImportStatement',
      importSpecifier,
      source: sourceToken.literal ?? sourceToken.value,
      line: token.line,
      column: token.column,
    };
  }

  private parseBlockStatement(): BlockStatement {
    const token = this.consume(TokenType.LBRACE, SinhalaErrors.expectedBlock());
    const statements: Statement[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.SEMICOLON)) continue;
      statements.push(this.parseStatement());
    }

    this.consume(TokenType.RBRACE, `'}' වරහන බලාපොරොත්තු විය`);

    return {
      type: 'BlockStatement',
      statements,
      line: token.line,
      column: token.column,
    };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expr = this.parseExpression();
    this.consumeOptionalSemicolon();
    return {
      type: 'ExpressionStatement',
      expression: expr,
      line: expr.line,
      column: expr.column,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Expressions (Precedence Climbing / Pratt Parsing)
  // ─────────────────────────────────────────────────────────────

  public parseExpression(): Expression {
    return this.parseAssignment();
  }

  private parseAssignment(): Expression {
    const expr = this.parseLogicalOr();

    if (
      this.match(
        TokenType.ASSIGN,
        TokenType.PLUS_ASSIGN,
        TokenType.MINUS_ASSIGN,
        TokenType.STAR_ASSIGN,
        TokenType.SLASH_ASSIGN
      )
    ) {
      const opToken = this.previous();
      const value = this.parseAssignment();

      if (expr.type === 'Identifier' || expr.type === 'MemberExpression') {
        return {
          type: 'AssignmentExpression',
          operator: opToken.value,
          left: expr,
          right: value,
          line: opToken.line,
          column: opToken.column,
        };
      }

      throw new HelaError(
        SinhalaErrors.invalidAssignmentTarget(),
        { line: opToken.line, column: opToken.column, file: this.filePath },
        this.source
      );
    }

    return expr;
  }

  private parseLogicalOr(): Expression {
    let expr = this.parseLogicalAnd();

    while (this.match(TokenType.OR)) {
      const opToken = this.previous();
      const right = this.parseLogicalAnd();
      expr = {
        type: 'LogicalExpression',
        operator: opToken.value,
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      };
    }

    return expr;
  }

  private parseLogicalAnd(): Expression {
    let expr = this.parseEquality();

    while (this.match(TokenType.AND)) {
      const opToken = this.previous();
      const right = this.parseEquality();
      expr = {
        type: 'LogicalExpression',
        operator: opToken.value,
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      };
    }

    return expr;
  }

  private parseEquality(): Expression {
    let expr = this.parseRelational();

    while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
      const opToken = this.previous();
      const right = this.parseRelational();
      expr = {
        type: 'BinaryExpression',
        operator: opToken.value,
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      };
    }

    return expr;
  }

  private parseRelational(): Expression {
    let expr = this.parseAdditive();

    while (
      this.match(
        TokenType.LESS,
        TokenType.LESS_EQUAL,
        TokenType.GREATER,
        TokenType.GREATER_EQUAL
      )
    ) {
      const opToken = this.previous();
      const right = this.parseAdditive();
      expr = {
        type: 'BinaryExpression',
        operator: opToken.value,
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      };
    }

    return expr;
  }

  private parseAdditive(): Expression {
    let expr = this.parseMultiplicative();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const opToken = this.previous();
      const right = this.parseMultiplicative();
      expr = {
        type: 'BinaryExpression',
        operator: opToken.value,
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      };
    }

    return expr;
  }

  private parseMultiplicative(): Expression {
    let expr = this.parseUnary();

    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const opToken = this.previous();
      const right = this.parseUnary();
      expr = {
        type: 'BinaryExpression',
        operator: opToken.value,
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      };
    }

    return expr;
  }

  private parseUnary(): Expression {
    if (this.match(TokenType.NOT, TokenType.MINUS, TokenType.PLUS)) {
      const opToken = this.previous();
      const argument = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator: opToken.value,
        argument,
        prefix: true,
        line: opToken.line,
        column: opToken.column,
      };
    }

    // Await expression: 'ඉන්න'
    if (this.match(TokenType.INNA)) {
      const token = this.previous();
      const argument = this.parseUnary();
      return {
        type: 'AwaitExpression',
        argument,
        line: token.line,
        column: token.column,
      };
    }

    return this.parseCallAndMember();
  }

  private parseCallAndMember(): Expression {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match(TokenType.LPAREN)) {
        // Function call: expr(...)
        const lparen = this.previous();
        const args: Expression[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, `')' වරහන බලාපොරොත්තු විය`);
        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: args,
          line: lparen.line,
          column: lparen.column,
        };
      } else if (this.match(TokenType.DOT)) {
        // Dot member access: expr.prop (allow identifiers or keywords like යවන්න)
        const dotToken = this.previous();
        let propName: string;
        if (this.isPropertyOrKeyword(this.peek())) {
          this.advance();
          propName = this.previous().value;
        } else {
          throw new HelaError(
            `ගුණාංගයේ (property) නම බලාපොරොත්තු විය`,
            { line: this.peek().line, column: this.peek().column, file: this.filePath },
            this.source
          );
        }
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: {
            type: 'Identifier',
            name: propName,
            line: dotToken.line,
            column: dotToken.column,
          },
          computed: false,
          line: dotToken.line,
          column: dotToken.column,
        };
      } else if (this.match(TokenType.LBRACKET)) {
        // Bracket member access: expr[prop]
        const bracketToken = this.previous();
        const property = this.parseExpression();
        this.consume(TokenType.RBRACKET, `']' වරහන බලාපොරොත්තු විය`);
        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          computed: true,
          line: bracketToken.line,
          column: bracketToken.column,
        };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): Expression {
    const token = this.peek();

    // Literals
    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      const prev = this.previous();
      return {
        type: 'Literal',
        value: prev.literal,
        raw: prev.value,
        line: prev.line,
        column: prev.column,
      };
    }

    // Booleans and Null
    if (this.match(TokenType.ATTA, TokenType.BORU, TokenType.HIS)) {
      const prev = this.previous();
      return {
        type: 'Literal',
        value: prev.literal,
        raw: prev.value,
        line: prev.line,
        column: prev.column,
      };
    }

    // Identifier
    if (this.match(TokenType.IDENTIFIER)) {
      const prev = this.previous();
      return {
        type: 'Identifier',
        name: prev.value,
        line: prev.line,
        column: prev.column,
      };
    }

    // Array Literal: [a, b, c]
    if (this.match(TokenType.LBRACKET)) {
      const startToken = this.previous();
      const elements: Expression[] = [];

      if (!this.check(TokenType.RBRACKET)) {
        do {
          if (this.check(TokenType.RBRACKET)) break;
          elements.push(this.parseExpression());
        } while (this.match(TokenType.COMMA));
      }

      this.consume(TokenType.RBRACKET, `']' වරහන බලාපොරොත්තු විය`);

      return {
        type: 'ArrayLiteral',
        elements,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Object Literal: { key: value, ... }
    if (this.match(TokenType.LBRACE)) {
      const startToken = this.previous();
      const properties: ObjectProperty[] = [];

      if (!this.check(TokenType.RBRACE)) {
        do {
          if (this.check(TokenType.RBRACE)) break;

          let key: string;
          if (this.match(TokenType.STRING)) {
            key = this.previous().literal;
          } else if (this.isPropertyOrKeyword(this.peek())) {
            this.advance();
            key = this.previous().value;
          } else {
            throw new HelaError(
              `වස්තුවේ යතුර (object key) සඳහා නමක් හෝ string එකක් බලාපොරොත්තු විය`,
              { line: this.peek().line, column: this.peek().column, file: this.filePath },
              this.source
            );
          }

          this.consume(TokenType.COLON, `':' සළකුණ බලාපොරොත්තු විය`);
          const value = this.parseExpression();

          properties.push({ key, value });
        } while (this.match(TokenType.COMMA));
      }

      this.consume(TokenType.RBRACE, `'}' වරහන බලාපොරොත්තු විය`);

      return {
        type: 'ObjectLiteral',
        properties,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Grouping: ( expr ) or Arrow Function: ( params ) => { body }
    if (this.match(TokenType.LPAREN)) {
      const startToken = this.previous();
      
      // Check if this is an empty parameter list () => ...
      if (this.match(TokenType.RPAREN)) {
        if (this.match(TokenType.ARROW)) {
          return this.parseArrowFunctionBody([], false, startToken);
        }
        throw new HelaError(
          `හිස් වරහන් () තුළ ප්‍රකාශනයක් බලාපොරොත්තු විය`,
          { line: startToken.line, column: startToken.column, file: this.filePath },
          this.source
        );
      }

      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, `')' වරහන බලාපොරොත්තු විය`);

      // Check if arrow function: (a) => ...
      if (this.match(TokenType.ARROW)) {
        if (expr.type === 'Identifier') {
          return this.parseArrowFunctionBody([expr.name], false, startToken);
        }
        throw new HelaError(
          `වලංගු නොවන ඊතල වැඩේ (arrow function) පරාමිතියක්`,
          { line: startToken.line, column: startToken.column, file: this.filePath },
          this.source
        );
      }

      return expr;
    }

    // Anonymous Function Expression: 'වැඩේ(...) { ... }' or 'නොපෙනෙන වැඩේ(...) { ... }'
    if (this.match(TokenType.WADE)) {
      const startToken = this.previous();
      let isAsync = false;
      if (this.match(TokenType.NOPENENA)) {
        isAsync = true;
      }

      let name: string | undefined = undefined;
      if (this.match(TokenType.IDENTIFIER)) {
        name = this.previous().value;
      }

      this.consume(TokenType.LPAREN, `'(' වරහන බලාපොරොත්තු විය`);
      const params: string[] = [];
      if (!this.check(TokenType.RPAREN)) {
        do {
          const paramToken = this.consume(
            TokenType.IDENTIFIER,
            `පරාමිතියක් සඳහා නමක් බලාපොරොත්තු විය`
          );
          params.push(paramToken.value);
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RPAREN, `')' වරහන බලාපොරොත්තු විය`);
      const body = this.parseBlockStatement();

      return {
        type: 'FunctionExpression',
        name,
        params,
        body,
        isAsync,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Unexpected token error
    throw new HelaError(
      SinhalaErrors.unexpectedToken(token.value || token.type),
      { line: token.line, column: token.column, file: this.filePath },
      this.source,
      `මෙහි ප්‍රකාශනයක් (expression), අගයක් හෝ විචල්‍යයක් බලාපොරොත්තු විය`
    );
  }

  private parseArrowFunctionBody(
    params: string[],
    isAsync: boolean,
    startToken: Token
  ): FunctionExpression {
    if (this.check(TokenType.LBRACE)) {
      const body = this.parseBlockStatement();
      return {
        type: 'FunctionExpression',
        params,
        body,
        isAsync,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Concise body: expr => { return expr; }
    const returnExpr = this.parseExpression();
    return {
      type: 'FunctionExpression',
      params,
      body: {
        type: 'BlockStatement',
        statements: [
          {
            type: 'ReturnStatement',
            argument: returnExpr,
            line: returnExpr.line,
            column: returnExpr.column,
          },
        ],
        line: returnExpr.line,
        column: returnExpr.column,
      },
      isAsync,
      line: startToken.line,
      column: startToken.column,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Parser Utilities
  // ─────────────────────────────────────────────────────────────

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkNext(type: TokenType): boolean {
    if (this.current + 1 >= this.tokens.length) return false;
    return this.tokens[this.current + 1].type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, errorMessage: string): Token {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    throw new HelaError(
      errorMessage,
      { line: token.line, column: token.column, file: this.filePath },
      this.source
    );
  }

  private consumeOptionalSemicolon(): void {
    if (this.check(TokenType.SEMICOLON)) {
      this.advance();
    }
  }

  private isPropertyOrKeyword(token: Token): boolean {
    if (!token || token.type === TokenType.EOF) return false;
    return (
      token.type === TokenType.IDENTIFIER ||
      token.type === TokenType.YAVANNA ||
      token.type === TokenType.WADE ||
      token.type === TokenType.INNA ||
      token.type === TokenType.NOPENENA ||
      token.type === TokenType.DAANNA ||
      token.type === TokenType.VENAS_NOVANA ||
      token.type === TokenType.IDIN ||
      token.type === TokenType.NATTAM ||
      token.type === TokenType.KIYANAKAL ||
      token.type === TokenType.HAMA ||
      token.type === TokenType.GENNANNNA ||
      token.type === TokenType.GEN ||
      token.type === TokenType.ATTA ||
      token.type === TokenType.BORU ||
      token.type === TokenType.HIS ||
      token.type === TokenType.BINDINNA ||
      token.type === TokenType.EELANGA ||
      token.type === TokenType.UTSAHA ||
      token.type === TokenType.ALLANNA ||
      token.type === TokenType.AND ||
      token.type === TokenType.OR ||
      token.type === TokenType.NOT
    );
  }
}
