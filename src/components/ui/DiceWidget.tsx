"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiceEngine, RollResult } from '@/lib/dice';

export type { RollResult };

export interface DiceWidgetProps {
    /** Pre-populate the notation (e.g. "2d6+3"). Updates when prop changes. */
    notation?: string;
    /** Label shown at the top (e.g. "Greatsword — Damage") */
    label?: string;
    /** Called each time a roll completes */
    onRollResult?: (result: RollResult) => void;
    /** Render inline without the floating button shell */
    embedded?: boolean;
    /** Show roll history list (default: true for standalone, false for embedded) */
    showHistory?: boolean;
}

type AdvMode = 'normal' | 'advantage' | 'disadvantage';

const QUICK_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

// ──────────────────────────────────────────────────────────────────────────────
// Roll result display — shows both dice sets for advantage/disadvantage
// ──────────────────────────────────────────────────────────────────────────────
function DiceResultDisplay({ result }: { result: RollResult }) {
    const { rolls, droppedRolls, modifier, total, type } = result;
    const isAdv = type !== 'normal';
    const sumRolls = rolls.reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-3">
            {/* Advantage / Disadvantage banner */}
            {isAdv && (
                <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${type === 'advantage' ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className="material-symbols-outlined text-sm">
                        {type === 'advantage' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                    {type === 'advantage' ? 'Advantage — Highest Kept' : 'Disadvantage — Lowest Kept'}
                </div>
            )}

            {/* Dice faces */}
            <div className="flex items-start gap-3 flex-wrap">
                {/* Kept dice */}
                <div className="space-y-1">
                    {isAdv && (
                        <p className="text-[7px] font-black uppercase tracking-widest text-slate-500">Kept</p>
                    )}
                    <div className="flex gap-1.5 flex-wrap">
                        {rolls.map((v, i) => (
                            <div
                                key={i}
                                className={`min-w-[2rem] h-8 px-2 rounded-lg border flex items-center justify-center font-black text-sm
                                    ${type === 'advantage'
                                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                                        : type === 'disadvantage'
                                        ? 'border-red-500/50 bg-red-500/15 text-red-200'
                                        : 'border-white/20 bg-white/5 text-slate-100'
                                    }`}
                            >
                                {v}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dropped dice */}
                {isAdv && droppedRolls && droppedRolls.length > 0 && (
                    <>
                        <div className="text-slate-700 text-xs self-center pt-4 font-black">vs</div>
                        <div className="space-y-1 opacity-30">
                            <p className="text-[7px] font-black uppercase tracking-widest text-slate-600">Dropped</p>
                            <div className="flex gap-1.5 flex-wrap">
                                {droppedRolls.map((v, i) => (
                                    <div
                                        key={i}
                                        className="min-w-[2rem] h-8 px-2 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center font-black text-sm text-slate-500 line-through decoration-2"
                                    >
                                        {v}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Total */}
            <div className="flex items-baseline gap-2 flex-wrap">
                {modifier !== 0 && (
                    <span className="text-[9px] font-mono text-slate-500">
                        {sumRolls}{modifier > 0 ? '+' : ''}{modifier} =
                    </span>
                )}
                <span className="text-4xl font-black text-slate-100 leading-none">{total}</span>
                <span className="text-[8px] font-black text-slate-600 uppercase">
                    {result.notation.replace(/adv$|dis$/i, '')}
                </span>
                {isAdv && (
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${type === 'advantage' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {type === 'advantage' ? 'ADV' : 'DIS'}
                    </span>
                )}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// DiceWidget — embedded or standalone floating
// ──────────────────────────────────────────────────────────────────────────────
export function DiceWidget({
    notation: propNotation,
    label,
    onRollResult,
    embedded = false,
    showHistory,
}: DiceWidgetProps) {
    const displayHistory = showHistory ?? !embedded;

    const [notation, setNotation] = useState(propNotation || 'd20');
    const [advMode, setAdvMode] = useState<AdvMode>('normal');
    const [result, setResult] = useState<RollResult | null>(null);
    const [rollKey, setRollKey] = useState(0);
    const [history, setHistory] = useState<Array<{ id: string; label?: string; notation: string; total: number; type: RollResult['type'] }>>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isRolling, setIsRolling] = useState(false);

    // Sync prop notation
    useEffect(() => {
        if (propNotation) setNotation(propNotation);
    }, [propNotation]);

    const doRoll = useCallback(() => {
        if (isRolling) return;
        setIsRolling(true);
        setTimeout(() => {
            try {
                const base = notation.trim() || 'd20';
                const finalNotation = advMode === 'normal'
                    ? base
                    : base + (advMode === 'advantage' ? 'adv' : 'dis');
                const r = DiceEngine.roll(finalNotation);
                setResult(r);
                setRollKey(k => k + 1);
                setHistory(prev => [{
                    id: crypto.randomUUID(),
                    label,
                    notation: r.notation,
                    total: r.total,
                    type: r.type,
                }, ...prev.slice(0, 14)]);
                onRollResult?.(r);
            } catch {
                // ignore parse errors for invalid notations
            }
            setIsRolling(false);
        }, 120);
    }, [notation, advMode, label, onRollResult, isRolling]);

    const body = (
        <div className="space-y-4">
            {/* Label */}
            {label && (
                <p className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">casino</span>
                    {label}
                </p>
            )}

            {/* Quick dice buttons */}
            <div className="grid grid-cols-6 gap-1">
                {QUICK_DICE.map(d => (
                    <button
                        key={d}
                        onClick={() => setNotation(d)}
                        className={`py-1 rounded-lg border text-[8px] font-black uppercase transition-all ${
                            notation === d
                                ? 'bg-primary/20 border-primary/40 text-primary'
                                : 'bg-white/5 border-white/5 text-slate-600 hover:text-slate-300 hover:border-white/10'
                        }`}
                    >
                        {d}
                    </button>
                ))}
            </div>

            {/* Custom notation input */}
            <input
                type="text"
                value={notation}
                onChange={e => setNotation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doRoll()}
                placeholder="e.g. 2d6+3, d20"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-primary/50 outline-none transition-all"
            />

            {/* Advantage / Disadvantage toggle */}
            <div className="grid grid-cols-3 gap-1">
                <button
                    onClick={() => setAdvMode('disadvantage')}
                    className={`py-2 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all ${
                        advMode === 'disadvantage'
                            ? 'text-red-300 bg-red-500/15 border-red-500/30'
                            : 'text-slate-600 bg-white/5 border-white/5 hover:text-slate-400'
                    }`}
                >
                    Disadv
                </button>
                <button
                    onClick={() => setAdvMode('normal')}
                    className={`py-2 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all ${
                        advMode === 'normal'
                            ? 'text-slate-200 bg-white/10 border-white/20'
                            : 'text-slate-600 bg-white/5 border-white/5 hover:text-slate-400'
                    }`}
                >
                    Normal
                </button>
                <button
                    onClick={() => setAdvMode('advantage')}
                    className={`py-2 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all ${
                        advMode === 'advantage'
                            ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                            : 'text-slate-600 bg-white/5 border-white/5 hover:text-slate-400'
                    }`}
                >
                    Adv
                </button>
            </div>

            {/* Roll button */}
            <button
                onClick={doRoll}
                disabled={isRolling}
                className="w-full py-3 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all bg-primary text-black primary-glow border-t border-white/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
                {isRolling
                    ? 'Rolling...'
                    : `Roll ${notation || 'd20'}${advMode !== 'normal' ? ` (${advMode === 'advantage' ? 'ADV' : 'DIS'})` : ''}`}
            </button>

            {/* Roll result */}
            <AnimatePresence mode="wait">
                {result && (
                    <motion.div
                        key={rollKey}
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="bg-black/50 border border-white/10 rounded-xl p-4"
                    >
                        <DiceResultDisplay result={result} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Roll history */}
            {displayHistory && history.length > 1 && (
                <div className="space-y-1">
                    <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest">Previous Rolls</p>
                    <div className="space-y-0.5 max-h-28 overflow-y-auto custom-scrollbar">
                        {history.slice(1).map(entry => (
                            <div key={entry.id} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5">
                                {entry.label && (
                                    <span className="text-[7px] font-black text-slate-600 uppercase truncate flex-1">{entry.label}</span>
                                )}
                                <span className="text-[8px] font-mono text-slate-700">
                                    {entry.notation.replace(/adv$|dis$/i, '')}
                                </span>
                                {entry.type !== 'normal' && (
                                    <span className={`text-[7px] font-black uppercase ${entry.type === 'advantage' ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {entry.type === 'advantage' ? 'ADV' : 'DIS'}
                                    </span>
                                )}
                                <span className="text-[11px] font-black text-slate-400">{entry.total}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // ── Embedded mode ─────────────────────────────────────────────────────────
    if (embedded) return body;

    // ── Standalone floating mode ──────────────────────────────────────────────
    return (
        <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                        style={{ transformOrigin: 'bottom right' }}
                        className="obsidian-panel rounded-3xl p-6 border border-white/10 w-72 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">casino</span>
                                Dice Roller
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-600 hover:text-slate-400 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                        {body}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating toggle button */}
            <button
                onClick={() => setIsOpen(v => !v)}
                className={`size-14 rounded-2xl flex items-center justify-center shadow-2xl border transition-all hover:scale-110 active:scale-95 ${
                    isOpen
                        ? 'bg-white/10 border-white/20 text-slate-300'
                        : 'bg-primary text-black border-t border-white/20 primary-glow'
                }`}
                title="Dice Roller"
            >
                <span className="material-symbols-outlined text-2xl">casino</span>
            </button>
        </div>
    );
}
