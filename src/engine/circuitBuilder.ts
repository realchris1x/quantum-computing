// ─────────────────────────────────────────────────────────────
// Circuit Layout Builder
// Arranges gates on a qubit-wire grid
// ─────────────────────────────────────────────────────────────

import type { GateSequence, QuantumGate } from './polyXMapper';


export interface CircuitCell {
  gate: QuantumGate | null;
  role: 'gate' | 'control' | 'wire' | 'vertical-line';
  qubit: number;
  column: number;
}

export interface CircuitLayout {
  cells: CircuitCell[][];   // [qubit][column]
  numQubits: number;
  numColumns: number;
  qubitLabels: string[];
  gates: QuantumGate[];
}

export function buildCircuitLayout(seq: GateSequence): CircuitLayout {
  const { gates, qubitLabels, numQubits } = seq;

  if (gates.length === 0) {
    return { cells: [], numQubits, numColumns: 0, qubitLabels, gates };
  }

  // Assign each gate to a column — simple greedy: no two gates sharing a qubit can be in same column
  const qubitLastCol = new Array(numQubits).fill(-1);
  const gateColumns: number[] = [];

  gates.forEach(gate => {
    const involved = gate.qubits;
    const minCol   = Math.max(...involved.map(q => qubitLastCol[q])) + 1;
    gateColumns.push(minCol);
    involved.forEach(q => { qubitLastCol[q] = minCol; });
  });

  const numColumns = Math.max(...gateColumns) + 1;

  // Initialize grid
  const cells: CircuitCell[][] = Array.from({ length: numQubits }, (_, q) =>
    Array.from({ length: numColumns }, (_, c) => ({
      gate: null,
      role: 'wire',
      qubit: q,
      column: c,
    }))
  );

  // Place gates
  gates.forEach((gate, i) => {
    const col = gateColumns[i];
    cells[gate.target][col] = { gate, role: 'gate', qubit: gate.target, column: col };

    // Mark controls
    (gate.controls ?? []).forEach(cq => {
      cells[cq][col] = { gate, role: 'control', qubit: cq, column: col };
    });

    // Mark vertical connector lines
    if ((gate.controls?.length ?? 0) > 0) {
      const allQ = [...(gate.controls ?? []), gate.target].sort((a, b) => a - b);
      for (let q = allQ[0] + 1; q < allQ[allQ.length - 1]; q++) {
        if (cells[q][col].role === 'wire') {
          cells[q][col] = { gate, role: 'vertical-line', qubit: q, column: col };
        }
      }
    }
  });

  return { cells, numQubits, numColumns, qubitLabels, gates };
}
