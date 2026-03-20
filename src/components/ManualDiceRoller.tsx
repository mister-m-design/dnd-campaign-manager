
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManualDiceRollerProps {
    isOpen: boolean;
    onClose: () => void;
    onRoll: (result: number) => void;
    title?: string;
    description?: string;
    defaultValue?: number;
    type?: 'Attack' | 'Damage';
    result?: {
        message: string;
        type: 'hit' | 'miss' | 'crit' | 'none';
        canProceed?: boolean;
    };
    onProceed?: () => void;
}

export default function ManualDiceRoller({ 
    isOpen, 
    onClose, 
    onRoll, 
    title = "Manual Roll Required",
    description = "Enter the physical dice result below.",
    defaultValue = 10,
    type = 'Attack',
    result = { message: '', type: 'none' },
    onProceed
}: ManualDiceRollerProps) {
    const [value, setValue] = useState(defaultValue.toString());

    useEffect(() => {
        if (isOpen && result.type === 'none') {
            setValue(defaultValue.toString());
        }
    }, [isOpen, defaultValue, result.type]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
            onRoll(numValue);
        }
    };

    const handleQuickRoll = (sides: number) => {
        const roll = Math.floor(Math.random() * sides) + 1;
        setValue(roll.toString());
        // Auto-submit after a tiny delay for visual feedback? 
        // Or just set the value and let user confirm?
        // User said "Add buttons to each step that will generate the roll for you"
        // I'll make them instantly submit for speed.
        setTimeout(() => onRoll(roll), 200);
    };

    const typeColors = {
        hit: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
        miss: 'text-red-500 border-red-500/20 bg-red-500/10',
        crit: 'text-amber-500 border-amber-500/40 bg-amber-500/20 animate-pulse',
        none: 'text-slate-400 border-white/10 bg-white/5'
    };

    const diceOptions = type === 'Attack' ? [20] : [4, 6, 8, 10, 12, 20];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Window */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-[#16191F] border border-white/10 rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        {/* Header Decoration */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent ${result.type === 'hit' || result.type === 'crit' ? 'via-emerald-500' : 'via-amber-500'} to-transparent`} />
                        
                        <div className="p-10">
                            <div className="flex items-center gap-5 mb-8">
                                <div className={`size-14 rounded-2xl flex items-center justify-center border shadow-inner ${typeColors[result.type]}`}>
                                    <span className="material-symbols-outlined text-3xl">
                                        {result.type === 'none' ? 'casino' : (result.type === 'hit' || result.type === 'crit' ? 'check_circle' : 'cancel')}
                                    </span>
                                </div>
                                <div className="text-left flex-grow">
                                    <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em]">{title}</h3>
                                    <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-1">{description}</p>
                                </div>
                                {result.type !== 'none' && (
                                     <button 
                                        onClick={onClose}
                                        className="size-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-500 transition-colors"
                                     >
                                        <span className="material-symbols-outlined text-xl">close</span>
                                     </button>
                                )}
                            </div>

                            <AnimatePresence mode="wait">
                                {result.type === 'none' ? (
                                    <motion.form 
                                        key="form"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={handleSubmit} 
                                        className="space-y-10"
                                    >
                                        <div className="relative bg-black/40 border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center group overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                                <span className="material-symbols-outlined text-[120px] rotate-12">casino</span>
                                            </div>
                                            
                                            <input 
                                                autoFocus
                                                type="number"
                                                value={value}
                                                onChange={(e) => setValue(e.target.value)}
                                                className="relative z-10 bg-transparent text-8xl font-black text-center w-full focus:outline-none text-white tabular-nums tracking-tighter"
                                                placeholder="0"
                                            />
                                            <div className="relative z-10 text-[10px] font-black text-slate-600 uppercase tracking-widest mt-6 group-focus-within:text-amber-500 transition-colors flex items-center gap-2">
                                                <span className="w-1 h-1 rounded-full bg-amber-500 group-focus-within:animate-ping" />
                                                Input or Generate Roll
                                            </div>
                                        </div>

                                        {/* Quick Roll Buttons */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-wrap items-center justify-center gap-3">
                                                {diceOptions.map((sides) => (
                                                    <button
                                                        key={`d${sides}`}
                                                        type="button"
                                                        onClick={() => handleQuickRoll(sides)}
                                                        className="group flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all active:scale-95"
                                                    >
                                                        <div className="size-8 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-slate-500 group-hover:text-amber-500 transition-colors">
                                                                {sides === 20 ? 'pentagon' : (sides >= 10 ? 'hexagon' : (sides >= 6 ? 'square' : 'change_history'))}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 group-hover:text-amber-500 uppercase tracking-widest">D{sides}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest opacity-40">Tap die to auto-generate & submit</p>
                                        </div>

                                        <div className="flex gap-5 pt-4">
                                            <button 
                                                type="button"
                                                onClick={onClose}
                                                className="flex-1 px-8 py-5 rounded-[1.5rem] border border-white/10 text-[11px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-slate-500"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit"
                                                className="flex-[2] px-8 py-5 rounded-[1.5rem] bg-amber-500 text-black text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,184,0,0.3)] ring-offset-2 ring-offset-[#16191F] focus:ring-2 ring-amber-500"
                                            >
                                                Confirm Entry
                                            </button>
                                        </div>
                                    </motion.form>
                                ) : (
                                    <motion.div 
                                        key="result"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center space-y-10 py-6"
                                    >
                                        <div className={`p-10 rounded-[2.5rem] border-2 ${typeColors[result.type]} shadow-2xl relative overflow-hidden`}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                                            <div className="relative z-10 text-6xl font-black italic uppercase tracking-tighter mb-4">
                                                {result.type === 'hit' ? 'Hit!' : (result.type === 'crit' ? 'Crit!' : 'Miss')}
                                            </div>
                                            <div className="relative z-10 w-12 h-1 bg-current mx-auto opacity-20 mb-6 rounded-full" />
                                            <p className="relative z-10 text-[13px] font-black opacity-80 uppercase tracking-widest leading-relaxed px-4">
                                                {result.message}
                                            </p>
                                        </div>

                                        <div className="flex gap-5">
                                            {result.type === 'miss' ? (
                                                <button 
                                                    onClick={onClose}
                                                    className="w-full px-10 py-6 rounded-[1.5rem] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-slate-300"
                                                >
                                                    Return to Combat
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={onProceed}
                                                    className="w-full px-10 py-6 rounded-[1.5rem] bg-emerald-500 text-black text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-4 group"
                                                >
                                                    <span className="material-symbols-outlined text-xl group-hover:animate-bounce">bolt</span>
                                                    Proceed to Damage
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
