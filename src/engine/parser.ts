// ─────────────────────────────────────────────────────────────
// Boolean Expression Parser
// Tokenizer → Token Stream → Recursive Descent Parser → AST
// ─────────────────────────────────────────────────────────────

export type TokenType =
  | 'VAR'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'XOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

export type NodeType = 'VAR' | 'AND' | 'OR' | 'NOT' | 'XOR';

export interface ASTNode {
  type: NodeType;
  name?: string;       // for VAR nodes
  left?: ASTNode;
  right?: ASTNode;
  operand?: ASTNode;   // for NOT nodes
}

// ─── Tokenizer ───────────────────────────────────────────────

export class ParseError extends Error {
  pos: number;
  constructor(message: string, pos: number) {
    super(message);
    this.name = 'ParseError';
    this.pos = pos;
  }
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const src = input.toUpperCase().trim();

  while (i < src.length) {
    // Skip whitespace
    if (/\s/.test(src[i])) { i++; continue; }

    // Multi-char keywords
    if (src.startsWith('AND', i) && !/[A-Z0-9]/.test(src[i + 3] ?? '')) {
      tokens.push({ type: 'AND', value: 'AND', pos: i }); i += 3; continue;
    }
    if (src.startsWith('XOR', i) && !/[A-Z0-9]/.test(src[i + 3] ?? '')) {
      tokens.push({ type: 'XOR', value: 'XOR', pos: i }); i += 3; continue;
    }
    if (src.startsWith('NOT', i) && !/[A-Z0-9]/.test(src[i + 3] ?? '')) {
      tokens.push({ type: 'NOT', value: 'NOT', pos: i }); i += 3; continue;
    }
    if (src.startsWith('OR', i) && !/[A-Z0-9]/.test(src[i + 2] ?? '')) {
      tokens.push({ type: 'OR', value: 'OR', pos: i }); i += 2; continue;
    }

    // Operators (symbol aliases)
    if (src[i] === '&' || src[i] === '·' || src[i] === '*') {
      tokens.push({ type: 'AND', value: 'AND', pos: i }); i++; continue;
    }
    if (src[i] === '|' || src[i] === '+') {
      tokens.push({ type: 'OR', value: 'OR', pos: i }); i++; continue;
    }
    if (src[i] === '!' || src[i] === '~' || src[i] === '¬') {
      tokens.push({ type: 'NOT', value: 'NOT', pos: i }); i++; continue;
    }
    if (src[i] === '^') {
      tokens.push({ type: 'XOR', value: 'XOR', pos: i }); i++; continue;
    }
    if (src[i] === '(') {
      tokens.push({ type: 'LPAREN', value: '(', pos: i }); i++; continue;
    }
    if (src[i] === ')') {
      tokens.push({ type: 'RPAREN', value: ')', pos: i }); i++; continue;
    }

    // Variable: single letter A–Z
    if (/[A-Z]/.test(src[i])) {
      tokens.push({ type: 'VAR', value: src[i], pos: i }); i++; continue;
    }

    throw new ParseError(`Unexpected character '${src[i]}'`, i);
  }

  tokens.push({ type: 'EOF', value: '', pos: src.length });
  return tokens;
}

// ─── Recursive Descent Parser ─────────────────────────────────
// Grammar:
//   expr   → xor
//   xor    → or  ( XOR or  )*
//   or     → and ( OR  and )*
//   and    → not ( AND not )*
//   not    → NOT not | primary
//   primary→ VAR | '(' expr ')'

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token { return this.tokens[this.pos]; }

  private consume(type?: TokenType): Token {
    const t = this.tokens[this.pos];
    if (type && t.type !== type) {
      throw new ParseError(`Expected ${type}, got ${t.type}`, t.pos);
    }
    this.pos++;
    return t;
  }

  parse(): ASTNode {
    const node = this.parseExpr();
    if (this.peek().type !== 'EOF') {
      throw new ParseError(`Unexpected token '${this.peek().value}'`, this.peek().pos);
    }
    return node;
  }

  private parseExpr(): ASTNode { return this.parseXor(); }

  private parseXor(): ASTNode {
    let left = this.parseOr();
    while (this.peek().type === 'XOR') {
      this.consume('XOR');
      const right = this.parseOr();
      left = { type: 'XOR', left, right };
    }
    return left;
  }

  private parseOr(): ASTNode {
    let left = this.parseAnd();
    while (this.peek().type === 'OR') {
      this.consume('OR');
      const right = this.parseAnd();
      left = { type: 'OR', left, right };
    }
    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseNot();
    while (this.peek().type === 'AND') {
      this.consume('AND');
      const right = this.parseNot();
      left = { type: 'AND', left, right };
    }
    return left;
  }

  private parseNot(): ASTNode {
    if (this.peek().type === 'NOT') {
      this.consume('NOT');
      const operand = this.parseNot();
      return { type: 'NOT', operand };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const t = this.peek();
    if (t.type === 'VAR') {
      this.consume('VAR');
      return { type: 'VAR', name: t.value };
    }
    if (t.type === 'LPAREN') {
      this.consume('LPAREN');
      const node = this.parseExpr();
      this.consume('RPAREN');
      return node;
    }
    throw new ParseError(`Expected variable or '(', got '${t.value}'`, t.pos);
  }
}

// ─── Public API ───────────────────────────────────────────────

export function parseExpression(input: string): ASTNode {
  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  return parser.parse();
}

export function validateExpression(input: string): { valid: boolean; error?: string } {
  try {
    const tokens = tokenize(input);
    if (tokens.length === 1 && tokens[0].type === 'EOF') {
      return { valid: false, error: 'Empty expression' };
    }
    const parser = new Parser(tokens);
    parser.parse();
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

export function getVariables(node: ASTNode): string[] {
  const vars = new Set<string>();
  function walk(n: ASTNode) {
    if (n.type === 'VAR') { vars.add(n.name!); return; }
    if (n.operand) walk(n.operand);
    if (n.left)   walk(n.left);
    if (n.right)  walk(n.right);
  }
  walk(node);
  return [...vars].sort();
}

export function astToString(node: ASTNode): string {
  switch (node.type) {
    case 'VAR':  return node.name!;
    case 'NOT':  return `NOT ${astToString(node.operand!)}`;
    case 'AND':  return `(${astToString(node.left!)} AND ${astToString(node.right!)})`;
    case 'OR':   return `(${astToString(node.left!)} OR ${astToString(node.right!)})`;
    case 'XOR':  return `(${astToString(node.left!)} XOR ${astToString(node.right!)})`;
  }
}

export function evaluateAST(node: ASTNode, env: Record<string, boolean>): boolean {
  switch (node.type) {
    case 'VAR':  return env[node.name!] ?? false;
    case 'NOT':  return !evaluateAST(node.operand!, env);
    case 'AND':  return evaluateAST(node.left!, env) && evaluateAST(node.right!, env);
    case 'OR':   return evaluateAST(node.left!, env) || evaluateAST(node.right!, env);
    case 'XOR':  return evaluateAST(node.left!, env) !== evaluateAST(node.right!, env);
  }
}
