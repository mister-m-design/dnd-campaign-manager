"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, GripHorizontal, Plus, X } from 'lucide-react';
import type { LogEntry } from '../../types';

interface FloatingJournalProps {
    log: LogEntry[];
    onAddNote: (text: string) => void;
    onClearLog: () => void;
}

const DOT_COLOR: Record<string, string> = {
    combat:    'bg-rose-500',
    system:    'bg-amber-400',
    movement:  'bg-sky-400',
    notes:     'bg-emerald-400',
    narrative: 'bg-violet-400',
};

const ENTRY_COLOR: Record<string, string> = {
    combat:    'text-rose-300',
    system:    'text-amber-300',
    movement:  'text-sky-300',
    notes:     'text-emerald-200',
    narrative: 'text-violet-200',
};

export function FloatingJournal({ log, onAddNote, onClearLog }: FloatingJournalProps) {
    const [expanded, setExpanded] = useState(false);
    const [noteInput, setNoteInput] = useState('');

    // Drag
    const containerRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
    const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

    const onGripDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        dragRef.current = {
            sx: e.clientX, sy: e.clientY,
            ox: pos?.x ?? (rect.left + rect.width / 2),
            oy: pos?.y ?? rect.top,
        };
        (e.target as Element).setPointerCapture(e.pointerId);
    }, [pos]);

    const onGripMove = useCallback((e: React.PointerEvent) => {
        if (!dragRef.current) return;
        setPos({
            x: dragRef.current.ox + (e.clientX - dragRef.current.sx),
            y: dragRef.current.oy + (e.clientY - dragRef.current.sy),
        });
    }, []);

    const onGripUp = useCallback(() => { dragRef.current = null; }, []);

    // Auto-close expanded if no log entries
    useEffect(() => {
        if (log.length === 0) setExpanded(false);
    }, [log.length]);

    const latest = log.length > 0 ? log[log.length - 1] : null;
    const count = log.length;

    const submitNote = () => {
        if (noteInput.trim()) { onAddNote(noteInput.trim()); setNoteInput(''); }
    };

    // Default: sits just below the FloatingToolbar, centered at top
    const style: React.CSSProperties = pos
        ? { position: 'fixed', left: pos.x, top: pos.y, transform: 'translateX(-50%)', zIndex: 145 }
        : { position: 'absolute', top: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 145 };

    return (
        <div
            ref={containerRef}
            style={style}
            className="pointer-events-auto flex flex-col items-center"
            onClick={e => e.stopPropagation()}
        >
            {/* ── Single-line compact bar ── */}
            <div className="flex items-stretch bg-[#0d0d12]/85 border border-white/8 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-sm">

                {/* Drag grip */}
                <div
                    className="flex items-center px-2.5 cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-500 touch-none transition-colors"
                    onPointerDown={onGripDown}
                    onPointerMove={onGripMove}
                    onPointerUp={onGripUp}
                    onPointerCancel={onGripUp}
                    title="Drag journal"
                >
                    <GripHorizontal className="w-3 h-3" />
                </div>

                {/* Latest entry — single line */}
                <div className="flex items-center gap-1.5 pl-0.5 pr-2 py-1.5 min-w-0 max-w-[340px]">
                    {latest ? (
                        <>
                            <span className={`size-1.5 rounded-full shrink-0 ${DOT_COLOR[latest.type] ?? 'bg-slate-600'}`} />
                            <span className={`text-[9px] truncate ${ENTRY_COLOR[latest.type] ?? 'text-slate-400'}`}>
                                {latest.message}
                            </span>
                        </>
                    ) : (
                        <span className="text-[9px] text-slate-700 italic">No events yet</span>
                    )}
                </div>

                {/* Divider + expand toggle */}
                <button
                    onClick={() => setExpanded(v => !v)}
                    className={`flex items-center gap-1 px-2.5 border-l border-white/8 transition-all ${
                        expanded ? 'text-amber-400 bg-amber-500/10' : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={expanded ? 'Collapse' : 'Expand journal'}
                >
                    {count > 0 && (
                        <span className="text-[8px] font-black tabular-nums">{count}</span>
                    )}
                    {expanded
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                    }
                </button>
            </div>

            {/* ── Expanded panel drops down ── */}
            <AnimatePresence>
            {expanded && (
                <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.14 }}
                    className="mt-1.5 w-[380px] bg-[#0d0d12]/95 border border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-3 h-3 text-amber-500/60" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Battle Journal</span>
                            {count > 0 && <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-600">{count}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            {count > 0 && (
                                <button onClick={onClearLog} className="text-[7px] text-slate-700 hover:text-red-400 font-black uppercase tracking-widest transition-colors">
                                    Clear
                                </button>
                            )}
                            <button onClick={() => setExpanded(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Log entries */}
                    <div className="flex flex-col-reverse overflow-y-auto max-h-44 px-3 pt-2 pb-1 gap-1 scrollbar-hide">
                        {count === 0 ? (
                            <div className="py-6 flex flex-col items-center opacity-30">
                                <BookOpen className="w-6 h-6 mb-1.5 text-slate-600" />
                                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">No events yet</p>
                            </div>
                        ) : [...log].reverse().map((entry, i) => (
                            <div key={entry.id ?? i} className="flex items-start gap-2 py-0.5">
                                <span className={`mt-1.5 size-1.5 rounded-full shrink-0 ${DOT_COLOR[entry.type] ?? 'bg-slate-600'}`} />
                                <p className={`text-[10px] leading-relaxed flex-1 ${ENTRY_COLOR[entry.type] ?? 'text-slate-400'}`}>
                                    {entry.message}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Note input */}
                    <div className="px-3 pb-3 pt-1.5 border-t border-white/5 flex gap-2">
                        <input
                            value={noteInput}
                            onChange={e => setNoteInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') submitNote(); }}
                            placeholder="Add a note…"
                            className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-[10px] text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/30 transition-all"
                        />
                        <button
                            onClick={submitNote}
                            disabled={!noteInput.trim()}
                            className="size-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 disabled:opacity-30 transition-all shrink-0"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
