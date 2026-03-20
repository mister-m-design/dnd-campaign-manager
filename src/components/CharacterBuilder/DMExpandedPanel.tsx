"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPELL_LIST, Spell } from '@/data/spells';
import { CLASS_ABILITIES, MONSTER_ABILITIES, ClassAbility } from '@/data/classAbilities';
import { EQUIPMENT_LIST, SimpleItem } from '@/data/equipment';
import { Character } from '@/types';

type ContentType = 'spell' | 'ability' | 'equipment' | 'monster';
type AddMode = 'permanent' | 'session';

interface SearchResult {
    type: ContentType;
    id: string;
    name: string;
    level?: number;
    school?: string;
    class?: string;
    minLevel?: number;
    actionEconomy?: string;
    category?: string;
    description: string;
    illegal?: boolean;
    illegalReason?: string;
    raw: Spell | ClassAbility | SimpleItem;
}

interface DMExpandedPanelProps {
    char: Character;
    onAddSpell: (spellId: string, permanent: boolean) => void;
    onAddAbility: (ability: ClassAbility, permanent: boolean) => void;
    onAddEquipment: (item: SimpleItem, permanent: boolean) => void;
}

const ALL_CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
const SPELL_SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];

export default function DMExpandedPanel({ char, onAddSpell, onAddAbility, onAddEquipment }: DMExpandedPanelProps) {
    const [query, setQuery] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<ContentType[]>(['spell', 'ability', 'equipment']);
    const [classFilter, setClassFilter] = useState<string>('');
    const [levelFilter, setLevelFilter] = useState<number | null>(null);
    const [showAllOptions, setShowAllOptions] = useState(false);
    const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
    const [addMode, setAddMode] = useState<AddMode>('permanent');

    const charLevel = char.level || 1;

    // ── Build search results ─────────────────────────────────────
    const results = useMemo<SearchResult[]>(() => {
        const q = query.toLowerCase().trim();
        const out: SearchResult[] = [];

        // Spells
        if (selectedTypes.includes('spell')) {
            SPELL_LIST.forEach(spell => {
                const matchesQuery = !q || spell.name.toLowerCase().includes(q) ||
                    spell.school.toLowerCase().includes(q) ||
                    (spell.damageType || '').toLowerCase().includes(q) ||
                    spell.description.toLowerCase().includes(q);
                if (!matchesQuery) return;

                const matchesClass = !classFilter || spell.classes.includes(classFilter);
                if (!matchesClass && !showAllOptions) return;

                const matchesLevel = levelFilter === null || spell.level === levelFilter;
                if (!matchesLevel) return;

                // Legality checks
                const classMatch = spell.classes.includes(char.class);
                const maxCasterLevel = getMaxSpellLevelForClass(char.class, charLevel);
                const levelLegal = spell.level <= maxCasterLevel;
                const isIllegal = !classMatch || !levelLegal;

                if (isIllegal && !showAllOptions) return;

                let illegalReason: string | undefined;
                if (!classMatch) illegalReason = `Not a ${char.class} spell`;
                else if (!levelLegal) illegalReason = `Requires spell level ${spell.level} (max is ${maxCasterLevel} for Lv${charLevel} ${char.class})`;

                out.push({
                    type: 'spell', id: spell.id, name: spell.name,
                    level: spell.level, school: spell.school,
                    description: spell.description,
                    illegal: isIllegal, illegalReason,
                    raw: spell,
                });
            });
        }

        // Class abilities
        if (selectedTypes.includes('ability')) {
            const allAbilities = [...CLASS_ABILITIES, ...MONSTER_ABILITIES];
            allAbilities.forEach(ability => {
                const matchesQuery = !q || ability.name.toLowerCase().includes(q) ||
                    ability.class.toLowerCase().includes(q) ||
                    ability.description.toLowerCase().includes(q);
                if (!matchesQuery) return;

                const matchesClass = !classFilter || ability.class === classFilter || ability.class === 'Monster';
                if (!matchesClass && !showAllOptions) return;

                const isIllegal = ability.class !== char.class && ability.class !== 'Monster';
                const levelIllegal = ability.minLevel > charLevel;

                if ((isIllegal || levelIllegal) && !showAllOptions) return;

                let illegalReason: string | undefined;
                if (isIllegal) illegalReason = `${char.class} doesn't normally have ${ability.class} abilities`;
                else if (levelIllegal) illegalReason = `Requires Level ${ability.minLevel} (character is Level ${charLevel})`;

                out.push({
                    type: 'ability', id: ability.id, name: ability.name,
                    class: ability.class, minLevel: ability.minLevel,
                    actionEconomy: ability.actionEconomy,
                    description: ability.description,
                    illegal: isIllegal || levelIllegal, illegalReason,
                    raw: ability,
                });
            });
        }

        // Equipment
        if (selectedTypes.includes('equipment')) {
            EQUIPMENT_LIST.forEach((item: SimpleItem) => {
                const matchesQuery = !q || item.name.toLowerCase().includes(q) ||
                    item.type.toLowerCase().includes(q) ||
                    (item.category || '').toLowerCase().includes(q);
                if (!matchesQuery) return;

                const isEquipped = (char.resources?.inventory || []).some((i: any) => i.id === item.id);
                if (isEquipped) return; // already have it

                out.push({
                    type: 'equipment', id: item.id, name: item.name,
                    category: item.category,
                    description: `${item.type} · ${item.category || ''}${(item as any).damageDice ? ` · ${(item as any).damageDice}` : ''}`,
                    illegal: false,
                    raw: item,
                });
            });
        }

        return out.slice(0, 60);
    }, [query, selectedTypes, classFilter, levelFilter, showAllOptions, char.class, charLevel]);

    const handleAdd = () => {
        if (!selectedResult) return;
        const permanent = addMode === 'permanent';

        if (selectedResult.type === 'spell') {
            onAddSpell(selectedResult.id, permanent);
        } else if (selectedResult.type === 'ability') {
            onAddAbility(selectedResult.raw as ClassAbility, permanent);
        } else if (selectedResult.type === 'equipment') {
            onAddEquipment(selectedResult.raw as SimpleItem, permanent);
        }
        setSelectedResult(null);
    };

    const typeIcon = (t: ContentType) => {
        if (t === 'spell') return 'auto_fix_normal';
        if (t === 'ability') return 'bolt';
        if (t === 'equipment') return 'backpack';
        return 'pets';
    };

    const typeBadgeColor = (t: ContentType) => {
        if (t === 'spell') return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
        if (t === 'ability') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        if (t === 'equipment') return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        return 'text-red-400 bg-red-500/10 border-red-500/20';
    };

    const levelLabel = (type: ContentType, level?: number, minLevel?: number) => {
        if (type === 'spell') {
            return level === 0 ? 'Cantrip' : `Level ${level}`;
        }
        if (type === 'ability' && minLevel !== undefined) return `Lv${minLevel}+`;
        return '';
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">DM Expanded Library</span>
            </div>

            {/* Search bar */}
            <div className="relative mb-3">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-500">search</span>
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder='Search spells, abilities, gear…'
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                />
                {query && (
                    <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                )}
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                {/* Type toggles */}
                {(['spell', 'ability', 'equipment'] as ContentType[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setSelectedTypes(prev =>
                            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                        )}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-wider transition-all ${
                            selectedTypes.includes(t) ? typeBadgeColor(t) : 'text-slate-600 border-white/5 bg-transparent hover:border-white/10'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[11px]">{typeIcon(t)}</span>
                        {t}
                    </button>
                ))}
            </div>

            {/* Secondary filters */}
            <div className="flex gap-2 mb-3">
                <select
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-purple-500/40 transition-all"
                >
                    <option value="">All Classes</option>
                    {ALL_CLASSES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Monster">Monster</option>
                </select>
                <select
                    value={levelFilter ?? ''}
                    onChange={e => setLevelFilter(e.target.value === '' ? null : parseInt(e.target.value))}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-purple-500/40 transition-all"
                >
                    <option value="">All Levels</option>
                    <option value="0">Cantrips</option>
                    {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
            </div>

            {/* Show all toggle */}
            <button
                onClick={() => setShowAllOptions(prev => !prev)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest mb-3 transition-all w-full justify-center ${
                    showAllOptions
                        ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                        : 'bg-white/[0.02] border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15'
                }`}
            >
                <span className="material-symbols-outlined text-[12px]">{showAllOptions ? 'visibility' : 'visibility_off'}</span>
                {showAllOptions ? 'Showing All Options (incl. illegal)' : 'Show Only Legal Options'}
            </button>

            {/* Results list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
                {results.length === 0 ? (
                    <div className="text-center py-10 text-slate-600">
                        <span className="material-symbols-outlined text-3xl block mb-2">search_off</span>
                        <p className="text-[9px] font-black uppercase tracking-widest">No results found</p>
                        <p className="text-[8px] mt-1">Try enabling "Show All Options" or changing filters</p>
                    </div>
                ) : (
                    results.map(result => (
                        <motion.button
                            key={`${result.type}-${result.id}`}
                            onClick={() => setSelectedResult(prev => prev?.id === result.id && prev?.type === result.type ? null : result)}
                            className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all group ${
                                selectedResult?.id === result.id && selectedResult?.type === result.type
                                    ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/10'
                                    : result.illegal
                                        ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] opacity-60 hover:opacity-100'
                                        : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10'
                            }`}
                            layout
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {/* Icon */}
                            <div className={`shrink-0 size-7 rounded-lg flex items-center justify-center border mt-0.5 ${typeBadgeColor(result.type)}`}>
                                <span className="material-symbols-outlined text-[13px]">{typeIcon(result.type)}</span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-black text-white group-hover:text-purple-300 transition-colors truncate">{result.name}</span>
                                    {result.level !== undefined && (
                                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                            result.level === 0 ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-violet-400 bg-violet-500/10 border-violet-500/20'
                                        }`}>
                                            {levelLabel(result.type, result.level, result.minLevel)}
                                        </span>
                                    )}
                                    {result.minLevel !== undefined && result.type === 'ability' && (
                                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded border text-amber-400 bg-amber-500/10 border-amber-500/20">
                                            Lv{result.minLevel}+
                                        </span>
                                    )}
                                    {result.school && (
                                        <span className="text-[7px] text-slate-600 uppercase tracking-widest">{result.school}</span>
                                    )}
                                    {result.actionEconomy && result.type === 'ability' && (
                                        <span className="text-[7px] text-slate-600 uppercase tracking-widest">{result.actionEconomy}</span>
                                    )}
                                    {result.illegal && (
                                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded border text-red-400 bg-red-500/10 border-red-500/20 shrink-0">⚠ Illegal</span>
                                    )}
                                </div>
                                <p className="text-[8px] text-slate-600 mt-0.5 leading-snug line-clamp-2 group-hover:text-slate-500 transition-colors">{result.description}</p>
                                {result.illegalReason && (
                                    <p className="text-[8px] text-red-400/70 mt-1 leading-snug">{result.illegalReason}</p>
                                )}
                            </div>
                        </motion.button>
                    ))
                )}
            </div>

            {/* Detail + Add panel */}
            <AnimatePresence>
                {selectedResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 8, height: 0 }}
                        className="mt-3 border-t border-white/10 pt-3 space-y-3 overflow-hidden"
                    >
                        {/* Selected item detail */}
                        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/8">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`size-6 rounded-lg flex items-center justify-center border ${typeBadgeColor(selectedResult.type)}`}>
                                    <span className="material-symbols-outlined text-[12px]">{typeIcon(selectedResult.type)}</span>
                                </div>
                                <span className="text-[12px] font-black text-white">{selectedResult.name}</span>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-relaxed">{selectedResult.description}</p>
                            {selectedResult.illegalReason && (
                                <div className="mt-2 flex items-start gap-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <span className="material-symbols-outlined text-[12px] text-red-400 mt-0.5 shrink-0">warning</span>
                                    <p className="text-[8px] text-red-300 leading-snug">{selectedResult.illegalReason}</p>
                                </div>
                            )}
                        </div>

                        {/* Permanent vs Session toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setAddMode('permanent')}
                                className={`flex-1 py-2 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all ${
                                    addMode === 'permanent' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-white/[0.02] border-white/8 text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[11px] block mx-auto mb-0.5">save</span>
                                Permanent
                            </button>
                            <button
                                onClick={() => setAddMode('session')}
                                className={`flex-1 py-2 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all ${
                                    addMode === 'session' ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' : 'bg-white/[0.02] border-white/8 text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[11px] block mx-auto mb-0.5">schedule</span>
                                Session Only
                            </button>
                        </div>

                        {/* Add button */}
                        <button
                            onClick={handleAdd}
                            className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                                selectedResult.illegal
                                    ? 'bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25'
                                    : 'bg-purple-500/20 border border-purple-500/40 text-purple-200 hover:bg-purple-500/30'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">add_circle</span>
                            {selectedResult.illegal ? 'Add Anyway (Override)' : `Add ${addMode === 'permanent' ? 'Permanently' : 'for Session'}`}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function getMaxSpellLevelForClass(className: string, charLevel: number): number {
    const fullCasters = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'];
    const halfCasters = ['Paladin', 'Ranger'];
    if (fullCasters.includes(className)) {
        if (charLevel >= 17) return 9;
        if (charLevel >= 15) return 8;
        if (charLevel >= 13) return 7;
        if (charLevel >= 11) return 6;
        if (charLevel >= 9) return 5;
        if (charLevel >= 7) return 4;
        if (charLevel >= 5) return 3;
        if (charLevel >= 3) return 2;
        return 1;
    }
    if (halfCasters.includes(className)) {
        if (charLevel >= 17) return 5;
        if (charLevel >= 13) return 4;
        if (charLevel >= 9) return 3;
        if (charLevel >= 5) return 2;
        if (charLevel >= 2) return 1;
        return 0;
    }
    return 0; // non-caster
}
