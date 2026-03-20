"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';
import monstersData from '@/data/monsters.json';

interface NPC {
    id: string;
    name: string;
    type: string;
    cr: string;
    hp: number;
    ac: number;
    faction?: string;
    location?: string;
    description?: string;
    visualUrl?: string;
    stats: { [key: string]: number };
    actions?: string[];
    speed?: number;
    alignment?: string;
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
    All:     { color: 'var(--foreground)',       bg: 'var(--panel-bg)',    border: 'var(--panel-border)',       icon: 'list',         label: 'All' },
    NPC:     { color: '#34d399',                  bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)',     icon: 'person',       label: 'NPC' },
    Monster: { color: '#fb923c',                  bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.25)',     icon: 'bug_report',   label: 'Monster' },
    Beast:   { color: '#a3e635',                  bg: 'rgba(163,230,53,0.08)', border: 'rgba(163,230,53,0.25)',     icon: 'pets',         label: 'Beast' },
    Boss:    { color: '#f87171',                  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)',    icon: 'crown',        label: 'Boss' },
};

const CR_CONFIG: Record<string, { label: string; color: string }> = {
    all:    { label: 'Any CR', color: 'var(--foreground-muted)' },
    easy:   { label: '≤ 1',    color: '#4ade80' },
    medium: { label: '2–5',    color: '#fbbf24' },
    hard:   { label: '6–10',   color: '#fb923c' },
    deadly: { label: '11+',    color: '#f87171' },
};

function parseCR(cr: string): number {
    if (cr === '1/8') return 0.125;
    if (cr === '1/4') return 0.25;
    if (cr === '1/2') return 0.5;
    return parseFloat(cr) || 0;
}

function getCRTier(cr: string) {
    const n = parseCR(cr);
    if (n <= 1) return 'easy';
    if (n <= 5) return 'medium';
    if (n <= 10) return 'hard';
    return 'deadly';
}

function getCRColor(cr: string) {
    const tier = getCRTier(cr);
    return CR_CONFIG[tier].color;
}

const getMappedType = (npc: any): string => {
    if (['NPC', 'Monster', 'Boss', 'Beast'].includes(npc.type)) return npc.type;
    const type = npc.type?.toLowerCase() || '';
    const name = npc.name?.toLowerCase() || '';
    const cr = parseCR(npc.cr) || 0;
    if (name.includes('dragon') || name.includes('beholder') || name.includes('lich') || name.includes('mind flayer') || cr >= 10) return 'Boss';
    if (['humanoid', 'commoner', 'noble', 'guard', 'cultist'].some(t => type.includes(t)) && cr < 5) return 'NPC';
    if (type.includes('beast') && cr < 5) return 'Beast';
    return 'Monster';
};

interface CreatureDetailProps {
    npc: NPC;
    onClose: () => void;
}

function CreatureDetail({ npc, onClose }: CreatureDetailProps) {
    const cfg = TYPE_CONFIG[npc.type] || TYPE_CONFIG.Monster;
    const mod = (v: number) => { const m = Math.floor((v - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 20 }}
                className="max-w-lg w-full rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
                style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-4 p-4" style={{ borderBottom: '1px solid var(--panel-border)' }}>
                    <div className="size-14 rounded-xl overflow-hidden relative flex-shrink-0"
                        style={{ border: `1px solid ${cfg.border}` }}>
                        <ImageWithPlaceholder
                            src={npc.visualUrl}
                            alt={npc.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                            fallbackIcon={npc.type === 'Boss' ? 'crown' : npc.type === 'Beast' ? 'pets' : 'bug_report'}
                        />
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-lg font-black uppercase tracking-tight" style={{ color: 'var(--foreground)' }}>{npc.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>{npc.type}</span>
                            <span className="text-[9px] font-black uppercase" style={{ color: getCRColor(npc.cr) }}>CR {npc.cr}</span>
                            <span className="text-[8px] font-bold uppercase" style={{ color: 'var(--foreground-muted)' }}>HP {npc.hp} · AC {npc.ac}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="size-8 flex items-center justify-center rounded-lg hover:opacity-70" style={{ color: 'var(--foreground-muted)' }}>
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <div className="overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {/* Description */}
                    {npc.description && (
                        <p className="text-[11px] italic leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{npc.description}</p>
                    )}

                    {/* Ability Scores */}
                    {npc.stats && (
                        <div>
                            <h4 className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--foreground-muted)' }}>Ability Scores</h4>
                            <div className="grid grid-cols-6 gap-1.5">
                                {Object.entries(npc.stats).map(([s, v]: [string, any]) => (
                                    <div key={s} className="rounded-lg py-2 text-center" style={{ background: 'var(--bg-raised)', border: '1px solid var(--panel-border)' }}>
                                        <p className="text-[7px] font-black uppercase mb-0.5" style={{ color: 'var(--foreground-muted)' }}>{s}</p>
                                        <p className="text-sm font-black leading-none" style={{ color: 'var(--primary)' }}>{mod(v)}</p>
                                        <p className="text-[8px] font-bold" style={{ color: 'var(--foreground-muted)' }}>{v}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {npc.actions && npc.actions.length > 0 && (
                        <div>
                            <h4 className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--foreground-muted)' }}>Actions</h4>
                            <div className="space-y-2">
                                {npc.actions.map((action: string, i: number) => {
                                    const [actionName, ...rest] = action.split(':');
                                    return (
                                        <div key={i} className="rounded-xl p-3" style={{ background: 'var(--bg-raised)', border: '1px solid var(--panel-border)' }}>
                                            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--primary)' }}>{actionName}</p>
                                            {rest.length > 0 && (
                                                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{rest.join(':').trim()}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function NPCManager() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('All');
    const [filterCR, setFilterCR] = useState<string>('all');
    const [customNpcs, setCustomNpcs] = usePersistentState<NPC[]>('mythic_custom_npcs', []);
    const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null);

    const allNpcs = useMemo(() => [
        ...(monstersData as any[]).map(m => ({ ...m, type: getMappedType(m) })),
        ...customNpcs.map(c => ({ ...c, type: getMappedType(c) }))
    ] as NPC[], [customNpcs]);

    const filteredNpcs = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return allNpcs.filter(npc => {
            const matchesSearch = !query ||
                npc.name.toLowerCase().includes(query) ||
                npc.type.toLowerCase().includes(query) ||
                npc.cr.toString().includes(query) ||
                (npc.faction?.toLowerCase() || '').includes(query) ||
                (npc.description?.toLowerCase() || '').includes(query);

            const matchesType = filterType === 'All' || npc.type === filterType;
            const matchesCR = filterCR === 'all' || getCRTier(npc.cr) === filterCR;

            return matchesSearch && matchesType && matchesCR;
        });
    }, [allNpcs, searchTerm, filterType, filterCR]);

    // Counts per type
    const typeCounts = useMemo(() => {
        const counts: Record<string, number> = { All: allNpcs.length };
        allNpcs.forEach(n => { counts[n.type] = (counts[n.type] || 0) + 1; });
        return counts;
    }, [allNpcs]);

    return (
        <div className="flex flex-col h-full" style={{ color: 'var(--foreground)' }}>
            {/* Page Header */}
            <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                style={{ borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tighter" style={{ color: 'var(--foreground)' }}>
                        Bestiary
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                        {filteredNpcs.length.toLocaleString()} creatures
                        {searchTerm ? ` matching "${searchTerm}"` : ''}
                    </p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-black transition-all hover:opacity-90"
                    style={{ background: 'var(--primary)' }}
                >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    Forge Entity
                </button>
            </div>

            {/* Filters Bar */}
            <div className="px-4 md:px-6 py-3 space-y-2" style={{ borderBottom: '1px solid var(--panel-border)', background: 'var(--panel-bg)' }}>
                {/* Search */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--foreground-muted)' }}>search</span>
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition-all"
                        placeholder="Search monsters, beasts, NPCs..."
                        style={{
                            background: 'var(--bg-raised)',
                            border: '1px solid var(--panel-border)',
                            color: 'var(--foreground)',
                        }}
                    />
                </div>

                {/* Type Filters */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                        const isActive = filterType === type;
                        const count = typeCounts[type] || 0;
                        return (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 border"
                                style={{
                                    color: isActive ? cfg.color : 'var(--foreground-muted)',
                                    background: isActive ? cfg.bg : 'transparent',
                                    borderColor: isActive ? cfg.border : 'var(--panel-border)',
                                }}
                            >
                                <span className="material-symbols-outlined text-[12px]">{cfg.icon}</span>
                                {type}
                                <span className="opacity-60 text-[7px]">{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* CR Filters */}
                <div className="flex gap-1.5">
                    {Object.entries(CR_CONFIG).map(([key, cfg]) => {
                        const isActive = filterCR === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setFilterCR(key)}
                                className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border"
                                style={{
                                    color: isActive ? cfg.color : 'var(--foreground-muted)',
                                    background: isActive ? `${cfg.color}15` : 'transparent',
                                    borderColor: isActive ? `${cfg.color}40` : 'var(--panel-border)',
                                }}
                            >
                                {cfg.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Creature Grid */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {filteredNpcs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                        <span className="material-symbols-outlined text-[48px] mb-3" style={{ color: 'var(--foreground-muted)' }}>search_off</span>
                        <p className="font-black uppercase text-lg" style={{ color: 'var(--foreground-muted)' }}>No creatures found</p>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--foreground-muted)' }}>Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        <AnimatePresence>
                            {filteredNpcs.map((npc, idx) => {
                                const cfg = TYPE_CONFIG[npc.type] || TYPE_CONFIG.Monster;
                                const crColor = getCRColor(npc.cr);

                                return (
                                    <motion.div
                                        key={npc.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.96 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                        transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                                        onClick={() => setSelectedNpc(npc)}
                                        className="rounded-xl cursor-pointer group transition-all"
                                        style={{
                                            background: 'var(--panel-bg)',
                                            border: '1px solid var(--panel-border)',
                                        }}
                                        whileHover={{
                                            scale: 1.01,
                                            borderColor: cfg.border,
                                        }}
                                    >
                                        <div className="flex items-center gap-3 p-3">
                                            {/* Portrait */}
                                            <div
                                                className="size-12 rounded-xl overflow-hidden relative flex-shrink-0"
                                                style={{ border: `1px solid ${cfg.border}` }}
                                            >
                                                <ImageWithPlaceholder
                                                    src={npc.visualUrl}
                                                    alt={npc.name}
                                                    fill
                                                    sizes="48px"
                                                    className="object-cover"
                                                    fallbackIcon={npc.type === 'Boss' ? 'crown' : npc.type === 'Beast' ? 'pets' : 'bug_report'}
                                                />
                                                {/* Type color stripe */}
                                                <div
                                                    className="absolute bottom-0 left-0 right-0 h-0.5"
                                                    style={{ background: cfg.color }}
                                                />
                                            </div>

                                            {/* Identity */}
                                            <div className="flex-grow min-w-0">
                                                <h3
                                                    className="font-black uppercase text-[11px] tracking-tight leading-tight truncate group-hover:text-primary transition-colors"
                                                    style={{ color: 'var(--foreground)' }}
                                                >
                                                    {npc.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span
                                                        className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full"
                                                        style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                                                    >
                                                        {npc.type}
                                                    </span>
                                                    <span
                                                        className="text-[8px] font-black uppercase"
                                                        style={{ color: crColor }}
                                                    >
                                                        CR {npc.cr}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Stats column */}
                                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                                <div className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[9px]" style={{ color: '#f87171' }}>favorite</span>
                                                    <span className="text-[9px] font-black" style={{ color: 'var(--foreground)' }}>{npc.hp}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[9px]" style={{ color: '#60a5fa' }}>shield</span>
                                                    <span className="text-[9px] font-black" style={{ color: 'var(--foreground)' }}>{npc.ac}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stat bar for important abilities */}
                                        {npc.stats && (
                                            <div
                                                className="mx-3 mb-3 rounded-lg grid grid-cols-6 gap-0"
                                                style={{ background: 'var(--bg-raised)' }}
                                            >
                                                {Object.entries(npc.stats).map(([s, v]: [string, any]) => {
                                                    const m = Math.floor((v - 10) / 2);
                                                    return (
                                                        <div key={s} className="text-center py-1">
                                                            <p className="text-[6px] font-black uppercase" style={{ color: 'var(--foreground-muted)' }}>{s}</p>
                                                            <p className="text-[9px] font-black leading-none" style={{ color: 'var(--foreground)' }}>{m >= 0 ? `+${m}` : m}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Creature Detail Modal */}
            <AnimatePresence>
                {selectedNpc && (
                    <CreatureDetail npc={selectedNpc} onClose={() => setSelectedNpc(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
