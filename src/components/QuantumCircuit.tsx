import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { CircuitLayout, CircuitCell } from '../engine/circuitBuilder';
import type { QuantumGate } from '../engine/polyXMapper';


interface Props {
  layout: CircuitLayout | null;
  onGateClick: (gate: QuantumGate) => void;
  animating: boolean;
}

const CELL_W = 72, CELL_H = 56, LABEL_W = 48, PADDING = 16;

const GATE_COLORS: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  X:   { bg: '#EEF2FF', border: '#4F46E5', text: '#4F46E5', shadow: 'rgba(79,70,229,0.2)' },
  CX:  { bg: '#ECFEFF', border: '#06B6D4', text: '#0891B2', shadow: 'rgba(6,182,212,0.2)' },
  CCX: { bg: '#F5F3FF', border: '#8B5CF6', text: '#7C3AED', shadow: 'rgba(139,92,246,0.2)' },
};

function GateBox({ cell, onClick, animDelay }: { cell: CircuitCell; onClick: (g: QuantumGate) => void; animDelay: number }) {
  const [hovered, setHovered] = useState(false);
  const g = cell.gate!;
  const colors = GATE_COLORS[g.type] ?? GATE_COLORS['X'];
  const label  = g.type === 'CX' ? 'CX' : g.type === 'CCX' ? 'CCX' : 'X';

  const cx = LABEL_W + PADDING + cell.column * CELL_W + CELL_W / 2;
  const cy = PADDING + cell.qubit * CELL_H + CELL_H / 2;

  if (cell.role === 'control') {
    return (
      <motion.circle
        cx={cx} cy={cy} r={7}
        fill={colors.border}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: animDelay, type: 'spring', stiffness: 300 }}
      />
    );
  }

  if (cell.role === 'vertical-line') return null;

  return (
    <motion.g
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(g)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: animDelay, type: 'spring', stiffness: 250, damping: 18 }}
    >
      <motion.rect
        x={cx - 22} y={cy - 16} width={44} height={32} rx={8}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={hovered ? 2 : 1.5}
        animate={{ filter: hovered ? `drop-shadow(0 4px 8px ${colors.shadow})` : 'none', y: hovered ? cy - 18 : cy - 16 }}
        transition={{ duration: 0.15 }}
      />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={colors.text} fontFamily="Inter, sans-serif">
        {label}
      </text>
    </motion.g>
  );
}

export const QuantumCircuit: React.FC<Props> = ({ layout, onGateClick, animating }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(2.5, z - e.deltaY * 0.001)));
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey) { isPanning.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; }
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      setPan(p => ({ x: p.x + e.clientX - lastPos.current.x, y: p.y + e.clientY - lastPos.current.y }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };
  const onMouseUp = () => { isPanning.current = false; };

  if (!layout || layout.numQubits === 0) return (
    <div className="flex items-center justify-center h-40 text-muted text-sm">
      Convert an expression to see the quantum circuit
    </div>
  );

  const svgW = LABEL_W + PADDING * 2 + layout.numColumns * CELL_W + CELL_W;
  const svgH = PADDING * 2 + layout.numQubits * CELL_H;

  // Vertical connector lines between controls and targets
  const vertLines: React.ReactNode[] = [];
  layout.gates.forEach((gate, gi) => {
    if (!gate.controls?.length) return;
    const all = [...gate.controls, gate.target].sort((a, b) => a - b);
    // find column index from cells
    let colIdx = -1;
    for (let q = 0; q < layout.numQubits; q++) {
      for (let c = 0; c < layout.numColumns; c++) {
        if (layout.cells[q]?.[c]?.gate?.id === gate.id && layout.cells[q]?.[c]?.role === 'gate') {
          colIdx = c; break;
        }
      }
      if (colIdx >= 0) break;
    }
    if (colIdx < 0) return;
    const cx = LABEL_W + PADDING + colIdx * CELL_W + CELL_W / 2;
    const y1 = PADDING + all[0] * CELL_H + CELL_H / 2;
    const y2 = PADDING + all[all.length - 1] * CELL_H + CELL_H / 2;
    vertLines.push(
      <motion.line
        key={`vl${gi}`}
        x1={cx} y1={y1} x2={cx} y2={y2}
        stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4,2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: gi * 0.05 + 0.1 }}
      />
    );
  });

  return (
    <div className="relative">
      {/* Controls */}
      <div className="flex items-center gap-2 mb-3 text-xs text-muted">
        <button onClick={() => setZoom(z => Math.min(z + 0.2, 2.5))} className="px-2 py-1 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors font-mono">+</button>
        <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="px-2 py-1 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors font-mono">−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-2 py-1 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors">Reset</button>
        <span className="ml-auto">Alt+drag to pan · Scroll to zoom · Click gate for details</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-200 bg-surface-50" style={{ height: Math.max(svgH * zoom + 40, 180) }}>
        <svg
          ref={svgRef}
          width={svgW * zoom}
          height={svgH * zoom}
          viewBox={`${-pan.x / zoom} ${-pan.y / zoom} ${svgW} ${svgH}`}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          style={{ display: 'block', cursor: isPanning.current ? 'grabbing' : 'default' }}
        >
          {/* Qubit wires */}
          {Array.from({ length: layout.numQubits }, (_, q) => {
            const y = PADDING + q * CELL_H + CELL_H / 2;
            const label = layout.qubitLabels[q] ?? `q${q}`;
            return (
              <g key={q}>
                <text x={LABEL_W - 8} y={y + 4} textAnchor="end" fontSize="12" fontWeight="600" fill="#475569" fontFamily="Inter,sans-serif">
                  {label}
                </text>
                <text x={8} y={y + 4} textAnchor="start" fontSize="10" fill="#94A3B8" fontFamily="JetBrains Mono,monospace">
                  q{q}
                </text>
                <motion.line
                  x1={LABEL_W} y1={y} x2={svgW - PADDING} y2={y}
                  stroke="#CBD5E1" strokeWidth={2}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: q * 0.05 }}
                />
              </g>
            );
          })}

          {/* Vertical control lines */}
          {vertLines}

          {/* Gates */}
          {layout.cells.map((row, q) =>
            row.map((cell, c) => {
              if (!cell.gate || cell.role === 'wire' || cell.role === 'vertical-line') return null;
              return (
                <GateBox
                  key={`${q}-${c}`}
                  cell={cell}
                  onClick={onGateClick}
                  animDelay={animating ? c * 0.06 + q * 0.02 : 0}
                />
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
};

export default QuantumCircuit;
