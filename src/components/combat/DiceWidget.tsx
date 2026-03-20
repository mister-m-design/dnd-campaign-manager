
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Dices, ChevronDown, ChevronUp, RotateCcw, Minus, Plus } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface DieEntry {
  count: number;
  sides: number;
}

export type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';

export interface DiceRollResult {
  formula: string;
  rolls: number[];
  droppedRolls?: number[];
  modifier: number;
  total: number;
  advantageMode?: AdvantageMode;
}

interface RollHistoryEntry extends DiceRollResult {
  id: string;
  timestamp: number;
}

export interface DiceWidgetProps {
  /** Controlled open state */
  isOpen: boolean;
  /** Called when the user clicks the ✕ close button */
  onClose: () => void;
  /**
   * Called whenever any roll is made.
   * In combat context this should be wired to auto-confirm the active roll step.
   */
  onRoll?: (result: DiceRollResult) => void;
  /**
   * Formula to pre-load when opening in a combat context, e.g. "1d20", "2d6+4".
   * Changing this reloads the dice builder.
   */
  preloadFormula?: string;
  /**
   * Label shown in the header when operating in a specific combat context,
   * e.g. "Attack Roll", "Bite Damage".
   */
  contextLabel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function parseFormulaStr(formula: string): { dice: DieEntry[]; modifier: number } {
  const dice: DieEntry[] = [];
  let modifier = 0;
  const diceRegex = /(\d+)d(\d+)/gi;
  let m: RegExpExecArray | null;
  while ((m = diceRegex.exec(formula)) !== null) {
    const existing = dice.find(d => d.sides === parseInt(m![2]));
    if (existing) existing.count += parseInt(m![1]);
    else dice.push({ count: parseInt(m![1]), sides: parseInt(m![2]) });
  }
  const withoutDice = formula.replace(/\d+d\d+/gi, '').replace(/\s/g, '');
  const modParts = withoutDice.matchAll(/([+-]\d+)/g);
  for (const mp of modParts) modifier += parseInt(mp[1]);
  return { dice, modifier };
}

// ─────────────────────────────────────────────────────────────────────────────
// DIE FACE SVGs
// ─────────────────────────────────────────────────────────────────────────────

const DIE_SHAPES: Record<number, React.ReactNode> = {
  4:  <polygon points="12,2 22,20 2,20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  6:  <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />,
  8:  <polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  10: <polygon points="12,2 22,9 18,21 6,21 2,9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  12: <polygon points="12,2 20,6 22,15 17,21 7,21 2,15 4,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  20: <polygon points="12,2 21,8 21,16 12,22 3,16 3,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  100:<text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="900" fill="currentColor">%</text>,
};

function DieSvg({ sides, className }: { sides: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'}>
      {DIE_SHAPES[sides] ?? <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DIE_SIZES = [4, 6, 8, 10, 12, 20, 100];

const DIE_COLORS: Record<number, string> = {
  4:   'text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20',
  6:   'text-sky-400    border-sky-500/30    bg-sky-500/10    hover:bg-sky-500/20',
  8:   'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20',
  10:  'text-amber-400  border-amber-500/30  bg-amber-500/10  hover:bg-amber-500/20',
  12:  'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20',
  20:  'text-red-400    border-red-500/30    bg-red-500/10    hover:bg-red-500/20',
  100: 'text-slate-300  border-slate-500/30  bg-slate-500/10  hover:bg-slate-500/20',
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN WIDGET
// ─────────────────────────────────────────────────────────────────────────────

export default function DiceWidget({ isOpen, onClose, onRoll, preloadFormula, contextLabel }: DiceWidgetProps) {
  const [isBodyOpen, setIsBodyOpen] = useState(true);
  const [dice, setDice] = useState<DieEntry[]>([]);
  const [modifier, setModifier] = useState(0);
  const [history, setHistory] = useState<RollHistoryEntry[]>([]);
  const [latestResult, setLatestResult] = useState<RollHistoryEntry | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [justRolled, setJustRolled] = useState(false);
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  const isContextMode = !!contextLabel;

  // ── Auto-load dice when preloadFormula changes ────────────────────────────
  useEffect(() => {
    if (!preloadFormula) return;
    const parsed = parseFormulaStr(preloadFormula);
    setDice(parsed.dice);
    setModifier(parsed.modifier);
    setLatestResult(null);
    setJustRolled(false);
    setIsBodyOpen(true);
    setAdvantageMode('normal');
  }, [preloadFormula]);

  // ── Build formula string ──────────────────────────────────────────────────
  const formula = (() => {
    const parts = dice.map(d => `${d.count}d${d.sides}`);
    if (modifier > 0) parts.push(`+${modifier}`);
    if (modifier < 0) parts.push(String(modifier));
    return parts.join('+') || '—';
  })();

  // ── Add / remove dice ─────────────────────────────────────────────────────
  const addDie = (sides: number) => {
    setDice(prev => {
      const existing = prev.find(d => d.sides === sides);
      if (existing) return prev.map(d => d.sides === sides ? { ...d, count: d.count + 1 } : d);
      return [...prev, { count: 1, sides }];
    });
  };

  const removeDie = (sides: number) => {
    setDice(prev =>
      prev.map(d => d.sides === sides ? { ...d, count: Math.max(0, d.count - 1) } : d)
         .filter(d => d.count > 0)
    );
  };

  const clearDice = () => { setDice([]); setModifier(0); setLatestResult(null); setJustRolled(false); };

  // ── Emit result + record history ──────────────────────────────────────────
  const recordResult = (result: DiceRollResult) => {
    const entry: RollHistoryEntry = { ...result, id: Math.random().toString(36).slice(2), timestamp: Date.now() };
    setLatestResult(entry);
    setJustRolled(true);
    setHistory(prev => [entry, ...prev].slice(0, 8));
    onRoll?.(result);
  };

  // ── Roll (build mode) ─────────────────────────────────────────────────────
  const rollAll = () => {
    if (dice.length === 0) return;
    setIsRolling(true);
    setTimeout(() => {
      // For advantage/disadvantage, roll the whole formula twice and pick higher/lower total
      const rollSet = () => {
        const rolls: number[] = [];
        dice.forEach(({ count, sides }) => {
          for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
        });
        return rolls;
      };

      if (advantageMode === 'normal') {
        const rolls = rollSet();
        const total = rolls.reduce((a, b) => a + b, 0) + modifier;
        recordResult({ formula, rolls, modifier, total, advantageMode });
      } else {
        const rollsA = rollSet();
        const rollsB = rollSet();
        const totalA = rollsA.reduce((a, b) => a + b, 0);
        const totalB = rollsB.reduce((a, b) => a + b, 0);
        const keepA = advantageMode === 'advantage' ? totalA >= totalB : totalA <= totalB;
        const kept = keepA ? rollsA : rollsB;
        const dropped = keepA ? rollsB : rollsA;
        const total = kept.reduce((a, b) => a + b, 0) + modifier;
        recordResult({ formula, rolls: kept, droppedRolls: dropped, modifier, total, advantageMode });
      }
      setIsRolling(false);
    }, 180);
  };

  // ── Quick single-die roll ─────────────────────────────────────────────────
  const quickRoll = (sides: number) => {
    const roll = Math.floor(Math.random() * sides) + 1;
    recordResult({ formula: `1d${sides}`, rolls: [roll], modifier: 0, total: roll });
  };

  if (!isOpen) return null;

  return (
    // z-[9999] ensures the widget always floats above every modal, backdrop, or overlay
    <div ref={constraintsRef} className="pointer-events-none fixed inset-0 z-[9999]">
      <motion.div
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto absolute top-24 left-1/2 sm:left-72 -translate-x-1/2 sm:translate-x-0 w-64 select-none"
        style={{ touchAction: 'none' }}
      >
        {/* ── HEADER ── */}
        <div
          onPointerDown={e => dragControls.start(e)}
          className={`flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing transition-colors ${
            isContextMode
              ? 'bg-amber-500/15 border border-amber-500/30'
              : 'bg-[#1A1D25] border border-white/10'
          } ${isBodyOpen ? 'rounded-t-2xl' : 'rounded-2xl'}`}
          style={{ borderBottom: isBodyOpen ? 'none' : undefined }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Dices className={`w-4 h-4 shrink-0 ${isContextMode ? 'text-amber-400' : 'text-amber-400'}`} />
            <div className="min-w-0">
              {isContextMode ? (
                <>
                  <p className="text-[7px] font-black uppercase tracking-widest text-amber-500/70 leading-none">Dice Tray</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 truncate leading-tight">{contextLabel}</p>
                </>
              ) : (
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Dice Tray</span>
                  {!isBodyOpen && latestResult && (
                    <span className="text-[7px] font-bold text-amber-500/80 uppercase tracking-tighter tabular-nums">Last: {latestResult.total}</span>
                  )}
                </div>
              )}
            </div>
            {latestResult && !isBodyOpen && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center min-w-[32px] h-6 px-2 rounded-lg bg-amber-500/20 border border-amber-500/30 ml-auto mr-1"
              >
                <span className="text-[12px] font-black text-amber-400 tabular-nums">{latestResult.total}</span>
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => setIsBodyOpen(v => !v)}
              className="size-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all"
            >
              {isBodyOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={onClose}
              className="size-6 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <AnimatePresence>
          {isBodyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden bg-[#1A1D25] border border-t-0 border-white/10 rounded-b-2xl"
            >
              <div className="p-4 space-y-4">

                {/* ── ADV / DIS toggle — always shown ── */}
                <div className="grid grid-cols-3 gap-1">
                  {([
                    ['disadvantage', '↓ Dis', 'bg-red-500/20 border-red-500/40 text-red-300'],
                    ['normal',       'Normal', 'bg-white/10 border-white/20 text-slate-200'],
                    ['advantage',    '↑ Adv',  'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'],
                  ] as const).map(([mode, label, activeClass]) => (
                    <button
                      key={mode}
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => setAdvantageMode(mode)}
                      className={`py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-wide transition-all ${
                        advantageMode === mode ? activeClass : 'bg-white/[0.03] border-white/8 text-slate-600 hover:text-slate-400 hover:border-white/15'
                      }`}
                    >{label}</button>
                  ))}
                </div>

                {/* ── Quick Roll — single tap to instantly roll one die ── */}
                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-slate-600 mb-2">Quick Roll</p>
                  <div className="flex gap-1 flex-wrap">
                    {DIE_SIZES.map(sides => (
                      <button
                        key={sides}
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => quickRoll(sides)}
                        className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border text-[7px] font-black uppercase transition-all active:scale-90 ${DIE_COLORS[sides]}`}
                      >
                        <DieSvg sides={sides} className="w-4 h-4" />
                        d{sides}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Build Roll — tap dice to stack them, then roll ── */}
                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-slate-600 mb-2">Build Roll</p>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {DIE_SIZES.map(sides => {
                      const entry = dice.find(d => d.sides === sides);
                      return (
                        <button
                          key={sides}
                          onPointerDown={e => e.stopPropagation()}
                          onClick={() => addDie(sides)}
                          className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border text-[7px] font-black transition-all active:scale-90 ${
                            entry ? `${DIE_COLORS[sides]} ring-1 ring-inset ring-current` : 'bg-white/[0.03] border-white/8 text-slate-600 hover:text-slate-400 hover:border-white/15'
                          }`}
                        >
                          <DieSvg sides={sides} className="w-4 h-4" />
                          d{sides}
                          {entry && (
                            <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-amber-500 text-black text-[6px] font-black flex items-center justify-center">
                              {entry.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {dice.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {dice.map(d => (
                        <div key={d.sides} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-slate-300">
                          <span>{d.count}d{d.sides}</span>
                          <button onPointerDown={e => e.stopPropagation()} onClick={() => removeDie(d.sides)} className="text-slate-600 hover:text-red-400 transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Mod</span>
                        <button onPointerDown={e => e.stopPropagation()} onClick={() => setModifier(v => v - 1)} className="size-6 rounded-lg bg-white/5 border border-white/8 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`w-8 text-center text-[12px] font-black tabular-nums ${modifier !== 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                          {modifier > 0 ? `+${modifier}` : modifier}
                        </span>
                        <button onPointerDown={e => e.stopPropagation()} onClick={() => setModifier(v => v + 1)} className="size-6 rounded-lg bg-white/5 border border-white/8 text-slate-500 hover:text-emerald-400 flex items-center justify-center transition-all">
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="flex-1 text-right text-[8px] font-black text-slate-700 font-mono truncate">{formula}</span>
                      </div>
                </div>

                {/* ── ROLL / CLEAR BUTTONS ── */}
                <div className="flex gap-2">
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={clearDice}
                    disabled={dice.length === 0}
                    className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 text-slate-500 hover:text-red-400 text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-20 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={rollAll}
                    disabled={dice.length === 0 || isRolling}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2 ${
                      isContextMode
                        ? 'bg-amber-500 text-black hover:brightness-110 shadow-lg shadow-amber-500/25'
                        : 'bg-amber-500 text-black hover:brightness-110'
                    }`}
                  >
                    <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
                    {isRolling ? 'Rolling…' : isContextMode ? `Roll ${formula}` : 'Roll!'}
                  </button>
                </div>

                {/* ── LATEST RESULT ── */}
                <AnimatePresence>
                  {latestResult && (
                    <motion.div
                      key={latestResult.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`px-4 py-3 rounded-2xl space-y-2 ${
                        isContextMode && justRolled
                          ? 'bg-amber-500/20 border border-amber-500/40'
                          : 'bg-amber-500/10 border border-amber-500/20'
                      }`}
                    >
                      {/* Adv/dis dice comparison */}
                      {latestResult.advantageMode && latestResult.advantageMode !== 'normal' && latestResult.droppedRolls && (
                        <div className={`flex items-center gap-2 text-[8px] font-black uppercase ${latestResult.advantageMode === 'advantage' ? 'text-emerald-400' : 'text-red-400'}`}>
                          <span>{latestResult.advantageMode === 'advantage' ? '↑ Adv' : '↓ Dis'}</span>
                          <span className="text-slate-500 font-mono">kept [{latestResult.rolls.join(', ')}]</span>
                          <span className="text-slate-700 font-mono line-through">dropped [{latestResult.droppedRolls.join(', ')}]</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[7px] font-black uppercase tracking-widest text-amber-500/60">{latestResult.formula}</p>
                          {(!latestResult.advantageMode || latestResult.advantageMode === 'normal') && (
                            <p className="text-[9px] text-slate-500">[{latestResult.rolls.join(', ')}]{latestResult.modifier !== 0 ? ` ${latestResult.modifier > 0 ? '+' : ''}${latestResult.modifier}` : ''}</p>
                          )}
                          {isContextMode && justRolled && (
                            <p className="text-[7px] font-black uppercase tracking-widest text-amber-500 mt-0.5">Applied →</p>
                          )}
                        </div>
                        <p className="text-[32px] font-black text-amber-400 tabular-nums leading-none">{latestResult.total}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── HISTORY (free mode only) ── */}
                {!isContextMode && history.length > 1 && (
                  <div className="space-y-1">
                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-700">History</p>
                    {history.slice(1).map(r => (
                      <div key={r.id} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-[8px] font-black text-slate-600">{r.formula}</span>
                        <span className="text-[10px] font-black text-slate-500 tabular-nums">{r.total}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
