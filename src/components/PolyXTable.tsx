import React from 'react';
import { motion } from 'framer-motion';


export const PolyXTable: React.FC = () => {
  const rows = [
    { boolean: 'NOT A',   quantum: 'X Gate',    gate: 'X',   color: 'indigo',  desc: 'π rotation around X-axis', matrix: '[[0,1],[1,0]]', angle: '180°' },
    { boolean: 'A XOR B', quantum: 'CNOT (CX)', gate: 'CX',  color: 'cyan',    desc: 'Controlled Pauli-X gate',  matrix: '4×4 CX',        angle: '180°' },
    { boolean: 'A AND B', quantum: 'Toffoli',   gate: 'CCX', color: 'violet',  desc: 'Multi-Controlled X gate',  matrix: '8×8 CCX',       angle: '180°' },
    { boolean: 'A OR B',  quantum: 'De Morgan', gate: 'De M',color: 'emerald', desc: 'NOT(NOT A AND NOT B) → CX', matrix: 'Composite',     angle: 'N/A'  },
  ];

  const colorMap: Record<string, string> = {
    indigo:  'bg-indigo-50 border-indigo-200 text-indigo-700',
    cyan:    'bg-cyan-50 border-cyan-200 text-cyan-700',
    violet:  'bg-violet-50 border-violet-200 text-violet-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 bg-white hover:shadow-card-hover transition-all duration-200 cursor-default group"
        >
          {/* Boolean side */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted mb-1">Boolean</p>
            <code className="text-sm font-mono font-bold text-slate-800">{row.boolean}</code>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-px h-3 bg-slate-200" />
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="w-px h-3 bg-slate-200" />
          </div>

          {/* Quantum side */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted mb-1">Poly-X Gate</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${colorMap[row.color]}`}>
              {row.gate}
            </span>
            <p className="text-xs text-slate-500 mt-1">{row.desc}</p>
          </div>

          {/* Angle badge */}
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted">Rotation</p>
            <p className="text-sm font-bold text-secondary">{row.angle}</p>
          </div>

          {/* Matrix preview */}
          <div className="shrink-0 hidden lg:block">
            <code className="text-xs text-slate-400 font-mono">{row.matrix}</code>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PolyXTable;
