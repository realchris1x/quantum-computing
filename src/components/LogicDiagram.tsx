import React from 'react';
import { motion } from 'framer-motion';
import type { ASTNode } from '../engine/parser';


interface Props { ast: ASTNode | null; }

// ── SVG Gate Drawing Helpers ──────────────────────────────────

const GATE_W = 40, GATE_H = 30;
const AND_COLOR  = '#4F46E5';
const OR_COLOR   = '#06B6D4';
const XOR_COLOR  = '#8B5CF6';
const NOT_COLOR  = '#EF4444';
const WIRE_COLOR = '#CBD5E1';

interface LayoutNode {
  id: number;
  type: string;
  x: number; y: number;
  children: number[];
  label?: string;
}

interface Layout { nodes: LayoutNode[]; width: number; height: number; }

let nodeId = 0;
function buildLayout(ast: ASTNode): Layout {
  nodeId = 0;
  const nodes: LayoutNode[] = [];

  function layout(node: ASTNode, depth: number, slot: number): { id: number; slotWidth: number } {
    const id = nodeId++;
    const n: LayoutNode = { id, type: node.type, x: 0, y: depth * 80 + 40, children: [], label: node.name };
    nodes.push(n);

    if (node.type === 'VAR') {
      n.x = slot * 60 + 50;
      return { id, slotWidth: 1 };
    }

    const childNodes = node.type === 'NOT'
      ? [node.operand!]
      : [node.left!, node.right!];

    let totalSlots = 0;
    const childResults: { id: number; slotWidth: number }[] = [];
    childNodes.forEach(child => {
      const r = layout(child, depth + 1, slot + totalSlots);
      childResults.push(r);
      nodes.find(nd => nd.id === r.id)!.x = (slot + totalSlots + r.slotWidth / 2) * 60 + 50;
      n.children.push(r.id);
      totalSlots += r.slotWidth;
    });

    n.x = (slot + totalSlots / 2) * 60 + 50;
    return { id, slotWidth: totalSlots };
  }

  layout(ast, 0, 0);
  const maxX = Math.max(...nodes.map(n => n.x)) + 60;
  const maxY = Math.max(...nodes.map(n => n.y)) + 60;

  return { nodes, width: maxX, height: maxY };
}

function GateSymbol({ type, x, y }: { type: string; x: number; y: number }) {
  const hw = GATE_W / 2, hh = GATE_H / 2;
  switch (type) {
    case 'AND':
      return <g transform={`translate(${x - hw},${y - hh})`}>
        <path d={`M0,0 L${GATE_W * 0.4},0 A${hh},${hh} 0 0,1 ${GATE_W * 0.4},${GATE_H} L0,${GATE_H} Z`}
          fill={AND_COLOR} opacity={0.15} stroke={AND_COLOR} strokeWidth={1.5} />
        <text x={GATE_W * 0.2} y={GATE_H / 2 + 4} fontSize="9" fill={AND_COLOR} fontWeight="bold" textAnchor="middle">AND</text>
      </g>;
    case 'OR':
      return <g transform={`translate(${x - hw},${y - hh})`}>
        <path d={`M0,0 Q${GATE_W * 0.3},0 ${GATE_W},${GATE_H / 2} Q${GATE_W * 0.3},${GATE_H} 0,${GATE_H} Q${GATE_W * 0.5},${GATE_H / 2} 0,0`}
          fill={OR_COLOR} opacity={0.15} stroke={OR_COLOR} strokeWidth={1.5} />
        <text x={GATE_W * 0.45} y={GATE_H / 2 + 4} fontSize="9" fill={OR_COLOR} fontWeight="bold" textAnchor="middle">OR</text>
      </g>;
    case 'XOR':
      return <g transform={`translate(${x - hw},${y - hh})`}>
        <path d={`M0,2 Q${GATE_W * 0.3},2 ${GATE_W},${GATE_H / 2} Q${GATE_W * 0.3},${GATE_H - 2} 0,${GATE_H - 2} Q${GATE_W * 0.5},${GATE_H / 2} 0,2`}
          fill={XOR_COLOR} opacity={0.15} stroke={XOR_COLOR} strokeWidth={1.5} />
        <path d={`M-5,2 Q${GATE_W * 0.12},${GATE_H / 2} -5,${GATE_H - 2}`} fill="none" stroke={XOR_COLOR} strokeWidth={1.5} />
        <text x={GATE_W * 0.45} y={GATE_H / 2 + 4} fontSize="9" fill={XOR_COLOR} fontWeight="bold" textAnchor="middle">XOR</text>
      </g>;
    case 'NOT':
      return <g>
        <polygon points={`${x - hw},${y - hh} ${x + hw * 0.6},${y} ${x - hw},${y + hh}`}
          fill={NOT_COLOR} opacity={0.15} stroke={NOT_COLOR} strokeWidth={1.5} />
        <circle cx={x + hw * 0.7} cy={y} r={4} fill="white" stroke={NOT_COLOR} strokeWidth={1.5} />
        <text x={x - hw * 0.2} y={y + 4} fontSize="9" fill={NOT_COLOR} fontWeight="bold" textAnchor="middle">NOT</text>
      </g>;
    case 'VAR':
      return <g>
        <rect x={x - 12} y={y - 14} width={24} height={28} rx={6} fill="#EEF2FF" stroke="#4F46E5" strokeWidth={1.5} />
        <text x={x} y={y + 5} fontSize="12" fill="#4F46E5" fontWeight="bold" textAnchor="middle">{}</text>
      </g>;
    default: return null;
  }
}

export const LogicDiagram: React.FC<Props> = ({ ast }) => {
  if (!ast) return (
    <div className="flex items-center justify-center h-32 text-muted text-sm">
      Enter a Boolean expression to see the logic diagram
    </div>
  );

  const layout = buildLayout(ast);
  // Flip Y so inputs are at bottom
  const flipped = layout.nodes.map(n => ({ ...n, y: layout.height - n.y + 20 }));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`-10 0 ${layout.width + 20} ${layout.height + 40}`}
        width={Math.max(layout.width + 20, 400)}
        height={layout.height + 40}
        className="mx-auto"
      >
        {/* Wires */}
        {flipped.map(node => {
          if (node.type === 'VAR') return null;
          return node.children.map(cid => {
            const child = flipped.find(n => n.id === cid)!;
            return (
              <motion.line
                key={`w${node.id}-${cid}`}
                x1={node.x} y1={node.y}
                x2={child.x} y2={child.y}
                stroke={WIRE_COLOR} strokeWidth={2}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
            );
          });
        })}

        {/* Nodes */}
        {flipped.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 + 0.1, type: 'spring', stiffness: 200 }}
          >
            <GateSymbol type={node.type} x={node.x} y={node.y} />
            {node.type === 'VAR' && (
              <text x={node.x} y={node.y + 5} fontSize="12" fill="#4F46E5" fontWeight="bold" textAnchor="middle">
                {node.label}
              </text>
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  );
};

export default LogicDiagram;
