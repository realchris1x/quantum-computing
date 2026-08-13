import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Engine
import { parseExpression, validateExpression, astToString } from './engine/parser';
import type { ASTNode } from './engine/parser';
import { simplify } from './engine/simplifier';
import { generateTruthTable } from './engine/truthTable';
import type { TruthTable as TTType } from './engine/truthTable';
import { mapToPolyX } from './engine/polyXMapper';
import type { GateSequence, QuantumGate } from './engine/polyXMapper';
import { buildCircuitLayout } from './engine/circuitBuilder';
import type { CircuitLayout } from './engine/circuitBuilder';
import { STATE_ZERO, STATE_ONE } from './engine/blochState';
import type { QubitState } from './engine/blochState';


// Components
import BooleanInput from './components/BooleanInput';
import Keypad from './components/Keypad';
import SimplificationPanel from './components/SimplificationPanel';
import LogicDiagram from './components/LogicDiagram';
import PolyXTable from './components/PolyXTable';
import QuantumCircuit from './components/QuantumCircuit';
import BlochSphere from './components/BlochSphere';
import GateInspector from './components/GateInspector';
import TruthTable from './components/TruthTable';
import ConversionPipeline from './components/ConversionPipeline';
import ExportPanel from './components/ExportPanel';

// ─── Types ────────────────────────────────────────────────────

interface ConversionResult {
  ast: ASTNode;
  simplifiedAst: ASTNode;
  simplificationSteps: ReturnType<typeof simplify>['steps'];
  truthTable: TTType;
  gateSequence: GateSequence;
  circuitLayout: CircuitLayout;
}

// ─── Section Wrapper ─────────────────────────────────────────

const Section: React.FC<{ title: string; icon: string; badge?: string; children: React.ReactNode; id?: string }> =
  ({ title, icon, badge, children, id }) => (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card p-6"
    >
      <div className="section-header">
        <div className="section-dot" />
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</h2>
        <span className="text-base">{icon}</span>
        {badge && (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {badge}
          </span>
        )}
      </div>
      {children}
    </motion.section>
  );

// ─── Collapsible Section ──────────────────────────────────────

const CollapsibleSection: React.FC<{ title: string; icon: string; badge?: string; children: React.ReactNode; id?: string; defaultOpen?: boolean }> =
  ({ title, icon, badge, children, id, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <motion.section
        id={id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-2 p-6 text-left hover:bg-surface-50/80 transition-colors"
        >
          <div className="section-dot" />
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex-1">{title}</h2>
          <span className="text-base">{icon}</span>
          {badge && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{badge}</span>
          )}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted text-sm ml-2"
          >▼</motion.span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    );
  };

// ─── Main App ─────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { label: 'Boolean Expression',  icon: '✏️' },
  { label: 'Parser',              icon: '🔍' },
  { label: 'AST Builder',         icon: '🌳' },
  { label: 'Simplifier',          icon: '✨' },
  { label: 'Truth Table',         icon: '📊' },
  { label: 'Poly-X Mapping',      icon: '⚛' },
  { label: 'Quantum Circuit',     icon: '🔬' },
  { label: 'Bloch Sphere',        icon: '🌐' },
  { label: 'Export Ready',        icon: '📤' },
];

const EXAMPLE_EXPRS = ['A XOR B', 'NOT A', 'A AND B', '(A OR B) AND C', '(A XOR B) AND C', 'NOT (A AND B)'];

function App() {
  const [expr, setExpr]           = useState('A XOR B');
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<ConversionResult | null>(null);
  const [converting, setConverting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [selectedGate, setSelectedGate] = useState<QuantumGate | null>(null);
  const [activeTab, setActiveTab] = useState<'simplify' | 'truth' | 'diagram'>('simplify');

  // Bloch sphere state
  const [qubitState, setQubitState]       = useState<QubitState>(STATE_ZERO);
  const [targetState, setTargetState]     = useState<QubitState | null>(null);
  const [blochAnimating, setBlochAnimating] = useState(false);

  const circuitRef = useRef<HTMLDivElement>(null);

  // Validate on input change
  useEffect(() => {
    const v = validateExpression(expr);
    setError(v.valid || !expr.trim() ? null : v.error ?? null);
  }, [expr]);

  // Keyboard shortcut: Enter → convert
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        // Only if focus is not in textarea
        if (document.activeElement?.tagName !== 'TEXTAREA') convert();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleKeypadKey = (key: string) => setExpr(prev => prev + key);
  const handleClear     = () => { setExpr(''); setError(null); setResult(null); setPipelineStep(-1); };
  const handleBackspace = () => setExpr(prev => prev.slice(0, -1));

  // ── Conversion ───────────────────────────────────────────────
  const convert = useCallback(async () => {
    if (!expr.trim() || error) return;
    setConverting(true);
    setPipelineStep(0);
    setResult(null);
    setSelectedGate(null);

    // Simulate animated pipeline progression (unused directly but drives visual)
    void (async () => {
      for (let i = 0; i <= 8; i++) {
        setPipelineStep(i);
        await new Promise(r => setTimeout(r, 80));
      }
    })();


    try {
      // Step 1: Parse
      const ast = parseExpression(expr);
      setPipelineStep(1);

      // Step 2: AST
      setPipelineStep(2);

      // Step 3: Simplify
      const { steps: simpSteps, result: simplified } = simplify(ast);
      setPipelineStep(3);

      // Step 4: Truth Table
      const tt = generateTruthTable(ast);
      setPipelineStep(4);

      // Step 5: Poly-X Map
      const gateSeq = mapToPolyX(simplified);
      setPipelineStep(5);

      // Step 6: Circuit Layout
      const layout = buildCircuitLayout(gateSeq);
      setPipelineStep(6);

      // Step 7: Bloch
      setPipelineStep(7);

      setResult({
        ast,
        simplifiedAst: simplified,
        simplificationSteps: simpSteps,
        truthTable: tt,
        gateSequence: gateSeq,
        circuitLayout: layout,
      });

      // Animate bloch sphere: determine state change
      const hasNotGate = gateSeq.gates.some(g => g.type === 'X' && g.booleanOrigin === 'NOT');
      if (hasNotGate || gateSeq.gates.some(g => g.type === 'X')) {
        setQubitState(STATE_ZERO);
        setTargetState(STATE_ONE);
        setBlochAnimating(true);
        setTimeout(() => {
          setQubitState(STATE_ONE);
          setBlochAnimating(false);
          setTargetState(null);
        }, 700);
      } else {
        setQubitState(STATE_ZERO);
        setTargetState(null);
        setBlochAnimating(false);
      }

      setPipelineStep(8);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setConverting(false);
    }
  }, [expr, error]);

  // Pipeline steps enriched with status
  const pipelineStepsEnriched = PIPELINE_STEPS.map((s, i) => ({
    ...s,
    done:   pipelineStep > i,
    active: pipelineStep === i && converting,
  }));

  return (
    <div className="min-h-screen bg-surface-50">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-surface-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <span className="text-white text-sm font-bold">⚛</span>
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text leading-none">Poly-X Quantum</h1>
              <p className="text-xs text-muted leading-none mt-0.5">Logic Converter</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            {['Input', 'Diagram', 'Circuit', 'Bloch', 'Export'].map(tab => (
              <a key={tab} href={`#${tab.toLowerCase()}`}
                className="px-3 py-1.5 text-sm font-medium text-muted hover:text-primary hover:bg-primary/8 rounded-lg transition-all duration-150">
                {tab}
              </a>
            ))}
          </nav>

          {/* Status pill */}
          <div className="ml-auto flex items-center gap-3">
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/12 text-success text-xs font-semibold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow" />
                  {result.gateSequence.gates.length} gates generated
                </motion.div>
              )}
            </AnimatePresence>
            <div className="text-xs text-muted hidden lg:block">
              <kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs">Enter</kbd> to convert
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Layout ───────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

          {/* ── Left Column ─────────────────────────────── */}
          <div className="space-y-6">

            {/* Input + Keypad */}
            <Section title="Boolean Expression" icon="✏️" id="input">
              {/* Examples */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {EXAMPLE_EXPRS.map(ex => (
                  <button key={ex} onClick={() => setExpr(ex)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-primary/8 text-primary hover:bg-primary hover:text-white transition-all duration-150 font-mono font-medium">
                    {ex}
                  </button>
                ))}
              </div>

              <BooleanInput value={expr} onChange={setExpr} error={error} />

              <div className="mt-5">
                <Keypad
                  onKey={handleKeypadKey}
                  onConvert={convert}
                  onClear={handleClear}
                  onBackspace={handleBackspace}
                  isConverting={converting}
                />
              </div>
            </Section>

            {/* Results — only shown after conversion */}
            <AnimatePresence>
              {result && (
                <>
                  {/* Tabs: Simplification / Truth Table / Logic Diagram */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6" id="diagram">
                    <div className="section-header">
                      <div className="section-dot" />
                      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Analysis</h2>
                      <span className="text-base">🔬</span>
                    </div>

                    {/* Tab bar */}
                    <div className="flex gap-1 p-1 bg-surface-100 rounded-xl mb-5 w-fit">
                      {(['simplify', 'truth', 'diagram'] as const).map(t => (
                        <button key={t} onClick={() => setActiveTab(t)}
                          className={`tab-btn ${activeTab === t ? 'active' : ''}`}>
                          {t === 'simplify' ? '✨ Simplification' : t === 'truth' ? '📊 Truth Table' : '🖧 Logic Diagram'}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {activeTab === 'simplify' && (
                        <motion.div key="simplify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <SimplificationPanel
                            original={astToString(result.ast)}
                            steps={result.simplificationSteps}
                            result={astToString(result.simplifiedAst)}
                          />
                        </motion.div>
                      )}
                      {activeTab === 'truth' && (
                        <motion.div key="truth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <TruthTable table={result.truthTable} />
                        </motion.div>
                      )}
                      {activeTab === 'diagram' && (
                        <motion.div key="diagram" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <LogicDiagram ast={result.ast} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Poly-X Mapping Table */}
                  <CollapsibleSection title="Poly-X Gate Mapping" icon="⚛" id="mapping">
                    <PolyXTable />
                  </CollapsibleSection>

                  {/* Quantum Circuit */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6" id="circuit">
                    <div className="section-header">
                      <div className="section-dot" />
                      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Quantum Circuit</h2>
                      <span className="text-base">🔬</span>
                      <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        {result.gateSequence.gates.length} gates · {result.circuitLayout.numQubits} qubits
                      </span>
                    </div>
                    <div ref={circuitRef}>
                      <QuantumCircuit
                        layout={result.circuitLayout}
                        onGateClick={setSelectedGate}
                        animating={converting}
                      />
                    </div>
                  </motion.div>

                  {/* Bloch Sphere */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6" id="bloch">
                    <div className="section-header">
                      <div className="section-dot" />
                      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Bloch Sphere</h2>
                      <span className="text-base">🌐</span>
                      <span className="ml-auto text-xs text-muted">Interactive 3D · Drag to rotate</span>
                    </div>
                    <BlochSphere
                      state={qubitState}
                      targetState={targetState}
                      animating={blochAnimating}
                      onAnimEnd={() => setBlochAnimating(false)}
                    />
                  </motion.div>

                  {/* Export */}
                  <CollapsibleSection title="Export" icon="📤" id="export">
                     <ExportPanel
                       circuitRef={circuitRef as React.RefObject<HTMLDivElement>}
                      gateSequence={result.gateSequence}
                      expression={expr}
                    />
                  </CollapsibleSection>
                </>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!result && !converting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-12 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚛</span>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">Ready to Convert</h3>
                <p className="text-sm text-muted max-w-sm mx-auto">
                  Enter a Boolean expression or pick an example above, then press <strong>Convert to Quantum</strong>.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted">
                  <span className="px-2 py-1 rounded-lg bg-surface-100">X Gate → NOT</span>
                  <span className="px-2 py-1 rounded-lg bg-surface-100">CNOT → XOR</span>
                  <span className="px-2 py-1 rounded-lg bg-surface-100">Toffoli → AND</span>
                  <span className="px-2 py-1 rounded-lg bg-surface-100">De Morgan → OR</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right Sidebar ───────────────────────────── */}
          <aside className="space-y-6">
            {/* Conversion Pipeline */}
            <Section title="Conversion Pipeline" icon="🔄">
              <ConversionPipeline steps={pipelineStepsEnriched} />
            </Section>

            {/* Quick Reference */}
            <Section title="Gate Reference" icon="📖">
              <div className="space-y-2 text-xs">
                {[
                  { gate: 'X',   color: '#4F46E5', desc: 'Pauli-X (NOT)',        op: 'π rotation, X-axis' },
                  { gate: 'CX',  color: '#06B6D4', desc: 'Controlled-X (XOR)',   op: 'Conditioned X gate' },
                  { gate: 'CCX', color: '#8B5CF6', desc: 'Toffoli (AND)',         op: '2-controlled X gate' },
                  { gate: 'De M',color: '#10B981', desc: 'De Morgan (OR)',        op: 'NOT(NOT·NOT) decomp.' },
                ].map(r => (
                  <div key={r.gate} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-50 transition-colors">
                    <span className="w-8 h-6 flex items-center justify-center rounded text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: r.color }}>
                      {r.gate}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-700 truncate">{r.desc}</p>
                      <p className="text-muted truncate">{r.op}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Keyboard Shortcuts */}
            <Section title="Shortcuts" icon="⌨️">
              <div className="space-y-2 text-xs">
                {[
                  ['Enter', 'Convert expression'],
                  ['Ctrl+Z', 'Undo'],
                  ['Ctrl+Y', 'Redo'],
                  ['Alt+Drag', 'Pan circuit'],
                  ['Scroll', 'Zoom circuit'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <kbd className="px-2 py-0.5 bg-surface-100 rounded font-mono text-slate-700">{key}</kbd>
                    <span className="text-muted">{desc}</span>
                  </div>
                ))}
              </div>
            </Section>
          </aside>
        </div>
      </main>

      {/* Gate Inspector (floating panel) */}
      <GateInspector gate={selectedGate} onClose={() => setSelectedGate(null)} />
    </div>
  );
}

export default App;
