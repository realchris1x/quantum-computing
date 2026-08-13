import React from 'react';
import { motion } from 'framer-motion';
import type { SimplificationStep } from '../engine/simplifier';


interface Props {
  original: string;
  steps: SimplificationStep[];
  result: string;
}

export const SimplificationPanel: React.FC<Props> = ({ original, steps, result }) => {
  const noChange = steps.length === 0;

  return (
    <div className="space-y-3">
      {/* Original */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 border border-surface-200">
        <span className="shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">O</span>
        <div>
          <p className="text-xs text-muted mb-1">Original</p>
          <code className="text-sm font-mono font-medium text-slate-800">{original}</code>
        </div>
      </div>

      {noChange ? (
        <div className="text-center py-4 text-sm text-muted">
          <span className="text-success font-medium">✓ Already in simplest form</span>
        </div>
      ) : (
        <>
          {/* Steps */}
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 p-3 rounded-xl border border-primary/20 bg-primary/4"
            >
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-primary font-medium mb-1">{step.rule}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs font-mono text-slate-500 line-through">{step.before}</code>
                  <span className="text-primary">→</span>
                  <code className="text-xs font-mono text-slate-800 font-semibold">{step.after}</code>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Result */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: steps.length * 0.08 + 0.1 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-success/8 border border-success/30"
          >
            <span className="shrink-0 w-6 h-6 rounded-full bg-success text-white text-xs font-bold flex items-center justify-center mt-0.5">✓</span>
            <div>
              <p className="text-xs text-success font-medium mb-1">Simplified Result</p>
              <code className="text-sm font-mono font-bold text-slate-800">{result}</code>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default SimplificationPanel;
