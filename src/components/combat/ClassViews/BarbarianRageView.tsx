"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CombatantState } from '@/types';

interface BarbarianRageViewProps {
    combatant: CombatantState;
    onUpdate: (id: string, updates: Partial<CombatantState>) => void;
}

export function BarbarianRageView({ combatant, onUpdate }: BarbarianRageViewProps) {
    const isRaging = combatant.status.includes('Raging');
    const rageResource = combatant.features?.find(f => f.name.toLowerCase() === 'rage');
    const currentRages = rageResource?.current ?? 2;
    const maxRages = rageResource?.max ?? 2;

    const toggleRage = () => {
        if (!isRaging && currentRages <= 0) return;

        let newStatus = [...combatant.status];
        let newResources = [...(combatant.features || [])];
        const rageIndex = newResources.findIndex(f => f.name.toLowerCase() === 'rage');

        if (isRaging) {
            newStatus = newStatus.filter(s => s !== 'Raging');
        } else {
            newStatus.push('Raging');
            if (rageIndex !== -1) {
                newResources[rageIndex] = { ...newResources[rageIndex], current: Math.max(0, currentRages - 1) };
            }
        }

        onUpdate(combatant.id, { status: newStatus, features: newResources });
    };

    return (
        <div className="space-y-12">
            <div className="relative">
                <motion.div
                    animate={isRaging ? { scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -inset-10 bg-red-600/20 blur-3xl rounded-full"
                />
                
                <div className="relative text-center">
                    <h3 className={`text-6xl font-black italic tracking-tighter uppercase transition-colors duration-500 ${isRaging ? 'text-red-500' : 'text-slate-800'}`}>
                        RAGE
                    </h3>
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className={`size-2 rounded-full ${isRaging ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-slate-700'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isRaging ? 'text-red-400' : 'text-slate-500'}`}>
                            {isRaging ? 'ACTIVE STATUS' : 'INACTIVE'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">RAGES REMAINING</p>
                    <div className="flex items-end gap-1">
                        <span className="text-3xl font-black text-red-500 leading-none">{currentRages}</span>
                        <span className="text-xs font-bold text-slate-600 mb-1">/ {maxRages}</span>
                    </div>
                </div>

                <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">RESISTANCES</p>
                    <div className="flex gap-1 flex-wrap">
                        {['B', 'P', 'S'].map(t => (
                            <div key={t} className={`size-6 rounded-lg flex items-center justify-center text-[10px] font-black border transition-colors ${isRaging ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                                {t}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RAGE INTENSITY</p>
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{isRaging ? 'FULL' : '0%'}</span>
                </div>
                <div className="h-4 bg-slate-900/50 rounded-full border border-white/5 overflow-hidden flex items-stretch p-0.5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isRaging ? '100%' : '0%' }}
                        transition={{ duration: 1, ease: 'circOut' }}
                        className="bg-gradient-to-r from-red-800 to-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)] relative overflow-hidden"
                    >
                        <motion.div
                            animate={{ x: [-20, 100] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-10 skew-x-12"
                        />
                    </motion.div>
                </div>
            </div>

            <button
                onClick={toggleRage}
                className={`w-full py-6 rounded-3xl font-black uppercase tracking-widest text-sm transition-all duration-300 shadow-2xl relative overflow-hidden group ${
                    isRaging 
                    ? 'bg-slate-900 border border-red-500/50 text-red-500 hover:bg-slate-800 active:scale-95' 
                    : 'bg-red-600 text-white hover:bg-red-500 active:scale-95 shadow-red-500/20'
                }`}
            >
                <div className="relative z-10 flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-xl">{isRaging ? 'undo' : 'electric_bolt'}</span>
                    {isRaging ? 'END RAGE' : 'ENTER RAGE'}
                </div>
                {!isRaging && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}
            </button>
        </div>
    );
}
