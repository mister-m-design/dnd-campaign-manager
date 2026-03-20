
import React from 'react';
import { motion } from 'framer-motion';
import { Character, Ability } from '@/types';
import { ABILITIES_LIST, calculateModifier } from '@/lib/rules';

interface FinalizeStepProps {
    char: Character;
    updateAbility: (ability: Ability, value: number) => void;
    updateIdentity: (field: keyof Character, value: any) => void;
    handleSave: () => void;
    onCombatTrial: () => void;
}

export default function FinalizeStep({ char, updateAbility, updateIdentity, handleSave, onCombatTrial }: FinalizeStepProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-full space-y-12">
            <div className="flex flex-col items-center">
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                    className="size-24 rounded-full border-4 border-primary flex items-center justify-center mb-6 primary-glow relative"
                >
                    <div className="absolute inset-0 rounded-full border border-primary/50 animate-ping opacity-20" />
                    <span className="material-symbols-outlined text-primary text-4xl">verified</span>
                </motion.div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Hero Forged Successfully</h2>
                <p className="text-slate-400 max-w-lg mb-8 text-xs uppercase font-bold tracking-widest leading-loose">
                    The character <span className="text-primary font-black uppercase tracking-widest">{char.name}</span> is ready for deployment. All stats are synchronized.
                </p>
            </div>

            {/* Power Analytics - Manual Adjustments */}
            <div className="w-full max-w-3xl bg-slate-900/50 border border-white/10 rounded-[3rem] p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <span className="material-symbols-outlined text-8xl">Precision_Manufacturing</span>
                </div>
                
                <div className="flex items-center gap-4 mb-8 justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-8 rounded-xl bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-sm">Tune</span>
                        </div>
                        <div className="text-left">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Power Analytics & Manual Calibration</h4>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Adjust final essences if needed for the journey ahead.</p>
                        </div>
                    </div>

                    {/* Level Control */}
                    <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-2 flex items-center gap-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">LEVEL</span>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => updateIdentity('level', Math.max(1, char.level - 1))}
                                className="size-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-slate-400 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm font-black">remove</span>
                            </button>
                            <span className="text-xl font-black text-white w-6 text-center">{char.level}</span>
                            <button 
                                onClick={() => updateIdentity('level', Math.min(20, char.level + 1))}
                                className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 text-primary transition-all"
                            >
                                <span className="material-symbols-outlined text-sm font-black">add</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
                    {ABILITIES_LIST.map(ability => {
                        const value = char.abilityScores[ability];
                        return (
                            <div key={ability} className="bg-slate-950/50 border border-white/5 p-4 rounded-3xl flex flex-col items-center group hover:border-primary/20 transition-all">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{ability}</span>
                                <div className="text-2xl font-black text-white mb-3 tabular-nums">{value}</div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => updateAbility(ability, value - 1)}
                                        className="size-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-slate-400 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">remove</span>
                                    </button>
                                    <button 
                                        onClick={() => updateAbility(ability, value + 1)}
                                        className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 text-primary transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">add</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <button 
                    onClick={handleSave}
                    className="bg-white/5 border border-white/10 px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all active:scale-95"
                >
                    Save to Gallery
                </button>
                <button 
                    onClick={onCombatTrial}
                    className="bg-primary text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all primary-glow"
                >
                    Initiate Combat Trial
                </button>
            </div>
        </div>
    );
}
