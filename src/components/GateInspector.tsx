import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuantumGate } from '../engine/polyXMapper';


interface Props {
  gate: QuantumGate | null;
  onClose: () => void;
}

const GATE_MATRIX: Record<string, { rows: string[][]; label: string }> = {
  X: {
    label: 'Pauli-X (NOT)',
    rows: [['0', '1'], ['1', '0']],
  },
  CX: {
    label: 'Controlled-X (CNOT)',
    rows: [['1','0','0','0'],['0','1','0','0'],['0','0','0','1'],['0','0','1','0']],
  },
  CCX: {
    label: 'Toffoli (CCX)',
    rows: [
      ['1','0','0','0','0','0','0','0'],
      ['0','1','0','0','0','0','0','0'],
      ['0','0','1','0','0','0','0','0'],
      ['0','0','0','1','0','0','0','0'],
      ['0','0','0','0','1','0','0','0'],
      ['0','0','0','0','0','1','0','0'],
      ['0','0','0','0','0','0','0','1'],
      ['0','0','0','0','0','0','1','0'],
    ],
  },
};

const GATE_TRUTH: Record<string, { inputs: string[]; outputs: string[] }> = {
  X:   { inputs: ['0', '1'],    outputs: ['1', '0'] },
  CX:  { inputs: ['0,0','0,1','1,0','1,1'], outputs: ['0,0','0,1','1,1','1,0'] },
  CCX: { inputs: ['0,0,0','0,0,1','0,1,0','0,1,1','1,0,0','1,0,1','1,1,0','1,1,1'], outputs: ['0,0,0','0,0,1','0,1,0','0,1,1','1,0,0','1,0,1','1,1,1','1,1,0'] },
};

const gateColorMap: Record<string, { bg: string; text: string; badge: string }> = {
  X:   { bg: '#EEF2FF', text: '#4F46E5', badge: 'bg-indigo-100 text-indigo-700' },
  CX:  { bg: '#ECFEFF', text: '#0891B2', badge: 'bg-cyan-100 text-cyan-700' },
  CCX: { bg: '#F5F3FF', text: '#7C3AED', badge: 'bg-violet-100 text-violet-700' },
};

export const GateInspector: React.FC<Props> = ({ gate, onClose }) => {
  const matrix  = gate ? GATE_MATRIX[gate.type] : null;
  const truth   = gate ? GATE_TRUTH[gate.type] : null;
  const colors  = gate ? (gateColorMap[gate.type] ?? gateColorMap['X']) : null;

  return (
    <AnimatePresence>
      {gate && (
        <motion.div
          key="inspector"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="fixed right-4 top-24 w-80 card p-5 z-50 max-h-[80vh] overflow-y-auto"
          style={{ borderTop: `3px solid ${colors?.text}` }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold mb-1 ${colors?.badge}`}>
                {gate.type} Gate
              </div>
              <h3 className="text-base font-bold text-slate-800">{matrix?.label}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-surface-100 hover:bg-surface-200 flex items-center justify-center text-muted transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted mb-4 leading-relaxed">{gate.description}</p>

          {/* Properties */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-2 rounded-lg bg-surface-50 border border-surface-200">
              <p className="text-xs text-muted">Rotation</p>
              <p className="text-sm font-bold text-primary">{gate.angle}°</p>
            </div>
            <div className="p-2 rounded-lg bg-surface-50 border border-surface-200">
              <p className="text-xs text-muted">Axis</p>
              <p className="text-sm font-bold text-secondary">X</p>
            </div>
            <div className="p-2 rounded-lg bg-surface-50 border border-surface-200">
              <p className="text-xs text-muted">Operator</p>
              <code className="text-xs font-mono font-bold text-accent">Rx(π)</code>
            </div>
            <div className="p-2 rounded-lg bg-surface-50 border border-surface-200">
              <p className="text-xs text-muted">Origin</p>
              <code className="text-xs font-mono font-semibold text-slate-600">{gate.booleanOrigin}</code>
            </div>
          </div>

          {/* Matrix */}
          {matrix && matrix.rows.length <= 4 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted mb-2">Unitary Matrix</p>
              <div
                className="inline-flex flex-col gap-1 p-3 rounded-xl font-mono text-xs"
                style={{ background: colors?.bg }}
              >
                {matrix.rows.map((row, ri) => (
                  <div key={ri} className="flex gap-3">
                    {row.map((cell, ci) => (
                      <span key={ci} className="w-4 text-center font-bold" style={{ color: colors?.text }}>
                        {cell}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Truth Table */}
          {truth && (
            <div>
              <p className="text-xs font-semibold text-muted mb-2">Truth Table</p>
              <div className="rounded-xl overflow-hidden border border-surface-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-50">
                      <th className="px-3 py-1.5 text-left font-semibold text-muted">In</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-muted">Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {truth.inputs.map((inp, i) => (
                      <tr key={i} className="border-t border-surface-100 hover:bg-primary/4 transition-colors">
                        <td className="px-3 py-1.5 font-mono text-slate-600">{inp}</td>
                        <td className="px-3 py-1.5 font-mono font-bold" style={{ color: colors?.text }}>{truth.outputs[i]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GateInspector;
