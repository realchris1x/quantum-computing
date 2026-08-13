import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import type { GateSequence } from '../engine/polyXMapper';
import { exportQASM, exportQiskit, exportJSON } from '../engine/qasmExporter';


interface Props {
  circuitRef: React.RefObject<HTMLDivElement>;
  gateSequence: GateSequence | null;
  expression: string;
}

function download(content: string, filename: string, mime: string) {
  const blob = new URL(URL.createObjectURL(new Blob([content], { type: mime })));
  const a = document.createElement('a');
  a.href = blob.href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blob.href);
}

async function downloadPNG(el: HTMLElement) {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#F8FAFC' });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'quantum-circuit.png';
    a.click();
  } catch (e) { alert('PNG export requires html2canvas'); }
}

const buttons = [
  { id: 'png',   label: 'PNG',        icon: '🖼',  color: 'bg-indigo-500 hover:bg-indigo-600' },
  { id: 'json',  label: 'JSON',       icon: '📋',  color: 'bg-slate-600 hover:bg-slate-700' },
  { id: 'qasm',  label: 'OpenQASM',   icon: '⚛',   color: 'bg-violet-500 hover:bg-violet-600' },
  { id: 'qiskit',label: 'Qiskit',     icon: '🐍',  color: 'bg-cyan-500 hover:bg-cyan-600' },
];

export const ExportPanel: React.FC<Props> = ({ circuitRef, gateSequence, expression }) => {
  const [exported, setExported] = React.useState<string | null>(null);
  const [exportType, setExportType] = React.useState<string>('');

  const handle = useCallback(async (type: string) => {
    if (!gateSequence) return;
    switch (type) {
      case 'png':
        if (circuitRef.current) await downloadPNG(circuitRef.current);
        break;
      case 'json':
        download(exportJSON(gateSequence, expression), 'circuit.json', 'application/json');
        break;
      case 'qasm':
        const qasm = exportQASM(gateSequence);
        setExported(qasm); setExportType('OpenQASM');
        download(qasm, 'circuit.qasm', 'text/plain');
        break;
      case 'qiskit':
        const py = exportQiskit(gateSequence);
        setExported(py); setExportType('Qiskit Python');
        download(py, 'circuit.py', 'text/plain');
        break;
    }
  }, [gateSequence, expression, circuitRef]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {buttons.map((btn) => (

          <motion.button
            key={btn.id}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handle(btn.id)}
            disabled={!gateSequence}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200
                        ${btn.color} disabled:opacity-40 disabled:cursor-not-allowed shadow-sm`}
          >
            <span>{btn.icon}</span>
            {btn.label}
          </motion.button>
        ))}
      </div>

      {exported && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-surface-200 bg-dark-900 text-green-400 p-4 text-xs font-mono overflow-auto max-h-48"
        >
          <div className="flex items-center justify-between mb-2 text-slate-400">
            <span className="font-sans text-xs">{exportType} Preview</span>
            <button
              onClick={() => navigator.clipboard.writeText(exported)}
              className="text-xs hover:text-white transition-colors font-sans"
            >Copy</button>
          </div>
          <pre className="whitespace-pre overflow-x-auto">{exported}</pre>
        </motion.div>
      )}
    </div>
  );
};

export default ExportPanel;
