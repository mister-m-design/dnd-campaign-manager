"use client";
import React, { useState } from 'react';
import { Character } from '@/types';
import { CLASS_REGISTRY, calculateProficiencyBonus } from '@/lib/rules';
import { CLASS_ABILITIES, ClassAbility } from '@/data/classAbilities';

interface FeatureStepProps {
    char: Character;
}

const ACTION_ECONOMY_COLORS: Record<string, string> = {
    'Action': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Bonus Action': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Reaction': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'Passive': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    'Special': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const ACTION_ECONOMY_ICONS: Record<string, string> = {
    'Action': 'bolt',
    'Bonus Action': 'add_circle',
    'Reaction': 'electric_bolt',
    'Passive': 'shield',
    'Special': 'auto_fix_high',
};

export default function FeatureStep({ char }: FeatureStepProps) {
    const classDef = CLASS_REGISTRY[char.class];
    const level = char.level || 1;
    const profBonus = calculateProficiencyBonus(level);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // All abilities unlocked at or below current level
    const unlockedAbilities = CLASS_ABILITIES.filter(
        a => a.class === char.class && a.minLevel <= level
    );

    // Group by unlock level
    const byLevel = unlockedAbilities.reduce<Record<number, ClassAbility[]>>((acc, ability) => {
        if (!acc[ability.minLevel]) acc[ability.minLevel] = [];
        acc[ability.minLevel].push(ability);
        return acc;
    }, {});

    const levelBreakpoints = Object.keys(byLevel).map(Number).sort((a, b) => a - b);

    // Next upcoming ability
    const nextUnlock = CLASS_ABILITIES
        .filter(a => a.class === char.class && a.minLevel > level)
        .sort((a, b) => a.minLevel - b.minLevel)[0];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="border-b border-white/10 pb-4">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Bloodline & Gift</h2>
                <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                    Class Features &amp; Traits — {char.class} Level {level}
                </p>
            </div>

            {/* Class overview card */}
            <div className="p-6 border border-white/10 rounded-3xl bg-slate-900/50 flex items-center gap-6">
                <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                    <span className="material-symbols-outlined text-primary text-3xl">auto_fix_high</span>
                </div>
                <div className="flex-grow min-w-0">
                    <h3 className="text-xl font-black uppercase tracking-tight">
                        {char.class} <span className="text-primary">Level {level}</span>
                    </h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Universal Rule Injection Active</p>
                </div>
                <div className="flex gap-6 shrink-0">
                    <div className="text-center">
                        <p className="text-2xl font-black text-primary">d{classDef?.hitDie ?? 8}</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Hit Die</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-primary">+{profBonus}</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Prof. Bonus</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-primary">{unlockedAbilities.length}</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Features</p>
                    </div>
                </div>
            </div>

            {/* Core rules */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/5">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest mb-3">Core Rules Applied</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                        Proficiency Bonus (+{profBonus}) on mastered skills &amp; saves
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                        Hit dice: d{classDef?.hitDie ?? 8} (HP scales with level &amp; CON)
                    </div>
                    {classDef?.saveProficiencies && (
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                            Saving throw proficiencies: {classDef.saveProficiencies.join(', ')}
                        </div>
                    )}
                    {classDef?.spellcasting && (
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                            Spellcasting: {classDef.spellcasting.ability} ({classDef.spellcasting.progression})
                        </div>
                    )}
                </div>
            </div>

            {/* Features grouped by unlock level */}
            {levelBreakpoints.length === 0 ? (
                <div className="text-center py-16 text-slate-600">
                    <span className="material-symbols-outlined text-4xl mb-3 block">hourglass_empty</span>
                    <p className="text-[11px] font-black uppercase tracking-widest">No class features found for {char.class}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {levelBreakpoints.map(lvl => (
                        <div key={lvl}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                    lvl === 1
                                        ? 'bg-primary/10 text-primary border-primary/20'
                                        : 'bg-white/5 text-slate-400 border-white/10'
                                }`}>
                                    Level {lvl}
                                </div>
                                <div className="h-px flex-grow bg-white/5" />
                            </div>
                            <div className="space-y-2">
                                {byLevel[lvl].map(ability => {
                                    const isExpanded = expandedId === ability.id;
                                    const colorClass = ACTION_ECONOMY_COLORS[ability.actionEconomy] ?? ACTION_ECONOMY_COLORS['Passive'];
                                    const iconName = ACTION_ECONOMY_ICONS[ability.actionEconomy] ?? 'star';
                                    return (
                                        <button
                                            key={ability.id}
                                            onClick={() => setExpandedId(isExpanded ? null : ability.id)}
                                            className="w-full text-left p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-white/10 hover:bg-slate-900/80 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`size-8 rounded-xl flex items-center justify-center border shrink-0 ${colorClass}`}>
                                                    <span className="material-symbols-outlined text-sm">{iconName}</span>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-black text-[12px] text-slate-100 uppercase tracking-wide">{ability.name}</span>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${colorClass}`}>
                                                            {ability.actionEconomy}
                                                        </span>
                                                        {ability.recharge && (
                                                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5">
                                                                {ability.recharge}
                                                            </span>
                                                        )}
                                                        {ability.charges && (
                                                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/5 text-primary/70 border border-primary/10">
                                                                {ability.charges}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`material-symbols-outlined text-slate-600 text-sm transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    expand_more
                                                </span>
                                            </div>
                                            {isExpanded && (
                                                <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-slate-400 leading-relaxed pl-11">
                                                    {ability.description}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Next unlock teaser */}
            {nextUnlock && level < 20 && (
                <div className="p-4 rounded-2xl border border-dashed border-white/5 bg-white/[0.01] flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-600 text-sm">lock</span>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                        Next unlock at Level {nextUnlock.minLevel}:{' '}
                        <span className="text-slate-500">{nextUnlock.name}</span>
                    </p>
                </div>
            )}
        </div>
    );
}
