"use client";
import React from 'react';
import { Character } from '@/types';
import { CLASS_REGISTRY, calculateProficiencyBonus } from '@/lib/rules';
import { CLASS_ABILITIES } from '@/data/classAbilities';

interface ClassStepProps {
    char: Character;
    updateClass: (className: string) => void;
}

const CLASS_ICONS: Record<string, string> = {
    Barbarian: 'sports_mma',
    Bard: 'music_note',
    Cleric: 'star',
    Druid: 'eco',
    Fighter: 'shield',
    Monk: 'self_improvement',
    Paladin: 'military_tech',
    Ranger: 'landscape',
    Rogue: 'visibility_off',
    Sorcerer: 'auto_fix_high',
    Warlock: 'dark_mode',
    Wizard: 'import_contacts',
};

export default function ClassStep({ char, updateClass }: ClassStepProps) {
    const level = char.level || 1;
    const profBonus = calculateProficiencyBonus(level);
    const selectedDef = CLASS_REGISTRY[char.class];

    // Count features available at current level for selected class
    const featureCount = CLASS_ABILITIES.filter(
        a => a.class === char.class && a.minLevel <= level
    ).length;

    return (
        <div className="space-y-8">
            <div className="border-b border-white/10 pb-4 flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Choose Your Fate</h2>
                    <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        Heroic Class — Level {level}
                    </p>
                </div>
                {/* Quick stat preview */}
                <div className="flex gap-4 text-right">
                    <div>
                        <p className="text-lg font-black text-primary">+{profBonus}</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Prof. Bonus</p>
                    </div>
                    <div>
                        <p className="text-lg font-black text-primary">{featureCount}</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Features</p>
                    </div>
                </div>
            </div>

            {/* Selected class detail card */}
            {selectedDef && (
                <div className="p-5 rounded-3xl bg-primary/5 border border-primary/20 flex items-center gap-5">
                    <div className="size-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl">
                            {CLASS_ICONS[char.class] ?? 'person'}
                        </span>
                    </div>
                    <div className="flex-grow min-w-0">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Selected Class</p>
                        <p className="text-xl font-black text-white uppercase tracking-tight">{char.class}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                            d{selectedDef.hitDie} Hit Die · Saves: {selectedDef.saveProficiencies.join(', ')}
                            {selectedDef.spellcasting ? ` · Spellcasting (${selectedDef.spellcasting.ability})` : ''}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[8px] font-black text-primary uppercase tracking-widest">
                            {featureCount} feature{featureCount !== 1 ? 's' : ''} at Lv {level}
                        </p>
                    </div>
                </div>
            )}

            {/* Class grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.keys(CLASS_REGISTRY).map(cls => {
                    const def = CLASS_REGISTRY[cls];
                    const isSelected = char.class === cls;
                    const availableFeatures = CLASS_ABILITIES.filter(
                        a => a.class === cls && a.minLevel <= level
                    ).length;
                    const icon = CLASS_ICONS[cls] ?? 'person';

                    return (
                        <button
                            key={cls}
                            onClick={() => updateClass(cls)}
                            className={`p-5 rounded-3xl border transition-all text-left group flex flex-col gap-3 ${
                                isSelected
                                    ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
                                    : 'bg-slate-900/60 border-white/5 hover:border-white/15 hover:bg-slate-900/80'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className={`size-9 rounded-xl flex items-center justify-center border transition-all ${
                                    isSelected
                                        ? 'bg-primary/20 border-primary/40 text-primary'
                                        : 'bg-white/5 border-white/5 text-slate-500 group-hover:text-slate-300'
                                }`}>
                                    <span className="material-symbols-outlined text-base">{icon}</span>
                                </div>
                                {isSelected && (
                                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                )}
                            </div>
                            <div>
                                <h4 className={`font-black uppercase tracking-tighter text-base leading-none transition-colors ${
                                    isSelected ? 'text-primary' : 'text-slate-200 group-hover:text-white'
                                }`}>
                                    {cls}
                                </h4>
                                <p className="text-[8px] font-black uppercase text-slate-600 mt-1.5">
                                    d{def.hitDie} · {availableFeatures} feature{availableFeatures !== 1 ? 's' : ''} @ Lv {level}
                                </p>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                                {def.primaryAbilities.map(ability => (
                                    <span key={ability} className={`text-[7px] font-black border px-1.5 py-0.5 rounded-md uppercase transition-colors ${
                                        isSelected
                                            ? 'border-primary/30 text-primary/80 bg-primary/5'
                                            : 'border-white/10 text-slate-500'
                                    }`}>
                                        {ability}
                                    </span>
                                ))}
                                {def.spellcasting && (
                                    <span className={`text-[7px] font-black border px-1.5 py-0.5 rounded-md uppercase transition-colors ${
                                        isSelected
                                            ? 'border-violet-500/30 text-violet-400/80 bg-violet-500/5'
                                            : 'border-white/5 text-slate-600'
                                    }`}>
                                        ✦ Spells
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
