"use client";

import React, { useState, useMemo } from 'react';
import { Character } from '@/types';
import { SPELL_LIST, Spell } from '@/data/spells';

// ── Same spell source everywhere: @/data/spells ──────────────────────────────
// SpellStep, DMExpandedPanel, and CombatTracker all import from this same file.
// This means the spellbook a character builds is the same as what combat uses.

interface SpellStepProps {
    char: Character;
    toggleSpell: (spellId: string) => void;
    isDMMode?: boolean;
}

const SPELL_SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];

function getMaxSpellLevelForClass(className: string, charLevel: number): number {
    const fullCasters = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'];
    const halfCasters = ['Paladin', 'Ranger'];
    if (fullCasters.includes(className)) {
        if (charLevel >= 17) return 9;
        if (charLevel >= 15) return 8;
        if (charLevel >= 13) return 7;
        if (charLevel >= 11) return 6;
        if (charLevel >= 9)  return 5;
        if (charLevel >= 7)  return 4;
        if (charLevel >= 5)  return 3;
        if (charLevel >= 3)  return 2;
        return 1;
    }
    if (halfCasters.includes(className)) {
        if (charLevel >= 17) return 5;
        if (charLevel >= 13) return 4;
        if (charLevel >= 9)  return 3;
        if (charLevel >= 5)  return 2;
        if (charLevel >= 2)  return 1;
        return 0;
    }
    return 0;
}

const schoolColor: Record<string, string> = {
    Abjuration:   'text-blue-400',
    Conjuration:  'text-yellow-400',
    Divination:   'text-sky-400',
    Enchantment:  'text-pink-400',
    Evocation:    'text-orange-400',
    Illusion:     'text-purple-400',
    Necromancy:   'text-green-400',
    Transmutation:'text-amber-400',
};

const SpellStep: React.FC<SpellStepProps> = ({ char, toggleSpell, isDMMode = false }) => {
    const [query, setQuery]           = useState('');
    const [schoolFilter, setSchoolFilter] = useState('');
    const [levelFilter, setLevelFilter]   = useState<number | ''>('');
    const [expandedId, setExpandedId]     = useState<string | null>(null);

    const selectedSpells = char.magic?.spells || [];
    const charLevel = char.level || 1;
    const maxLevel  = getMaxSpellLevelForClass(char.class, charLevel);
    const isCaster  = maxLevel > 0;

    // Build annotated list
    const visibleSpells = useMemo<(Spell & { illegal?: boolean; illegalReason?: string })[]>(() => {
        return SPELL_LIST
            .map(spell => {
                const classMatch = spell.classes.includes(char.class);
                const levelLegal = spell.level <= maxLevel;
                const isIllegal  = !classMatch || !levelLegal;
                let illegalReason: string | undefined;
                if (!classMatch)  illegalReason = `Not on the ${char.class} spell list`;
                else if (!levelLegal) illegalReason = `Requires spell level ${spell.level} (max ${maxLevel} at Lv${charLevel})`;
                return { ...spell, illegal: isIllegal, illegalReason };
            })
            .filter(spell => {
                // In standard mode, hide illegal spells; in DM mode show them with warning
                if (!isDMMode && spell.illegal) return false;
                const q = query.toLowerCase().trim();
                if (q && !spell.name.toLowerCase().includes(q) &&
                    !spell.school.toLowerCase().includes(q) &&
                    !(spell.damageType || '').toLowerCase().includes(q) &&
                    !spell.description.toLowerCase().includes(q)) return false;
                if (schoolFilter && spell.school !== schoolFilter) return false;
                if (levelFilter !== '' && spell.level !== Number(levelFilter)) return false;
                return true;
            });
    }, [char.class, charLevel, maxLevel, isDMMode, query, schoolFilter, levelFilter]);

    const grouped = useMemo(() => {
        const map = new Map<number, typeof visibleSpells>();
        visibleSpells.forEach(s => {
            const arr = map.get(s.level) ?? [];
            arr.push(s);
            map.set(s.level, arr);
        });
        return Array.from(map.entries()).sort(([a], [b]) => a - b);
    }, [visibleSpells]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Spellbook</h2>
                    {isDMMode && (
                        <span className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[8px] font-black uppercase tracking-widest">
                            DM Mode — All Spells Visible
                        </span>
                    )}
                </div>
                <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                    {isCaster
                        ? `${char.class} · Level ${charLevel} · Up to Level ${maxLevel} spells`
                        : `${char.class} is not a spellcasting class`}
                    {isDMMode && ' · Rule override active'}
                </p>
                {selectedSpells.length > 0 && (
                    <p className="text-[9px] font-black text-amber-400 mt-1">
                        {selectedSpells.length} spell{selectedSpells.length > 1 ? 's' : ''} selected
                    </p>
                )}
            </div>

            {/* Non-caster guard (standard mode only) */}
            {!isCaster && !isDMMode && (
                <div className="p-8 rounded-2xl bg-slate-900/50 border border-white/10 text-center space-y-2">
                    <span className="material-symbols-outlined text-4xl text-slate-600 block">auto_fix_off</span>
                    <p className="text-slate-400 font-semibold">{char.class} has no spellcasting</p>
                    <p className="text-slate-600 text-xs max-w-sm mx-auto">
                        Enable <strong className="text-purple-400">DM Mode</strong> (top-right) to override this restriction and grant any spell or ability.
                    </p>
                </div>
            )}

            {(isCaster || isDMMode) && (
                <>
                    {/* Search + Filters */}
                    <div className="flex flex-col gap-2">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-500">search</span>
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search name, school, damage type, description…"
                                className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}
                                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500/40 transition-all">
                                <option value="">All Schools</option>
                                {SPELL_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value === '' ? '' : parseInt(e.target.value))}
                                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500/40 transition-all">
                                <option value="">All Levels</option>
                                <option value="0">Cantrips</option>
                                {[1,2,3,4,5,6,7,8,9].map(l => (
                                    <option key={l} value={l}>Level {l}{l > maxLevel && isDMMode ? ' ⚠' : ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Count */}
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        {visibleSpells.length} spell{visibleSpells.length !== 1 ? 's' : ''} shown
                        {isDMMode && visibleSpells.filter(s => s.illegal).length > 0 && (
                            <span className="text-red-400/60 ml-2">
                                · {visibleSpells.filter(s => s.illegal).length} outside normal rules
                            </span>
                        )}
                    </p>

                    {/* Grouped spell list */}
                    <div className="space-y-8">
                        {grouped.map(([level, spells]) => (
                            <div key={level} className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {level === 0 ? 'Cantrips' : `Level ${level} Spells`}
                                    </h3>
                                    <div className="flex-1 h-px bg-white/5" />
                                    <span className="text-[8px] text-slate-700">{spells.length}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {spells.map(spell => {
                                        const isSelected = selectedSpells.includes(spell.id);
                                        const isExpanded = expandedId === spell.id;

                                        return (
                                            <div key={spell.id} className={`rounded-2xl border transition-all overflow-hidden ${
                                                isSelected
                                                    ? 'bg-purple-500/15 border-purple-500/40 shadow-lg shadow-purple-500/10'
                                                    : spell.illegal
                                                        ? 'bg-red-500/5 border-red-500/15'
                                                        : 'bg-white/[0.03] border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05]'
                                            }`}>
                                                {/* Main row: click to select */}
                                                <button onClick={() => toggleSpell(spell.id)} className="w-full flex items-center gap-3 p-3 text-left">
                                                    <div className={`shrink-0 size-5 rounded-lg border flex items-center justify-center transition-all ${
                                                        isSelected ? 'bg-purple-500 border-purple-400' : 'border-white/15'
                                                    }`}>
                                                        {isSelected && (
                                                            <span className="material-symbols-outlined text-[11px] text-white">check</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className={`text-[12px] font-black ${isSelected ? 'text-purple-200' : 'text-white'}`}>
                                                                {spell.name}
                                                            </span>
                                                            <span className={`text-[8px] uppercase tracking-widest ${schoolColor[spell.school] ?? 'text-slate-500'}`}>
                                                                {spell.school}
                                                            </span>
                                                            {spell.concentration && (
                                                                <span className="text-[7px] font-black px-1 rounded border text-amber-400/70 border-amber-500/20 bg-amber-500/5">C</span>
                                                            )}
                                                            {spell.illegal && (
                                                                <span className="text-[7px] font-black px-1 rounded border text-red-400 border-red-500/20 bg-red-500/10">⚠ Override</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[8px] text-slate-600 mt-0.5">
                                                            {spell.castingTime} · {spell.range}
                                                            {spell.damageDice && ` · ${spell.damageDice}${spell.damageType ? ` ${spell.damageType}` : ''}`}
                                                            {spell.saveType && ` · ${spell.saveType} save`}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <span className="shrink-0 text-[8px] font-black uppercase text-purple-400">✓</span>
                                                    )}
                                                </button>

                                                {/* Expand toggle */}
                                                <button
                                                    onClick={() => setExpandedId(prev => prev === spell.id ? null : spell.id)}
                                                    className="w-full flex items-center gap-1 px-3 pb-2 text-slate-600 hover:text-slate-400 transition-colors"
                                                >
                                                    <span className="text-[8px] uppercase tracking-widest">Details</span>
                                                    <span className="material-symbols-outlined text-[11px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                                                </button>

                                                {/* Expanded detail */}
                                                {isExpanded && (
                                                    <div className="px-3 pb-3 space-y-2">
                                                        <p className="text-[10px] text-slate-400 leading-relaxed">{spell.description}</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span className="text-[8px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg text-slate-500">⏱ {spell.castingTime}</span>
                                                            <span className="text-[8px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg text-slate-500">📍 {spell.range}</span>
                                                            <span className="text-[8px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg text-slate-500">⌛ {spell.duration}</span>
                                                            {(spell as any).components && (
                                                                <span className="text-[8px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg text-slate-500">{(spell as any).components}</span>
                                                            )}
                                                            {spell.saveType && (
                                                                <span className="text-[8px] bg-red-500/10 border border-red-500/15 px-2 py-0.5 rounded-lg text-red-400">{spell.saveType} save</span>
                                                            )}
                                                        </div>
                                                        {spell.illegalReason && (
                                                            <p className="text-[8px] text-red-400/80">{spell.illegalReason}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {grouped.length === 0 && (
                            <div className="text-center py-12 text-slate-600">
                                <span className="material-symbols-outlined text-3xl block mb-2">search_off</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">No spells match your filters</p>
                                <p className="text-[8px] mt-1 text-slate-700">Try clearing the search or changing filters</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default SpellStep;
