/**
 * HelaScript Abstract Syntax Tree (AST) Node Definitions
 */

export type ASTNodeType =
  // Program & Statements
  | 'Program'
  | 'VarDeclaration'
  | 'FunctionDeclaration'
  | 'IfStatement'
  | 'WhileStatement'
  | 'ForStatement'
  | 'ForInStatement'
  | 'ReturnStatement'
  | 'BreakStatement'
  | 'ContinueStatement'
  | 'TryCatchStatement'
  | 'ThrowStatement'
  | 'ImportStatement'
  | 'BlockStatement'
  | 'ExpressionStatement'

  // Expressions
  | 'Literal'
  | 'Identifier'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'AssignmentExpression'
  | 'LogicalExpression'
  | 'CallExpression'
  | 'MemberExpression'
  | 'ArrayLiteral'
  | 'ObjectLiteral'
  | 'AwaitExpression'
  | 'FunctionExpression';

export interface BaseNode {
  type: ASTNodeType;
  line: number;
  column: number;
}

export type Statement =
  | VarDeclaration
  | FunctionDeclaration
  | IfStatement
  | WhileStatement
  | ForStatement
  | ForInStatement
  | ReturnStatement
  | BreakStatement
  | ContinueStatement
  | TryCatchStatement
  | ThrowStatement
  | ImportStatement
  | BlockStatement
  | ExpressionStatement;

export type Expression =
  | Literal
  | Identifier
  | BinaryExpression
  | UnaryExpression
  | AssignmentExpression
  | LogicalExpression
  | CallExpression
  | MemberExpression
  | ArrayLiteral
  | ObjectLiteral
  | AwaitExpression
  | FunctionExpression;

export interface Program extends BaseNode {
  type: 'Program';
  statements: Statement[];
}

export interface VarDeclaration extends BaseNode {
  type: 'VarDeclaration';
  name: string;
  isConst: boolean;
  initializer?: Expression;
}

export interface FunctionDeclaration extends BaseNode {
  type: 'FunctionDeclaration';
  name: string;
  params: string[];
  body: BlockStatement;
  isAsync: boolean;
}

export interface IfStatement extends BaseNode {
  type: 'IfStatement';
  condition: Expression;
  consequent: Statement;
  alternate?: Statement;
}

export interface WhileStatement extends BaseNode {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement;
}

export interface ForStatement extends BaseNode {
  type: 'ForStatement';
  init?: Statement;
  condition?: Expression;
  update?: Expression;
  body: Statement;
}

export interface ForInStatement extends BaseNode {
  type: 'ForInStatement';
  variable: string;
  isConst: boolean;
  iterable: Expression;
  body: Statement;
}

export interface ReturnStatement extends BaseNode {
  type: 'ReturnStatement';
  argument?: Expression;
}

export interface BreakStatement extends BaseNode {
  type: 'BreakStatement';
}

export interface ContinueStatement extends BaseNode {
  type: 'ContinueStatement';
}

export interface TryCatchStatement extends BaseNode {
  type: 'TryCatchStatement';
  tryBlock: BlockStatement;
  catchVar?: string;
  catchBlock: BlockStatement;
}

export interface ThrowStatement extends BaseNode {
  type: 'ThrowStatement';
  argument: Expression;
}

export interface ImportStatement extends BaseNode {
  type: 'ImportStatement';
  // Either a default/namespace name (e.g., 'fs') or named specifiers (e.g., ['readFile', 'writeFile'])
  importSpecifier: string | string[];
  source: string;
}

export interface BlockStatement extends BaseNode {
  type: 'BlockStatement';
  statements: Statement[];
}

export interface ExpressionStatement extends BaseNode {
  type: 'ExpressionStatement';
  expression: Expression;
}

// Expressions

export interface Literal extends BaseNode {
  type: 'Literal';
  value: any;
  raw: string;
}

export interface Identifier extends BaseNode {
  type: 'Identifier';
  name: string;
}

export interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends BaseNode {
  type: 'UnaryExpression';
  operator: string;
  argument: Expression;
  prefix: boolean;
}

export interface AssignmentExpression extends BaseNode {
  type: 'AssignmentExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface LogicalExpression extends BaseNode {
  type: 'LogicalExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface CallExpression extends BaseNode {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface MemberExpression extends BaseNode {
  type: 'MemberExpression';
  object: Expression;
  property: Expression;
  computed: boolean; // true for a[b], false for a.b
}

export interface ArrayLiteral extends BaseNode {
  type: 'ArrayLiteral';
  elements: Expression[];
}

export interface ObjectProperty {
  key: string;
  value: Expression;
}

export interface ObjectLiteral extends BaseNode {
  type: 'ObjectLiteral';
  properties: ObjectProperty[];
}

export interface AwaitExpression extends BaseNode {
  type: 'AwaitExpression';
  argument: Expression;
}

export interface FunctionExpression extends BaseNode {
  type: 'FunctionExpression';
  name?: string;
  params: string[];
  body: BlockStatement;
  isAsync: boolean;
}
