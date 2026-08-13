import React from 'react';
import { motion } from 'framer-motion';
import type { TruthTable as TTType } from '../engine/truthTable';


interface Props { table: TTType; }

export const TruthTable: React.FC<Props> = ({ table }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {table.variables.map(v => (
              <th key={v} className="px-4 py-2 text-left font-bold text-primary bg-primary/8 border-b border-primary/20 font-mono">
                {v}
              </th>
            ))}
            <th className="px-4 py-2 text-left font-bold text-accent bg-accent/8 border-b border-accent/20 font-mono">
              OUT
            </th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-surface-100 hover:bg-primary/4 transition-colors"
            >
              {table.variables.map(v => (
                <td key={v} className="px-4 py-2 font-mono font-medium text-slate-700">
                  <span className={`inline-flex w-5 h-5 items-center justify-center rounded text-xs font-bold ${row.inputs[v] ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                    {row.inputs[v] ? '1' : '0'}
                  </span>
                </td>
              ))}
              <td className="px-4 py-2 font-mono font-bold">
                <span className={`inline-flex w-5 h-5 items-center justify-center rounded text-xs font-bold ${row.output ? 'bg-accent text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {row.output ? '1' : '0'}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TruthTable;
