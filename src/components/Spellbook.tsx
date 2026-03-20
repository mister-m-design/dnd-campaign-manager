"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';
import spellsData from '@/data/spells.json';

interface Spell {
    id: string;
    name: string;
    level: number;
    school: string;
    time: string;
    range: string;
    components?: string;
    duration?: string;
    concentration?: boolean;
    ritual?: boolean;
    description: string;
    visualUrl?: string;
    webLink?: string;
    classes?: string[];
}

const SCHOOL_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    Abjuration:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  icon: 'shield' },
    Conjuration:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', icon: 'portal' },
    Divination:    { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)',  icon: 'visibility' },
    Enchantment:   { color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.25)', icon: 'psychology' },
    Evocation:     { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.25)',  icon: 'local_fire_department' },
    Illusion:      { color: '#e879f9', bg: 'rgba(232,121,249,0.1)', border: 'rgba(232,121,249,0.25)', icon: 'blur_on' },
    Necromancy:    { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  icon: 'skull' },
    Transmutation: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  icon: 'change_circle' },
};

const LEVEL_COLORS: Record<number, string> = {
    0: '#94a3b8',
    1: '#60a5fa',
    2: '#34d399',
    3: '#fbbf24',
    4: '#fb923c',
    5: '#f87171',
    6: '#c084fc',
    7: '#e879f9',
    8: '#f43f5e',
    9: '#ff6b6b',
};

function getSchoolConfig(school: string) {
    return SCHOOL_CONFIG[school] || { color: 'var(--primary)', bg: 'var(--primary-subtle)', border: 'var(--panel-border-accent)', icon: 'auto_awesome' };
}

export default function Spellbook() {
    const [activeLevel, setActiveLevel] = useState<number | 'All'>('All');
    const [activeSchool, setActiveSchool] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [slots, setSlots] = usePersistentState<{ [key: number]: { current: number; max: number } }>('mythic_spell_slots', {
        1: { current: 4, max: 4 },
        2: { current: 3, max: 3 },
        3: { current: 2, max: 2 },
        4: { current: 1, max: 1 },
        5: { current: 1, max: 1 },
    });

    const allSpells = spellsData as Spell[];

    // Available schools from the data
    const schools = useMemo(() => {
        const s = new Set(allSpells.map(sp => sp.school).filter(Boolean));
        return Array.from(s).sort();
    }, [allSpells]);

    const filteredSpells = useMemo(() => {
        return allSpells.filter(s => {
            const matchesLevel = activeLevel === 'All' || s.level === activeLevel;
            const matchesSchool = activeSchool === 'All' || s.school === activeSchool;
            const matchesSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.school?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesLevel && matchesSchool && matchesSearch;
        });
    }, [allSpells, activeLevel, activeSchool, searchTerm]);

    const useSlot = (level: number) => {
        if (slots[level]?.current > 0) {
            setSlots({ ...slots, [level]: { ...slots[level], current: slots[level].current - 1 } });
        }
    };

    const restoreSlot = (level: number) => {
        if (slots[level]?.current < slots[level]?.max) {
            setSlots({ ...slots, [level]: { ...slots[level], current: slots[level].current + 1 } });
        }
    };

    const spellsByLevel = useMemo(() => {
        const groups: Record<number, Spell[]> = {};
        filteredSpells.forEach(sp => {
            if (!groups[sp.level]) groups[sp.level] = [];
            groups[sp.level].push(sp);
        });
        return groups;
    }, [filteredSpells]);

    const levelKeys = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);

    return (
        <div className="flex flex-col h-full" style={{ color: 'var(--foreground)' }}>
            {/* Header */}
            <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                style={{ borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tighter" style={{ color: 'var(--foreground)' }}>
                        Spellbook
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                        {filteredSpells.length.toLocaleString()} spells
                    </p>
                </div>

                {/* Spell Slot Tracker */}
                <div className="flex items-center gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map(level => {
                        const slot = slots[level] || { current: 0, max: 0 };
                        const pct = slot.max > 0 ? slot.current / slot.max : 0;
                        const color = LEVEL_COLORS[level];
                        return (
                            <div
                                key={level}
                                className="flex flex-col items-center rounded-xl px-3 py-2 cursor-pointer group"
                                style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
                                onClick={() => useSlot(level)}
                                onContextMenu={e => { e.preventDefault(); restoreSlot(level); }}
                                title={`Click to use. Right-click to restore. Slot ${level}: ${slot.current}/${slot.max}`}
                            >
                                <span className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color }}>
                                    Lv {level}
                                </span>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: slot.max }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="size-2 rounded-full transition-all"
                                            style={{
                                                background: i < slot.current ? color : 'var(--bg-raised)',
                                                boxShadow: i < slot.current ? `0 0 6px ${color}80` : 'none',
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="text-[7px] font-bold mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                                    {slot.current}/{slot.max}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 md:px-6 py-3 space-y-2" style={{ borderBottom: '1px solid var(--panel-border)', background: 'var(--panel-bg)' }}>
                {/* Search */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--foreground-muted)' }}>search</span>
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search incantations..."
                        className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition-all"
                        style={{
                            background: 'var(--bg-raised)',
                            border: '1px solid var(--panel-border)',
                            color: 'var(--foreground)',
                        }}
                    />
                </div>

                {/* Level Filter */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    <button
                        onClick={() => setActiveLevel('All')}
                        className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex-shrink-0 transition-all border"
                        style={{
                            color: activeLevel === 'All' ? 'var(--primary)' : 'var(--foreground-muted)',
                            background: activeLevel === 'All' ? 'var(--primary-subtle)' : 'transparent',
                            borderColor: activeLevel === 'All' ? 'var(--panel-border-accent)' : 'var(--panel-border)',
                        }}
                    >
                        All Levels
                    </button>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => {
                        const color = LEVEL_COLORS[lvl];
                        const isActive = activeLevel === lvl;
                        return (
                            <button
                                key={lvl}
                                onClick={() => setActiveLevel(lvl)}
                                className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex-shrink-0 transition-all border"
                                style={{
                                    color: isActive ? color : 'var(--foreground-muted)',
                                    background: isActive ? `${color}18` : 'transparent',
                                    borderColor: isActive ? `${color}50` : 'var(--panel-border)',
                                }}
                            >
                                {lvl === 0 ? 'Cantrip' : `${lvl}°`}
                            </button>
                        );
                    })}
                </div>

                {/* School Filter */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    <button
                        onClick={() => setActiveSchool('All')}
                        className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex-shrink-0 transition-all border"
                        style={{
                            color: activeSchool === 'All' ? 'var(--primary)' : 'var(--foreground-muted)',
                            background: activeSchool === 'All' ? 'var(--primary-subtle)' : 'transparent',
                            borderColor: activeSchool === 'All' ? 'var(--panel-border-accent)' : 'var(--panel-border)',
                        }}
                    >
                        All Schools
                    </button>
                    {schools.map(school => {
                        const cfg = getSchoolConfig(school);
                        const isActive = activeSchool === school;
                        return (
                            <button
                                key={school}
                                onClick={() => setActiveSchool(school)}
                                className="flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex-shrink-0 transition-all border"
                                style={{
                                    color: isActive ? cfg.color : 'var(--foreground-muted)',
                                    background: isActive ? cfg.bg : 'transparent',
                                    borderColor: isActive ? cfg.border : 'var(--panel-border)',
                                }}
                            >
                                <span className="material-symbols-outlined text-[10px]">{cfg.icon}</span>
                                {school}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Spell List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
                {filteredSpells.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                        <span className="material-symbols-outlined text-[48px] mb-3" style={{ color: 'var(--foreground-muted)' }}>auto_awesome_off</span>
                        <p className="font-black uppercase text-lg" style={{ color: 'var(--foreground-muted)' }}>No spells found</p>
                    </div>
                ) : (
                    levelKeys.map(level => (
                        <div key={level}>
                            {/* Level Group Header */}
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                                    style={{
                                        color: LEVEL_COLORS[level],
                                        background: `${LEVEL_COLORS[level]}18`,
                                        border: `1px solid ${LEVEL_COLORS[level]}40`,
                                    }}
                                >
                                    {level === 0 ? 'Cantrips' : `Level ${level} · ${spellsByLevel[level].length} spells`}
                                </div>
                                <div className="flex-1 h-px" style={{ background: `${LEVEL_COLORS[level]}20` }} />

                                {/* Slot tracker for this level */}
                                {level > 0 && slots[level] && (
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: slots[level].max }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="size-1.5 rounded-full cursor-pointer transition-all"
                                                style={{
                                                    background: i < slots[level].current ? LEVEL_COLORS[level] : 'var(--panel-border)',
                                                    boxShadow: i < slots[level].current ? `0 0 4px ${LEVEL_COLORS[level]}` : 'none',
                                                }}
                                                onClick={() => i < slots[level].current ? useSlot(level) : restoreSlot(level)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Spell Cards for this level */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                                {spellsByLevel[level].map(spell => {
                                    const cfg = getSchoolConfig(spell.school);
                                    const isExpanded = expandedId === spell.id;
                                    return (
                                        <motion.div
                                            key={spell.id}
                                            layout
                                            className="rounded-xl overflow-hidden cursor-pointer group"
                                            style={{
                                                background: 'var(--panel-bg)',
                                                border: `1px solid ${isExpanded ? cfg.border : 'var(--panel-border)'}`,
                                            }}
                                            onClick={() => setExpandedId(isExpanded ? null : spell.id)}
                                            whileHover={{ borderColor: cfg.border }}
                                        >
                                            {/* Card Header */}
                                            <div className="flex items-center gap-2.5 p-3">
                                                {/* School color dot */}
                                                <div
                                                    className="size-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                                                >
                                                    <span className="material-symbols-outlined text-[14px]" style={{ color: cfg.color }}>{cfg.icon}</span>
                                                </div>

                                                <div className="flex-grow min-w-0">
                                                    <h3
                                                        className="font-black uppercase text-[11px] tracking-tight truncate group-hover:text-primary transition-colors"
                                                        style={{ color: 'var(--foreground)' }}
                                                    >
                                                        {spell.name}
                                                        {spell.concentration && (
                                                            <span className="ml-1 text-[7px] px-1 rounded" style={{ color: '#fb923c', background: 'rgba(251,146,60,0.1)' }}>C</span>
                                                        )}
                                                        {spell.ritual && (
                                                            <span className="ml-1 text-[7px] px-1 rounded" style={{ color: '#a78bfa', background: 'rgba(167,139,250,0.1)' }}>R</span>
                                                        )}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[7px] font-black uppercase" style={{ color: cfg.color }}>{spell.school}</span>
                                                        <span className="text-[7px] font-bold" style={{ color: 'var(--foreground-muted)' }}>·</span>
                                                        <span className="text-[7px] font-bold uppercase" style={{ color: 'var(--foreground-muted)' }}>{spell.time}</span>
                                                        <span className="text-[7px] font-bold" style={{ color: 'var(--foreground-muted)' }}>·</span>
                                                        <span className="text-[7px] font-bold uppercase" style={{ color: 'var(--foreground-muted)' }}>{spell.range}</span>
                                                    </div>
                                                </div>

                                                <span
                                                    className="material-symbols-outlined text-[14px] flex-shrink-0 transition-transform"
                                                    style={{
                                                        color: 'var(--foreground-muted)',
                                                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                                                    }}
                                                >
                                                    expand_more
                                                </span>
                                            </div>

                                            {/* Expanded Description */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-3 pb-3 pt-0 space-y-2" style={{ borderTop: `1px solid ${cfg.border}` }}>
                                                            {/* Stats Row */}
                                                            <div className="grid grid-cols-3 gap-1.5 pt-2">
                                                                {[
                                                                    { label: 'Cast', val: spell.time },
                                                                    { label: 'Range', val: spell.range },
                                                                    { label: 'Duration', val: spell.duration || '—' },
                                                                ].map(s => (
                                                                    <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: 'var(--bg-raised)' }}>
                                                                        <p className="text-[6px] font-black uppercase mb-0.5" style={{ color: 'var(--foreground-muted)' }}>{s.label}</p>
                                                                        <p className="text-[8px] font-black" style={{ color: 'var(--foreground)' }}>{s.val}</p>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {spell.components && (
                                                                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>
                                                                    Components: <span style={{ color: cfg.color }}>{spell.components}</span>
                                                                </p>
                                                            )}

                                                            <p className="text-[10px] leading-relaxed italic" style={{ color: 'var(--foreground-muted)' }}>
                                                                {spell.description}
                                                            </p>

                                                            {spell.classes && spell.classes.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 pt-1">
                                                                    {spell.classes.map(cls => (
                                                                        <span key={cls} className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                                                            {cls}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {spell.webLink && (
                                                                <a
                                                                    href={spell.webLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-colors hover:opacity-70"
                                                                    style={{ color: cfg.color }}
                                                                >
                                                                    Full Reference
                                                                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
