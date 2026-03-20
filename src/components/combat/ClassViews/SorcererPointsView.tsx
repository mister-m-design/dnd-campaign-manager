"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CombatantState } from '@/types';

interface SorcererPointsViewProps {
    combatant: CombatantState;
    onUpdate: (id: string, updates: Partial<CombatantState>) => void;
}

const METAMAGIC = [
    { name: 'Empowered Spell', cost: 1, icon: 'bolt' },
    { name: 'Quickened Spell', cost: 2, icon: 'speed' },
    { name: 'Twinned Spell', cost: 1, icon: 'content_copy' },
    { name: 'Subtle Spell', cost: 1, icon: 'visibility_off' },
    { name: 'Careful Spell', cost: 1, icon: 'security' }
];

export function SorcererPointsView({ combatant, onUpdate }: SorcererPointsViewProps) {
    const pointsResource = combatant.features?.find(f => f.name.toLowerCase().includes('sorcery points'));
    const currentPoints = pointsResource?.current ?? 5;
    const maxPoints = pointsResource?.max ?? 5;

    const modifyPoints = (delta: number) => {
        const newResources = (combatant.features || []).map(f => {
            if (f.name.toLowerCase().includes('sorcery points')) {
              return { ...f, current: Math.min(maxPoints, Math.max(0, currentPoints + delta)) };
            }
            return f;
        });
        onUpdate(combatant.id, { features: newResources });
    };

    return (
        <div className="space-y-12">
            <div className="text-center relative">
               <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute -inset-10 bg-violet-600/20 blur-3xl rounded-full"
                />
                <h3 className="text-4xl font-black italic tracking-tighter uppercase text-violet-500 relative">
                    SORCERY POINTS
                </h3>
                <div className="flex items-center justify-center gap-2 mt-4 relative">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">ARCANE ESSENCE AVAILABLE</span>
                </div>
            </div>

            <div className="flex justify-center items-center gap-8 relative py-8">
                <button
                    onClick={() => modifyPoints(-1)}
                    className="size-12 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.05] text-slate-400 hover:text-slate-100 transition-all active:scale-90"
                >
                    <span className="material-symbols-outlined">remove</span>
                </button>
                <div className="text-center">
                    <span className="text-8xl font-black text-white tabular-nums leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]">{currentPoints}</span>
                    <p className="text-xs font-black text-slate-500 mt-2 uppercase tracking-widest">REMAINING / {maxPoints}</p>
                </div>
                <button
                    onClick={() => modifyPoints(1)}
                     className="size-12 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.05] text-slate-400 hover:text-slate-100 transition-all active:scale-90"
                >
                     <span className="material-symbols-outlined">add</span>
                </button>
            </div>

            <div className="space-y-6">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">METAMAGIC READY</p>
                 <div className="grid grid-cols-1 gap-3">
                    {METAMAGIC.map((meta) => (
                        <button
                            key={meta.name}
                            className="p-4 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center justify-between group active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                                     <span className="material-symbols-outlined text-xl">{meta.icon}</span>
                                </div>
                                <div className="text-left">
                                     <h4 className="text-[11px] font-black text-slate-200 uppercase tracking-widest leading-none">{meta.name}</h4>
                                     <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-tighter italic opacity-0 group-hover:opacity-100 transition-opacity">Ready to channel</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest leading-none">{meta.cost} POINT{meta.cost > 1 ? 'S' : ''}</span>
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter mt-1">COST</span>
                            </div>
                        </button>
                    ))}
                 </div>
            </div>

            <button
                className="w-full py-6 rounded-3xl font-black uppercase tracking-widest text-sm transition-all duration-300 shadow-2xl relative overflow-hidden group bg-violet-600 text-white hover:bg-violet-500 shadow-violet-500/20 active:scale-95"
            >
                <div className="relative z-10 flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-xl">cached</span>
                    CONVERT SLOTS
                </div>
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </button>
        </div>
    );
}
