// ─────────────────────────────────────────────────────────────
// Truth Table Generator
// ─────────────────────────────────────────────────────────────

import type { ASTNode } from './parser';
import { evaluateAST, getVariables } from './parser';


export interface TruthTableRow {
  inputs: Record<string, boolean>;
  output: boolean;
}

export interface TruthTable {
  variables: string[];
  rows: TruthTableRow[];
}

export function generateTruthTable(ast: ASTNode): TruthTable {
  const variables = getVariables(ast);
  const n = variables.length;
  const rows: TruthTableRow[] = [];

  for (let i = 0; i < Math.pow(2, n); i++) {
    const inputs: Record<string, boolean> = {};
    variables.forEach((v, idx) => {
      inputs[v] = Boolean((i >> (n - 1 - idx)) & 1);
    });
    rows.push({ inputs, output: evaluateAST(ast, inputs) });
  }

  return { variables, rows };
}
