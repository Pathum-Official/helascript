/**
 * HelaScript Unicode-Aware Lexer
 * Handles Sinhala UTF-8 characters, zero-width joiners (ZWJ),
 * spoken keywords, string escapes, numbers, and operators.
 */

import { HelaError, SinhalaErrors } from '../diagnostics/error.js';
import { KEYWORDS, Token, TokenType } from './token.js';

export class Lexer {
  private readonly source: string;
  private readonly filePath?: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string, filePath?: string) {
    this.source = source;
    this.filePath = filePath;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      const char = this.peek();

      // Whitespace
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
        continue;
      }

      // Newlines
      if (char === '\n') {
        this.line++;
        this.column = 1;
        this.advance();
        continue;
      }

      // Comments or Division
      if (char === '/') {
        if (this.peekNext() === '/') {
          // Single-line comment
          while (!this.isAtEnd() && this.peek() !== '\n') {
            this.advance();
          }
          continue;
        } else if (this.peekNext() === '*') {
          // Multi-line comment
          this.advance(); // consume '/'
          this.advance(); // consume '*'
          while (!this.isAtEnd()) {
            if (this.peek() === '*' && this.peekNext() === '/') {
              this.advance(); // consume '*'
              this.advance(); // consume '/'
              break;
            }
            if (this.peek() === '\n') {
              this.line++;
              this.column = 1;
            }
            this.advance();
          }
          continue;
        } else if (this.peekNext() === '=') {
          const token = this.makeToken(TokenType.SLASH_ASSIGN, '/=');
          this.advance();
          this.advance();
          tokens.push(token);
          continue;
        } else {
          tokens.push(this.makeToken(TokenType.SLASH, '/'));
          this.advance();
          continue;
        }
      }

      // Numbers
      if (this.isDigit(char)) {
        tokens.push(this.readNumber());
        continue;
      }

      // Strings (double quote, single quote, backtick)
      if (char === '"' || char === "'" || char === '`') {
        tokens.push(this.readString(char));
        continue;
      }

      // Identifiers & Sinhala Keywords
      if (this.isIdentifierStart(char)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      // Operators and Punctuation
      const token = this.readOperatorOrPunctuation();
      if (token) {
        tokens.push(token);
        continue;
      }

      // Unknown character error
      const errChar = this.peek();
      throw new HelaError(
        SinhalaErrors.unexpectedChar(errChar),
        { line: this.line, column: this.column, file: this.filePath },
        this.source,
        `කරුණාකර වලංගු සළකුණක් හෝ අකුරක් යොදන්න.`
      );
    }

    tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
    });

    return tokens;
  }

  private readOperatorOrPunctuation(): Token | null {
    const char = this.peek();
    const next = this.peekNext();
    const startLine = this.line;
    const startCol = this.column;

    // Two-character operators
    if (char === '=' && next === '=') {
      this.advance();
      this.advance();
      return { type: TokenType.EQUAL, value: '==', line: startLine, column: startCol };
    }
    if (char === '=' && next === '>') {
      this.advance();
      this.advance();
      return { type: TokenType.ARROW, value: '=>', line: startLine, column: startCol };
    }
    if (char === '!' && next === '=') {
      this.advance();
      this.advance();
      return { type: TokenType.NOT_EQUAL, value: '!=', line: startLine, column: startCol };
    }
    if (char === '<' && next === '=') {
      this.advance();
      this.advance();
      return { type: TokenType.LESS_EQUAL, value: '<=', line: startLine, column: startCol };
    }
    if (char === '>' && next === '=') {
      this.advance();
      this.advance();
      return { type: TokenType.GREATER_EQUAL, value: '>=', line: startLine, column: startCol };
    }
    if (char === '+' && next === '=') {
      this.advance();
      this.advance();
      return { type: TokenType.PLUS_ASSIGN, value: '+=', line: startLine, column: startCol };
    }
    if (char === '-' && next === '=') {
      this.advance();
      this.advance();
      return { type: TokenType.MINUS_ASSIGN, value: '-=', line: startLine, column: startCol };
    }
    if (char === '*' && next === '=') {
      this.advance();
      this.advance();
      return { type: TokenType.STAR_ASSIGN, value: '*=', line: startLine, column: startCol };
    }
    if (char === '&' && next === '&') {
      this.advance();
      this.advance();
      return { type: TokenType.AND, value: '&&', line: startLine, column: startCol };
    }
    if (char === '|' && next === '|') {
      this.advance();
      this.advance();
      return { type: TokenType.OR, value: '||', line: startLine, column: startCol };
    }

    // Single-character operators and punctuation
    const singleTokens: Record<string, TokenType> = {
      '+': TokenType.PLUS,
      '-': TokenType.MINUS,
      '*': TokenType.STAR,
      '%': TokenType.PERCENT,
      '=': TokenType.ASSIGN,
      '<': TokenType.LESS,
      '>': TokenType.GREATER,
      '!': TokenType.NOT,
      '(': TokenType.LPAREN,
      ')': TokenType.RPAREN,
      '{': TokenType.LBRACE,
      '}': TokenType.RBRACE,
      '[': TokenType.LBRACKET,
      ']': TokenType.RBRACKET,
      ',': TokenType.COMMA,
      ';': TokenType.SEMICOLON,
      ':': TokenType.COLON,
      '.': TokenType.DOT,
    };

    if (char in singleTokens) {
      const type = singleTokens[char];
      this.advance();
      return { type, value: char, line: startLine, column: startCol };
    }

    return null;
  }

  private readNumber(): Token {
    const startLine = this.line;
    const startCol = this.column;
    let numStr = '';

    // Hex numbers (0x...)
    if (this.peek() === '0' && (this.peekNext() === 'x' || this.peekNext() === 'X')) {
      numStr += this.advance(); // 0
      numStr += this.advance(); // x
      while (!this.isAtEnd() && this.isHexDigit(this.peek())) {
        numStr += this.advance();
      }
      return {
        type: TokenType.NUMBER,
        value: numStr,
        line: startLine,
        column: startCol,
        literal: parseInt(numStr, 16),
      };
    }

    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      numStr += this.advance();
    }

    // Decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      numStr += this.advance(); // consume '.'
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        numStr += this.advance();
      }
    }

    return {
      type: TokenType.NUMBER,
      value: numStr,
      line: startLine,
      column: startCol,
      literal: parseFloat(numStr),
    };
  }

  private readString(quote: string): Token {
    const startLine = this.line;
    const startCol = this.column;
    this.advance(); // Consume opening quote

    let str = '';
    while (!this.isAtEnd() && this.peek() !== quote) {
      const char = this.peek();

      if (char === '\n') {
        this.line++;
        this.column = 1;
      }

      if (char === '\\') {
        this.advance(); // Consume '\'
        if (this.isAtEnd()) break;
        const escapeChar = this.advance();
        switch (escapeChar) {
          case 'n': str += '\n'; break;
          case 't': str += '\t'; break;
          case 'r': str += '\r'; break;
          case '\\': str += '\\'; break;
          case '"': str += '"'; break;
          case "'": str += "'"; break;
          case '`': str += '`'; break;
          case 'u': {
            // \uXXXX
            let hex = '';
            for (let i = 0; i < 4 && !this.isAtEnd(); i++) {
              hex += this.advance();
            }
            str += String.fromCharCode(parseInt(hex, 16));
            break;
          }
          default:
            str += escapeChar;
            break;
        }
      } else {
        str += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new HelaError(
        SinhalaErrors.unclosedString(),
        { line: startLine, column: startCol, file: this.filePath },
        this.source,
        `අවසානයට '${quote}' ලකුණ එකතු කරන්න.`
      );
    }

    this.advance(); // Consume closing quote

    return {
      type: TokenType.STRING,
      value: str,
      line: startLine,
      column: startCol,
      literal: str,
    };
  }

  private readIdentifier(): Token {
    const startLine = this.line;
    const startCol = this.column;
    let ident = '';

    while (!this.isAtEnd() && this.isIdentifierPart(this.peek())) {
      ident += this.advance();
    }

    // Check if the identifier matches a Sinhala keyword
    const keywordType = KEYWORDS[ident];

    if (keywordType) {
      let literal: any = undefined;
      if (keywordType === TokenType.ATTA) literal = true;
      if (keywordType === TokenType.BORU) literal = false;
      if (keywordType === TokenType.HIS) literal = null;

      return {
        type: keywordType,
        value: ident,
        line: startLine,
        column: startCol,
        literal,
      };
    }

    return {
      type: TokenType.IDENTIFIER,
      value: ident,
      line: startLine,
      column: startCol,
    };
  }

  private isSinhalaChar(ch: string): boolean {
    const code = ch.charCodeAt(0);
    // Sinhala Unicode range: U+0D80 to U+0DFF
    // Zero-width joiner (ZWJ): U+200D
    // Zero-width non-joiner (ZWNJ): U+200C
    return (
      (code >= 0x0d80 && code <= 0x0dff) ||
      code === 0x200c ||
      code === 0x200d
    );
  }

  private isIdentifierStart(ch: string): boolean {
    return (
      this.isSinhalaChar(ch) ||
      (ch >= 'a' && ch <= 'z') ||
      (ch >= 'A' && ch <= 'Z') ||
      ch === '_' ||
      ch === '$'
    );
  }

  private isIdentifierPart(ch: string): boolean {
    return this.isIdentifierStart(ch) || this.isDigit(ch);
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isHexDigit(ch: string): boolean {
    return (
      (ch >= '0' && ch <= '9') ||
      (ch >= 'a' && ch <= 'f') ||
      (ch >= 'A' && ch <= 'F')
    );
  }

  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.position];
  }

  private peekNext(): string {
    if (this.position + 1 >= this.source.length) return '\0';
    return this.source[this.position + 1];
  }

  private advance(): string {
    const char = this.source[this.position];
    this.position++;
    this.column++;
    return char;
  }

  private makeToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column,
    };
  }
}
