
import React, { useMemo, useState } from 'react';
import { Character, Ability } from '@/types';
import { ABILITIES_LIST, calculateModifier } from '@/lib/rules';

interface StatsStepProps {
    char: Character;
    updateAbility: (ability: Ability, value: number) => void;
    updateAbilityBonus: (ability: Ability, value: number) => void;
}

const POINT_BUY_COSTS: Record<number, number> = {
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
};

type GenMode = 'point-buy' | 'standard' | 'rolling' | 'manual';

export default function StatsStep({ char, updateAbility, updateAbilityBonus }: StatsStepProps) {
    const [mode, setMode] = useState<GenMode>('point-buy');
    const [rolledValues, setRolledValues] = useState<number[]>([]);
    const [selectedRolledIndex, setSelectedRolledIndex] = useState<number | null>(null);

    const bonuses = char.abilityBonuses || { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };

    const pointsSpent = useMemo(() => {
        return ABILITIES_LIST.reduce((total, ab) => {
            const val = char.abilityScores[ab];
            return total + (POINT_BUY_COSTS[val] || 0);
        }, 0);
    }, [char.abilityScores]);

    const applyStandardArray = () => {
        const values = [15, 14, 13, 12, 10, 8];
        ABILITIES_LIST.forEach((ability, i) => {
            updateAbility(ability, values[i]);
        });
        setMode('standard');
    };

    const roll4d6DropLowest = () => {
        const results = [];
        for (let i = 0; i < 6; i++) {
            const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
            rolls.sort((a, b) => b - a);
            results.push(rolls[0] + rolls[1] + rolls[2]);
        }
        setRolledValues(results);
        setMode('rolling');
        setSelectedRolledIndex(null);
    };

    const assignRolledValue = (ability: Ability) => {
        if (selectedRolledIndex !== null && rolledValues[selectedRolledIndex] !== undefined) {
            updateAbility(ability, rolledValues[selectedRolledIndex]);
            // Optional: remove used value or mark it
        }
    };

    const handleStatChange = (ability: Ability, delta: number) => {
        const current = char.abilityScores[ability];
        const next = current + delta;
        
        if (mode === 'point-buy') {
            if (next < 8 || next > 15) return;
            const costDiff = (POINT_BUY_COSTS[next] || 0) - (POINT_BUY_COSTS[current] || 0);
            if (pointsSpent + costDiff <= 27) {
                updateAbility(ability, next);
            }
        } else {
            if (next < 1) return;
            updateAbility(ability, next);
        }
    };

    const toggleBonus = (ability: Ability, amount: number) => {
        const current = bonuses[ability] || 0;
        const next = current === amount ? 0 : amount;
        updateAbilityBonus(ability, next);
    };

    const totalBonusPoints = Object.values(bonuses).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-12 h-full overflow-y-auto pb-20 pr-4 styled-scrollbar">
            <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Core Essences</h2>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em]">Ability Scores</p>
                        <div className="size-1 rounded-full bg-white/20" />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${mode === 'point-buy' && pointsSpent > 27 ? 'text-red-500' : 'text-primary'}`}>
                            {mode === 'point-buy' ? `${27 - pointsSpent} POINTS REMAINING` : `${mode.toUpperCase()} MODE`}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {['point-buy', 'standard', 'rolling', 'manual'].map((m) => (
                        <button 
                            key={m}
                            onClick={() => {
                                if (m === 'standard') applyStandardArray();
                                else if (m === 'rolling') roll4d6DropLowest();
                                else setMode(m as GenMode);
                            }}
                            className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${mode === m ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                        >
                            {m.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {mode === 'rolling' && rolledValues.length > 0 && (
                <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Rolled Pool (Pick a value then click a stat)</h4>
                    <div className="flex gap-3">
                        {rolledValues.map((val, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedRolledIndex(i)}
                                className={`size-12 rounded-xl flex items-center justify-center text-xl font-black border transition-all ${selectedRolledIndex === i ? 'bg-primary text-slate-950 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]' : 'bg-white/5 border-white/10 text-white hover:border-primary/50'}`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ABILITIES_LIST.map(ability => {
                    const baseValue = char.abilityScores[ability];
                    const bonus = bonuses[ability] || 0;
                    const totalValue = baseValue + bonus;
                    const mod = calculateModifier(totalValue);
                    
                    const canInc = mode === 'point-buy' 
                        ? (baseValue < 15 && (pointsSpent + ((POINT_BUY_COSTS[baseValue+1] || 0) - (POINT_BUY_COSTS[baseValue] || 0)) <= 27))
                        : true;
                    
                    const canDec = mode === 'point-buy' ? baseValue > 8 : baseValue > 1;

                    return (
                        <div 
                            key={ability} 
                            onClick={() => assignRolledValue(ability)}
                            className={`group bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] hover:bg-slate-900/60 hover:border-primary/30 transition-all duration-500 cursor-pointer relative overflow-hidden ${mode === 'rolling' && selectedRolledIndex !== null ? 'ring-2 ring-primary/50 ring-offset-4 ring-offset-slate-950' : ''}`}
                        >
                            {bonus > 0 && <div className="absolute inset-0 bg-primary/[0.03] animate-pulse pointer-events-none" />}

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">{ability}</span>
                                    <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-tighter italic">Essence Score</h3>
                                </div>
                                <div className="text-right">
                                    <div className={`text-4xl font-black leading-none tracking-tighter ${mod >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                                        {mod >= 0 ? '+' : ''}{mod}
                                    </div>
                                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">MODIFIER</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 py-2 relative z-10">
                                <div className="flex items-center gap-4">
                                    <button 
                                        disabled={!canDec}
                                        onClick={(e) => { e.stopPropagation(); handleStatChange(ability, -1); }}
                                        className="size-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">remove</span>
                                    </button>
                                    
                                    <div className="flex flex-col items-center">
                                        <div className="text-4xl font-black text-white tabular-nums tracking-tighter select-none">
                                            {totalValue}
                                        </div>
                                        {bonus > 0 && (
                                            <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded mt-0.5">+{bonus} Bonus</span>
                                        )}
                                    </div>

                                    <button 
                                        disabled={!canInc}
                                        onClick={(e) => { e.stopPropagation(); handleStatChange(ability, 1); }}
                                        className="size-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-primary/20 hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">add</span>
                                    </button>
                                </div>

                                <div className="h-10 w-px bg-white/5 mx-2" />

                                <div className="flex flex-col gap-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleBonus(ability, 2); }}
                                        className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${bonus === 2 ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-600 hover:text-white'}`}
                                    >
                                        +2
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleBonus(ability, 1); }}
                                        className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${bonus === 1 ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-600 hover:text-white'}`}
                                    >
                                        +1
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-primary">Info</span>
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">
                                {mode === 'point-buy' ? 'Point Buy Rules' : mode === 'rolling' ? 'Dice Rolling' : 'Manual Entry'}
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-bold uppercase">
                                {mode === 'point-buy' 
                                    ? 'Start at 8. Maximum base score is 15. Total points available: 27.'
                                    : mode === 'rolling'
                                    ? '4d6 (drop lowest) x 6. Assign these values to your attributes.'
                                    : 'Directly edit your ability scores. Limits and point costs are disabled.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`bg-slate-900/50 border p-6 rounded-3xl transition-all ${totalBonusPoints > 3 ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/5'}`}>
                    <div className="flex items-start gap-4">
                        <span className={`material-symbols-outlined ${totalBonusPoints > 3 ? 'text-rose-500' : 'text-primary'}`}>stars</span>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Genesis Bonuses</h4>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${totalBonusPoints === 3 ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-400'}`}>
                                    {totalBonusPoints} / 3 Assigned
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-bold uppercase">
                                Usually you get +2 to one stat and +1 to another, or +1 to three stats. Pick yours now.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
