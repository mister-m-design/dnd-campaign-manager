"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuilderStep, STEPS } from '@/hooks/useCharacterBuilder';
import { Character } from '@/types';

interface BuilderTopNavProps {
    currentStep: BuilderStep;
    setStep: (step: BuilderStep) => void;
    prevStep: () => void;
    nextStep: () => void;
    handleSave: () => void;
    char: Character;
    isDMMode: boolean;
    setIsDMMode: (v: boolean | ((p: boolean) => boolean)) => void;
    isDMPanelOpen: boolean;
    setIsDMPanelOpen: (v: boolean | ((p: boolean) => boolean)) => void;
    onAbort: () => void;
}

export default function BuilderTopNav({
    currentStep,
    setStep,
    prevStep,
    nextStep,
    handleSave,
    char,
    isDMMode,
    setIsDMMode,
    isDMPanelOpen,
    setIsDMPanelOpen,
    onAbort,
}: BuilderTopNavProps) {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    const isFirstStep = currentStep === 'identity';
    const isFinalStep = currentStep === 'review';
    const progress = ((currentIndex + 1) / STEPS.length) * 100;

    return (
        <header className="shrink-0 z-20" style={{ background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)' }}>
            {/* ── Top row: branding + DM controls + Abort ── */}
            <div className="flex items-center justify-between px-6 py-3 gap-4">
                {/* Branding / char name preview */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="size-7 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                        <span className="material-symbols-outlined text-primary text-sm">shield_person</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Forge Hero</p>
                        {char.name ? (
                            <p className="text-[12px] font-black text-white uppercase tracking-wider truncate">{char.name}</p>
                        ) : (
                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider italic">Unnamed Character</p>
                        )}
                    </div>
                    {/* Level badge */}
                    <div className="shrink-0 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Lv {char.level ?? 1}</span>
                    </div>
                </div>

                {/* DM controls + Abort */}
                <div className="flex items-center gap-2 shrink-0">
                    <AnimatePresence>
                        {isDMMode && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => setIsDMPanelOpen(prev => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                                    isDMPanelOpen
                                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-lg shadow-purple-500/20'
                                        : 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/15'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[13px]">library_books</span>
                                DM Library
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => {
                            setIsDMMode(prev => !prev);
                            if (isDMMode) setIsDMPanelOpen(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                            isDMMode
                                ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/30'
                                : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                        }`}
                        title="Toggle DM Mode — unlocks full spell library, ability override, and rule bypass"
                    >
                        <span className="material-symbols-outlined text-[13px]">shield_person</span>
                        {isDMMode ? 'DM Active' : 'DM Mode'}
                    </button>

                    <button
                        onClick={onAbort}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                        <span className="material-symbols-outlined text-[13px]">cancel</span>
                        Abort
                    </button>
                </div>
            </div>

            {/* DM Mode banner */}
            <AnimatePresence>
                {isDMMode && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center justify-center gap-3 py-1.5 bg-purple-600/15 border-t border-purple-500/20">
                            <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-purple-300">DM Mode Active — Rules Are Suggestions</span>
                            <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Step navigation bar ── */}
            <div className="px-6 pb-0 border-t border-white/5">
                <div className="flex items-center justify-between">
                    {/* Back button */}
                    <button
                        onClick={prevStep}
                        disabled={isFirstStep}
                        className={`flex items-center gap-1.5 py-3 pr-4 text-[10px] font-black uppercase tracking-widest transition-colors ${
                            isFirstStep ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        Back
                    </button>

                    {/* Step pills */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-3 flex-1 justify-center">
                        {STEPS.map((s, i) => {
                            const active = currentStep === s.id;
                            const completed = i < currentIndex;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setStep(s.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                                        active
                                            ? 'bg-primary/15 border border-primary/30 text-primary'
                                            : completed
                                            ? 'bg-white/5 border border-white/5 text-slate-500 hover:text-slate-300'
                                            : 'bg-transparent border border-transparent text-slate-700 hover:text-slate-500'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[12px]">
                                        {completed && !active ? 'check' : s.icon}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-wider hidden lg:block">
                                        {s.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Next / Save button */}
                    <button
                        onClick={isFinalStep ? handleSave : nextStep}
                        className="flex items-center gap-1.5 py-3 pl-4 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                    >
                        {isFinalStep ? (
                            <>
                                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                Enter World
                            </>
                        ) : (
                            <>
                                Next
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Progress bar */}
                <div className="h-0.5 bg-white/5 rounded-full overflow-hidden -mx-0">
                    <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                </div>
            </div>
        </header>
    );
}
