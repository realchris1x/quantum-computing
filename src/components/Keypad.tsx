import React, { useCallback } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onKey: (key: string) => void;
  onConvert: () => void;
  onClear: () => void;
  onBackspace: () => void;
  isConverting: boolean;
}

type Key = { label: string; value: string; cls?: string; wide?: boolean; action?: string };

const KEYS: Key[][] = [
  [
    { label: 'A', value: 'A', cls: 'var' },
    { label: 'B', value: 'B', cls: 'var' },
    { label: 'C', value: 'C', cls: 'var' },
    { label: 'D', value: 'D', cls: 'var' },
  ],
  [
    { label: 'AND', value: ' AND ', cls: 'op' },
    { label: 'OR',  value: ' OR ',  cls: 'op' },
    { label: 'NOT', value: 'NOT ',  cls: 'op' },
    { label: 'XOR', value: ' XOR ', cls: 'op' },
  ],
  [
    { label: '(',  value: '(',  cls: 'paren' },
    { label: ')',  value: ')',  cls: 'paren' },
    { label: '⌫',  value: '',   cls: 'danger', action: 'backspace' },
    { label: 'CLR', value: '',  cls: 'danger', action: 'clear' },
  ],
];

function addRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const ripple = document.createElement('span');
  const rect   = btn.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height);
  ripple.className = 'ripple';
  ripple.style.cssText = `
    width: ${size}px; height: ${size}px;
    left: ${e.clientX - rect.left - size / 2}px;
    top:  ${e.clientY - rect.top  - size / 2}px;
  `;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

const clsMap: Record<string, string> = {
  var:    'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-transparent font-bold',
  op:     'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-600 hover:text-white hover:border-transparent font-bold',
  paren:  'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-600 hover:text-white hover:border-transparent font-bold',
  danger: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-500 hover:text-white hover:border-transparent font-semibold',
};

export const Keypad: React.FC<Props> = ({ onKey, onConvert, onClear, onBackspace, isConverting }) => {
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, key: Key) => {
    addRipple(e);
    if (key.action === 'clear') onClear();
    else if (key.action === 'backspace') onBackspace();
    else onKey(key.value);
  }, [onKey, onClear, onBackspace]);

  return (
    <div className="select-none">
      <div className="grid gap-2">
        {KEYS.map((row, ri) => (
          <div key={ri} className="grid grid-cols-4 gap-2">
            {row.map((key, ki) => (
              <motion.button
                key={ki}
                whileTap={{ scale: 0.94 }}
                onClick={e => handleClick(e, key)}
                className={`relative keypad-btn overflow-hidden border transition-all duration-150 ${clsMap[key.cls ?? ''] ?? 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}
              >
                {key.label}
              </motion.button>
            ))}
          </div>
        ))}

        {/* Convert button */}
        <div className="grid grid-cols-4 gap-2 mt-1">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={onConvert}
            disabled={isConverting}
            className="col-span-4 relative h-12 convert-btn rounded-xl text-white font-bold text-sm
                       tracking-wide shadow-glow transition-all duration-300 disabled:opacity-60
                       disabled:cursor-not-allowed overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isConverting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Converting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Convert to Quantum
                </>
              )}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <p className="text-center text-xs text-muted mt-2">
        Keyboard: type expression directly · <kbd className="px-1 py-0.5 bg-surface-100 rounded text-xs">Enter</kbd> to convert
      </p>
    </div>
  );
};

export default Keypad;
