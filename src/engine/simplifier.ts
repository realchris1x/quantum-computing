// ─────────────────────────────────────────────────────────────
// Boolean Simplifier
// Applies algebraic laws step-by-step to produce simplified AST
// ─────────────────────────────────────────────────────────────

import type { ASTNode } from './parser';
import { astToString } from './parser';


export interface SimplificationStep {
  rule: string;
  before: string;
  after: string;
  node: ASTNode;
}

// Deep clone an AST node
function clone(n: ASTNode): ASTNode {
  const c: ASTNode = { type: n.type };
  if (n.name)    c.name    = n.name;
  if (n.left)    c.left    = clone(n.left);
  if (n.right)   c.right   = clone(n.right);
  if (n.operand) c.operand = clone(n.operand);
  return c;
}

// Structural equality
function equal(a: ASTNode, b: ASTNode): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'VAR') return a.name === b.name;
  if (a.type === 'NOT') return equal(a.operand!, b.operand!);
  return equal(a.left!, b.left!) && equal(a.right!, b.right!);
}

// ─── Simplification Rules ─────────────────────────────────────

function applyRules(node: ASTNode): { changed: boolean; node: ASTNode; rule?: string } {
  // Double negation: NOT NOT A → A
  if (node.type === 'NOT' && node.operand?.type === 'NOT') {
    return { changed: true, node: clone(node.operand.operand!), rule: 'Double Negation: NOT NOT A → A' };
  }

  // Idempotence: A AND A → A, A OR A → A
  if ((node.type === 'AND' || node.type === 'OR') && equal(node.left!, node.right!)) {
    return { changed: true, node: clone(node.left!), rule: `Idempotence: A ${node.type} A → A` };
  }

  // XOR self: A XOR A → 0 (false literal — represent as NOT VAR(A) AND VAR(A))
  // We skip 0/1 literals for simplicity; just note as tautology below

  // Absorption: A AND (A OR B) → A  |  A OR (A AND B) → A
  if (node.type === 'AND' && node.right?.type === 'OR') {
    if (equal(node.left!, node.right.left!) || equal(node.left!, node.right.right!)) {
      return { changed: true, node: clone(node.left!), rule: 'Absorption: A AND (A OR B) → A' };
    }
  }
  if (node.type === 'OR' && node.right?.type === 'AND') {
    if (equal(node.left!, node.right.left!) || equal(node.left!, node.right.right!)) {
      return { changed: true, node: clone(node.left!), rule: 'Absorption: A OR (A AND B) → A' };
    }
  }

  // Distribution: (A AND B) OR (A AND C) → A AND (B OR C)
  if (node.type === 'OR' && node.left?.type === 'AND' && node.right?.type === 'AND') {
    if (equal(node.left.left!, node.right.left!)) {
      const newNode: ASTNode = {
        type: 'AND',
        left: clone(node.left.left!),
        right: { type: 'OR', left: clone(node.left.right!), right: clone(node.right.right!) }
      };
      return { changed: true, node: newNode, rule: 'Distribution: (A AND B) OR (A AND C) → A AND (B OR C)' };
    }
    if (equal(node.left.right!, node.right.right!)) {
      const newNode: ASTNode = {
        type: 'AND',
        left: { type: 'OR', left: clone(node.left.left!), right: clone(node.right.left!) },
        right: clone(node.left.right!)
      };
      return { changed: true, node: newNode, rule: 'Distribution: (A AND B) OR (C AND B) → (A OR C) AND B' };
    }
  }

  // XOR → OR form: A XOR B → (A OR B) AND NOT(A AND B)
  // (Only apply at top level if no further simplification possible)

  return { changed: false, node };
}

// Apply rules recursively bottom-up
function simplifyOnce(node: ASTNode): { changed: boolean; node: ASTNode; rule?: string } {
  // First recurse into children
  if (node.type === 'NOT' && node.operand) {
    const r = simplifyOnce(node.operand);
    if (r.changed) return { changed: true, node: { type: 'NOT', operand: r.node }, rule: r.rule };
  }
  if (node.left) {
    const r = simplifyOnce(node.left);
    if (r.changed) return { changed: true, node: { ...node, left: r.node }, rule: r.rule };
  }
  if (node.right) {
    const r = simplifyOnce(node.right);
    if (r.changed) return { changed: true, node: { ...node, right: r.node }, rule: r.rule };
  }
  // Then apply rules at this node
  return applyRules(node);
}

// ─── Public API ───────────────────────────────────────────────

export function simplify(ast: ASTNode): { steps: SimplificationStep[]; result: ASTNode } {
  const steps: SimplificationStep[] = [];
  let current = clone(ast);
  let maxIter = 20; // safety cap

  while (maxIter-- > 0) {
    const { changed, node, rule } = simplifyOnce(current);
    if (!changed) break;
    steps.push({
      rule: rule!,
      before: astToString(current),
      after: astToString(node),
      node: clone(node),
    });
    current = node;
  }

  return { steps, result: current };
}
