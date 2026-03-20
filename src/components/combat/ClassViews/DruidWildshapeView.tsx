"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CombatantState } from '@/types';
import Image from 'next/image';

const BEAST_FORMS = [
    { name: 'Brown Bear', cr: 1, hp: 34, ac: 11, speed: 40, icon: 'pets' },
    { name: 'Dire Wolf', cr: 1, hp: 37, ac: 14, speed: 50, icon: 'wolf' },
    { name: 'Giant Spider', cr: 1, hp: 26, ac: 14, speed: 30, icon: 'bug_report' },
    { name: 'Giant Eagle', cr: 1, hp: 26, ac: 13, speed: 10, flying: 80, icon: 'flight' }
];

interface DruidWildshapeViewProps {
    combatant: CombatantState;
    onUpdate: (id: string, updates: Partial<CombatantState>) => void;
    onOpenWildshape?: () => void;
}

export function DruidWildshapeView({ combatant, onUpdate, onOpenWildshape }: DruidWildshapeViewProps) {
    const isWildshaped = combatant.isWildShaped || combatant.status.includes('Wildshaped');
    const [selectedBeastIndex, setSelectedBeastIndex] = useState(0);
    const selectedBeast = BEAST_FORMS[selectedBeastIndex];

    const toggleWildshape = () => {
        if (onOpenWildshape) {
            onOpenWildshape();
        } else {
            // Fallback for non-combat usage if any
            let newStatus = [...combatant.status];
            let updates: Partial<CombatantState> = {};

            if (isWildshaped) {
                newStatus = newStatus.filter(s => s !== 'Wildshaped');
                updates = { status: newStatus, isWildShaped: false, tempHP: 0 };
            } else {
                newStatus.push('Wildshaped');
                // 2024 Rules: Temp HP = Druid Level (or 3x for Moon Druid)
                const isMoonDruid = combatant.subclass?.toLowerCase().includes('moon');
                const tempHPAmount = isMoonDruid ? combatant.level * 3 : combatant.level;
                
                updates = {
                    status: newStatus,
                    isWildShaped: true,
                    tempHP: tempHPAmount,
                    // Note: In 2024, you also get to choose to use the beast's AC or 13 + WIS mod
                    // We'll use the beast's AC for now as per the selected form
                    ac: selectedBeast.ac,
                    speed: selectedBeast.speed
                };
            }
            onUpdate(combatant.id, updates);
        }
    };

    return (
        <div className="space-y-12">
            <div className="text-center">
                <h3 className={`text-4xl font-black italic tracking-tighter uppercase transition-colors duration-500 ${isWildshaped ? 'text-emerald-500' : 'text-slate-800'}`}>
                    WILD SHAPE
                </h3>
                <div className="flex items-center justify-center gap-2 mt-4">
                    <div className={`size-2 rounded-full ${isWildshaped ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-700'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isWildshaped ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {isWildshaped ? 'BEAST FORM ACTIVE' : 'DRUID FORM'}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SELECT FORM</p>
                <div className="grid grid-cols-2 gap-3">
                    {BEAST_FORMS.map((beast, idx) => (
                        <button
                            key={beast.name}
                            onClick={() => setSelectedBeastIndex(idx)}
                            className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-3 group border-white/5 bg-white/[0.02] hover:bg-white/[0.05] relative ${selectedBeastIndex === idx ? 'border-emerald-500/50 bg-emerald-500/10' : ''}`}
                        >
                            <span className={`material-symbols-outlined text-3xl transition-colors ${selectedBeastIndex === idx ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-300'}`}>
                                {beast.icon}
                            </span>
                            <span className={`text-[10px] font-black tracking-widest uppercase text-center ${selectedBeastIndex === idx ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {beast.name}
                            </span>
                            {selectedBeastIndex === idx && (
                                <motion.div layoutId="beast-selection" className="absolute inset-0 rounded-3xl border border-emerald-500/50 pointer-events-none" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-6">
                 <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">AC</p>
                        <p className="text-2xl font-black text-emerald-500">{selectedBeast.ac}</p>
                    </div>
                    <div className="text-center border-x border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">BEAST HP</p>
                        <p className="text-2xl font-black text-emerald-500">{selectedBeast.hp}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px) font-black text-slate-500 uppercase tracking-widest mb-1">SPEED</p>
                        <p className="text-2xl font-black text-emerald-500">{selectedBeast.speed}<span className="text-[10px]">ft</span></p>
                    </div>
                </div>
            </div>

            <button
                onClick={toggleWildshape}
                className={`w-full py-6 rounded-3xl font-black uppercase tracking-widest text-sm transition-all duration-300 shadow-2xl relative overflow-hidden group ${
                    isWildshaped 
                    ? 'bg-slate-900 border border-emerald-500/50 text-emerald-500 hover:bg-slate-800' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20'
                }`}
            >
                <div className="relative z-10 flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-xl">{isWildshaped ? 'human_intelligence' : 'auto_fix_high'}</span>
                    {isWildshaped ? 'REVERT FORM' : 'SHAPE SHIFT'}
                </div>
                {!isWildshaped && (
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
