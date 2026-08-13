import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokenize } from '../engine/parser';
import type { Token } from '../engine/parser';
import { AnimatePresence } from 'framer-motion';

interface Props {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
}

function colorizeTokens(text: string): React.ReactNode[] {
  let tokens: Token[];
  try { tokens = tokenize(text); } catch { return [<span key="0">{text}</span>]; }

  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;

  tokens.forEach((tok, i) => {
    if (tok.type === 'EOF') return;
    if (tok.pos > lastIdx) {
      nodes.push(<span key={`gap${i}`}>{text.slice(lastIdx, tok.pos)}</span>);
    }
    const word = text.slice(tok.pos, tok.pos + tok.value.length);
    let cls = '';
    if (tok.type === 'VAR') cls = 'token-var';
    else if (['AND','OR','NOT','XOR'].includes(tok.type)) cls = 'token-op';
    else if (['LPAREN','RPAREN'].includes(tok.type)) cls = 'token-paren';
    nodes.push(<span key={`tok${i}`} className={cls}>{word}</span>);
    lastIdx = tok.pos + tok.value.length;
  });

  if (lastIdx < text.length) nodes.push(<span key="end">{text.slice(lastIdx)}</span>);
  return nodes;
}

export const BooleanInput: React.FC<Props> = ({ value, onChange, error }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef  = useRef<string[]>([value]);
  const historyIdx  = useRef(0);

  const pushHistory = useCallback((v: string) => {
    const hist = historyRef.current.slice(0, historyIdx.current + 1);
    hist.push(v);
    historyRef.current = hist.slice(-50);
    historyIdx.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIdx.current > 0) {
      historyIdx.current--;
      onChange(historyRef.current[historyIdx.current]);
    }
  }, [onChange]);

  const redo = useCallback(() => {
    if (historyIdx.current < historyRef.current.length - 1) {
      historyIdx.current++;
      onChange(historyRef.current[historyIdx.current]);
    }
  }, [onChange]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') { e.preventDefault(); undo(); }
      if (e.key === 'y') { e.preventDefault(); redo(); }
    }
  }, [undo, redo]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    pushHistory(v);
    onChange(v);
  };

  const handleBlur = () => {
    const spaced = value
      .replace(/\s+/g, ' ')
      .replace(/\s*(AND|OR|NOT|XOR)\s*/gi, ' $1 ')
      .replace(/\s*\(\s*/g, ' (')
      .replace(/\s*\)\s*/g, ') ')
      .replace(/\s+/g, ' ')
      .trim();
    if (spaced !== value) { pushHistory(spaced); onChange(spaced); }
  };

  const isValid = value.trim() && !error;

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-0 p-4 font-mono text-base pointer-events-none rounded-xl overflow-hidden whitespace-pre-wrap break-words leading-7"
        style={{ wordBreak: 'break-all' }}
      >
        {value ? colorizeTokens(value) : <span className="text-slate-300">A XOR (B AND C)</span>}
      </div>

      <textarea
        ref={textareaRef}
        id="boolean-input"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKey}
        spellCheck={false}
        rows={3}
        className="relative w-full p-4 font-mono text-base rounded-xl border-2 resize-none
                   bg-transparent text-transparent caret-primary leading-7
                   transition-all duration-200 outline-none focus:ring-0"
        style={{
          borderColor: error ? '#EF4444' : isValid ? '#4F46E5' : '#E2E8F0',
          boxShadow: error
            ? '0 0 0 3px rgba(239,68,68,0.1)'
            : isValid
              ? '0 0 0 3px rgba(79,70,229,0.08)'
              : undefined,
        }}
        placeholder=""
      />

      <div className="flex items-center justify-between mt-2 px-1">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.span
              key="err"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-medium text-danger flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" />
              </svg>
              {error}
            </motion.span>
          ) : isValid ? (
            <motion.span
              key="ok"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-medium text-success flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              Valid expression
            </motion.span>
          ) : (
            <span key="hint" className="text-xs text-muted">
              Use AND, OR, NOT, XOR with variables A–D
            </span>
          )}
        </AnimatePresence>
        <div className="flex gap-2">
          <button onClick={undo} title="Undo (Ctrl+Z)" className="text-muted hover:text-primary transition-colors text-xs">↩ Undo</button>
          <button onClick={redo} title="Redo (Ctrl+Y)" className="text-muted hover:text-primary transition-colors text-xs">Redo ↪</button>
        </div>
      </div>
    </div>
  );
};

export default BooleanInput;
