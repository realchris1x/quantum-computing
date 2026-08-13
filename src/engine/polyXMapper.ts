// ─────────────────────────────────────────────────────────────
// Poly-X Gate Mapper
// AST → Quantum Gate Sequence (Poly-X = Pauli-X = π rotation around X-axis)
// ─────────────────────────────────────────────────────────────

import type { ASTNode } from './parser';
import { getVariables } from './parser';


export type GateType = 'X' | 'CX' | 'CCX' | 'SWAP' | 'BARRIER' | 'MEASURE';

export interface QuantumGate {
  id: string;
  type: GateType;
  qubits: number[];       // qubit indices involved
  controls?: number[];    // control qubits
  target: number;         // target qubit
  label: string;
  description: string;
  matrix: string;         // LaTeX-style matrix string
  angle?: number;         // rotation angle in degrees
  booleanOrigin: string;  // which boolean op spawned this
}

export interface PolyXMapping {
  boolean: string;
  quantum: string;
  gate: GateType;
  description: string;
}

export const POLYX_MAPPING_TABLE: PolyXMapping[] = [
  {
    boolean: 'NOT A',
    quantum: 'X',
    gate: 'X',
    description: 'Pauli-X gate: π rotation around X-axis. Flips |0⟩↔|1⟩',
  },
  {
    boolean: 'A XOR B',
    quantum: 'CNOT (CX)',
    gate: 'CX',
    description: 'Controlled-NOT: Applies X on target when control is |1⟩',
  },
  {
    boolean: 'A AND B',
    quantum: 'Toffoli (CCX)',
    gate: 'CCX',
    description: 'Toffoli gate: Multi-Controlled X. X on target when both controls are |1⟩',
  },
  {
    boolean: 'A OR B',
    quantum: 'De Morgan CX',
    gate: 'X',
    description: "De Morgan: NOT(NOT A AND NOT B) → X on A, X on B, CCX(A,B,anc), X on A, X on B",
  },
];

let gateIdCounter = 0;
function nextId() { return `g${++gateIdCounter}`; }

export interface GateSequence {
  gates: QuantumGate[];
  qubitLabels: string[];
  numQubits: number;
}

// ─── Mapper ───────────────────────────────────────────────────

export class PolyXMapper {
  private variables: string[];
  private gates: QuantumGate[] = [];
  private qubitMap: Record<string, number> = {};
  private ancillaCount = 0;

  constructor(variables: string[]) {
    this.variables = variables;
    variables.forEach((v, i) => { this.qubitMap[v] = i; });
  }

  private qubitFor(name: string): number {
    if (this.qubitMap[name] !== undefined) return this.qubitMap[name];
    // ancilla qubit
    const idx = this.variables.length + this.ancillaCount++;
    this.qubitMap[`anc${this.ancillaCount}`] = idx;
    return idx;
  }

  private numQubits(): number {
    return Math.max(...Object.values(this.qubitMap)) + 1;
  }

  mapAST(node: ASTNode): number {
    switch (node.type) {
      case 'VAR':
        return this.qubitFor(node.name!);

      case 'NOT': {
        const q = this.mapAST(node.operand!);
        this.gates.push({
          id: nextId(),
          type: 'X',
          qubits: [q],
          target: q,
          label: 'X',
          description: 'Pauli-X (NOT)',
          matrix: '[[0,1],[1,0]]',
          angle: 180,
          booleanOrigin: 'NOT',
        });
        return q;
      }

      case 'XOR': {
        const control = this.mapAST(node.left!);
        const target  = this.mapAST(node.right!);
        this.gates.push({
          id: nextId(),
          type: 'CX',
          qubits: [control, target],
          controls: [control],
          target,
          label: 'CNOT',
          description: 'Controlled-X (XOR)',
          matrix: '[[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]]',
          angle: 180,
          booleanOrigin: 'XOR',
        });
        return target;
      }

      case 'AND': {
        const c1     = this.mapAST(node.left!);
        const c2     = this.mapAST(node.right!);
        const ancIdx = this.variables.length + this.ancillaCount;
        const ancKey = `out${this.ancillaCount++}`;
        this.qubitMap[ancKey] = ancIdx;
        this.gates.push({
          id: nextId(),
          type: 'CCX',
          qubits: [c1, c2, ancIdx],
          controls: [c1, c2],
          target: ancIdx,
          label: 'CCX',
          description: 'Toffoli (AND)',
          matrix: '8×8 Toffoli matrix',
          angle: 180,
          booleanOrigin: 'AND',
        });
        return ancIdx;
      }

      case 'OR': {
        // De Morgan: A OR B = NOT(NOT A AND NOT B)
        const c1 = this.mapAST(node.left!);
        const c2 = this.mapAST(node.right!);
        const ancIdx = this.variables.length + this.ancillaCount;
        const ancKey = `out${this.ancillaCount++}`;
        this.qubitMap[ancKey] = ancIdx;
        // X on both controls
        this.gates.push({ id: nextId(), type: 'X', qubits: [c1], target: c1, controls: [], label: 'X', description: 'NOT (De Morgan)', matrix: '[[0,1],[1,0]]', angle: 180, booleanOrigin: 'OR/DeMorgan' });
        this.gates.push({ id: nextId(), type: 'X', qubits: [c2], target: c2, controls: [], label: 'X', description: 'NOT (De Morgan)', matrix: '[[0,1],[1,0]]', angle: 180, booleanOrigin: 'OR/DeMorgan' });
        // Toffoli
        this.gates.push({ id: nextId(), type: 'CCX', qubits: [c1, c2, ancIdx], controls: [c1, c2], target: ancIdx, label: 'CCX', description: 'Toffoli (AND of inverted inputs)', matrix: '8×8 Toffoli matrix', angle: 180, booleanOrigin: 'OR/DeMorgan' });
        // X on both controls (uncompute)
        this.gates.push({ id: nextId(), type: 'X', qubits: [c1], target: c1, controls: [], label: 'X', description: 'NOT (De Morgan restore)', matrix: '[[0,1],[1,0]]', angle: 180, booleanOrigin: 'OR/DeMorgan' });
        this.gates.push({ id: nextId(), type: 'X', qubits: [c2], target: c2, controls: [], label: 'X', description: 'NOT (De Morgan restore)', matrix: '[[0,1],[1,0]]', angle: 180, booleanOrigin: 'OR/DeMorgan' });
        // NOT the ancilla result
        this.gates.push({ id: nextId(), type: 'X', qubits: [ancIdx], target: ancIdx, controls: [], label: 'X', description: 'NOT (final De Morgan inversion)', matrix: '[[0,1],[1,0]]', angle: 180, booleanOrigin: 'OR/DeMorgan' });
        return ancIdx;
      }
    }
  }

  build(ast: ASTNode): GateSequence {
    gateIdCounter = 0;
    this.gates = [];
    this.ancillaCount = 0;
    this.mapAST(ast);
    const numQubits = this.numQubits();
    const qubitLabels = this.variables.slice(0, numQubits);
    // fill in any ancilla labels
    for (let i = this.variables.length; i < numQubits; i++) {
      qubitLabels[i] = `anc${i - this.variables.length}`;
    }
    return { gates: this.gates, qubitLabels, numQubits };
  }
}

export function mapToPolyX(ast: ASTNode): GateSequence {
  const vars = getVariables(ast);
  const mapper = new PolyXMapper(vars);
  return mapper.build(ast);
}
