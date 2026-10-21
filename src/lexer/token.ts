/**
 * HelaScript Token Definitions
 */

export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',

  // Keywords (Spoken Sinhala)
  DAANNA = 'DAANNA',             // දාන්න (let)
  VENAS_NOVANA = 'VENAS_NOVANA', // වෙනස්නොවන (const)
  IDIN = 'IDIN',                 // ඉදින් (if)
  NATTAM = 'NATTAM',             // නැත්තම් (else / else if)
  KIYANAKAL = 'KIYANAKAL',       // කියනකල් (while)
  HAMA = 'HAMA',                 // හැම (for)
  WADE = 'WADE',                 // වැඩේ (function)
  YAVANNA = 'YAVANNA',           // යවන්න (return)
  INNA = 'INNA',                 // ඉන්න (await)
  NOPENENA = 'NOPENENA',         // නොපෙනෙන (async)
  GENNANNNA = 'GENNANNNA',       // ගෙන්නන්න (import)
  GEN = 'GEN',                   // ගෙන් (from)
  ATTA = 'ATTA',                 // ඇත්ත (true)
  BORU = 'BORU',                 // බොරු (false)
  HIS = 'HIS',                   // හිස් (null)
  BINDINNA = 'BINDINNA',         // නවත්වන්න / බිඳින්න (break)
  EELANGA = 'EELANGA',           // ඊළඟ / ඉදිරියට (continue)
  UTSAHA = 'UTSAHA',             // උත්සාහ (try)
  ALLANNA = 'ALLANNA',           // අල්ලන්න (catch)

  // Operators
  PLUS = 'PLUS',                 // +
  MINUS = 'MINUS',               // -
  STAR = 'STAR',                 // *
  SLASH = 'SLASH',               // /
  PERCENT = 'PERCENT',           // %
  ASSIGN = 'ASSIGN',             // =
  PLUS_ASSIGN = 'PLUS_ASSIGN',   // +=
  MINUS_ASSIGN = 'MINUS_ASSIGN', // -=
  STAR_ASSIGN = 'STAR_ASSIGN',   // *=
  SLASH_ASSIGN = 'SLASH_ASSIGN', // /=
  EQUAL = 'EQUAL',               // ==
  NOT_EQUAL = 'NOT_EQUAL',       // !=
  LESS = 'LESS',                 // <
  LESS_EQUAL = 'LESS_EQUAL',     // <=
  GREATER = 'GREATER',           // >
  GREATER_EQUAL = 'GREATER_EQUAL', // >=
  AND = 'AND',                   // සහ, &&
  OR = 'OR',                     // හෝ, ||
  NOT = 'NOT',                   // නැත, !

  // Punctuation
  LPAREN = 'LPAREN',             // (
  RPAREN = 'RPAREN',             // )
  LBRACE = 'LBRACE',             // {
  RBRACE = 'RBRACE',             // }
  LBRACKET = 'LBRACKET',         // [
  RBRACKET = 'RBRACKET',         // ]
  COMMA = 'COMMA',               // ,
  SEMICOLON = 'SEMICOLON',       // ;
  COLON = 'COLON',               // :
  DOT = 'DOT',                   // .
  ARROW = 'ARROW',               // =>

  // Special
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  literal?: any;
}

/**
 * Map of Sinhala spoken keywords to TokenTypes
 */
export const KEYWORDS: Record<string, TokenType> = {
  'දාන්න': TokenType.DAANNA,
  'වෙනස්නොවන': TokenType.VENAS_NOVANA,
  'ඉදින්': TokenType.IDIN,
  'නැත්තම්': TokenType.NATTAM,
  'කියනකල්': TokenType.KIYANAKAL,
  'හැම': TokenType.HAMA,
  'වැඩේ': TokenType.WADE,
  'යවන්න': TokenType.YAVANNA,
  'ඉන්න': TokenType.INNA,
  'නොපෙනෙන': TokenType.NOPENENA,
  'ගෙන්නන්න': TokenType.GENNANNNA,
  'ගෙන්': TokenType.GEN,
  'ඇත්ත': TokenType.ATTA,
  'බොරු': TokenType.BORU,
  'හිස්': TokenType.HIS,
  'නවත්වන්න': TokenType.BINDINNA,
  'බිඳින්න': TokenType.BINDINNA,
  'ඊළඟ': TokenType.EELANGA,
  'ඉදිරියට': TokenType.EELANGA,
  'උත්සාහ': TokenType.UTSAHA,
  'අල්ලන්න': TokenType.ALLANNA,
  'සහ': TokenType.AND,
  'හෝ': TokenType.OR,
  'නැත': TokenType.NOT,

  // We can also allow standard fallback keywords for maximum developer ease
  'true': TokenType.ATTA,
  'false': TokenType.BORU,
  'null': TokenType.HIS,
};
