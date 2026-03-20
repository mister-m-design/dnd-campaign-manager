"use client";
import React from 'react';
import { Character } from '@/types';
import { calculateProficiencyBonus, calculateModifier } from '@/lib/rules';

interface ProficiencyStepProps {
    char: Character;
    toggleSkill: (skill: string) => void;
}

const SKILL_ABILITY_MAP: Record<string, string> = {
    'Acrobatics': 'DEX',
    'Animal Handling': 'WIS',
    'Arcana': 'INT',
    'Athletics': 'STR',
    'Deception': 'CHA',
    'History': 'INT',
    'Insight': 'WIS',
    'Intimidation': 'CHA',
    'Investigation': 'INT',
    'Medicine': 'WIS',
    'Nature': 'INT',
    'Perception': 'WIS',
    'Performance': 'CHA',
    'Persuasion': 'CHA',
    'Religion': 'INT',
    'Sleight of Hand': 'DEX',
    'Stealth': 'DEX',
    'Survival': 'WIS',
};

const SKILLS = Object.keys(SKILL_ABILITY_MAP);

export default function ProficiencyStep({ char, toggleSkill }: ProficiencyStepProps) {
    const level = char.level || 1;
    const profBonus = calculateProficiencyBonus(level);
    const selectedCount = char.skillProficiencies.length;

    const getSkillTotal = (skill: string): string => {
        const ability = SKILL_ABILITY_MAP[skill] as keyof typeof char.abilityScores;
        const abilityScore = char.abilityScores?.[ability] ?? 10;
        const abilityMod = calculateModifier(abilityScore);
        const isProficient = char.skillProficiencies.includes(skill);
        const total = abilityMod + (isProficient ? profBonus : 0);
        return total >= 0 ? `+${total}` : `${total}`;
    };

    return (
        <div className="space-y-8">
            <div className="border-b border-white/10 pb-4 flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Skill Mastery</h2>
                    <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        Select Proficiencies — Bonus +{profBonus}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-primary">{selectedCount}</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Selected</p>
                </div>
            </div>

            {/* Info banner */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                <p className="text-[10px] font-black text-primary/80 uppercase tracking-wider">
                    Proficiency Bonus +{profBonus} · Lv {level} — Proficient skills add this bonus to ability checks
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SKILLS.map(skill => {
                    const isProficient = char.skillProficiencies.includes(skill);
                    const abilityTag = SKILL_ABILITY_MAP[skill];
                    const total = getSkillTotal(skill);

                    return (
                        <button
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                                isProficient
                                    ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.08)]'
                                    : 'bg-slate-900/60 border-white/5 hover:border-white/15 hover:bg-slate-900/80'
                            }`}
                        >
                            <div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isProficient ? 'text-primary' : 'text-slate-400'}`}>
                                    {skill}
                                </span>
                                <p className={`text-[8px] font-black uppercase mt-0.5 ${isProficient ? 'text-primary/60' : 'text-slate-600'}`}>
                                    {abilityTag}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={`text-base font-black tabular-nums ${isProficient ? 'text-primary' : 'text-slate-500'}`}>
                                    {total}
                                </p>
                                {isProficient && (
                                    <p className="text-[7px] text-primary/60 font-black uppercase">proficient</p>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
