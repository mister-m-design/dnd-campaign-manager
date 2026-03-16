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
}

const getMappedType = (npc: any): string => {
    if (npc.type === 'NPC' || npc.type === 'Monster' || npc.type === 'Boss' || npc.type === 'Beast') return npc.type;

    const type = npc.type?.toLowerCase() || '';
    const name = npc.name?.toLowerCase() || '';
    const cr = parseFloat(npc.cr) || 0;

    // Boss Logic
    if (
        name.includes('dragon') ||
        name.includes('beholder') ||
        name.includes('lich') ||
        name.includes('mind flayer') ||
        cr >= 10
    ) return 'Boss';

    // NPC Logic
    const npcTypes = ['humanoid', 'commoner', 'noble', 'guard', 'cultist'];
    if (npcTypes.some(t => type.includes(t)) && cr < 5) return 'NPC';

    // Beast Logic
    if (type.includes('beast') && cr < 5) return 'Beast';

    // Monster is the default for everything else
    return 'Monster';
};

export default function NPCManager() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('All');
    const [customNpcs, setCustomNpcs] = usePersistentState<NPC[]>('mythic_custom_npcs', []);

    const allNpcs = useMemo(() => [
        ...(monstersData as any[]).map(m => ({ ...m, type: getMappedType(m) })),
        ...customNpcs.map(c => ({ ...c, type: getMappedType(c) }))
    ] as NPC[], [customNpcs]);

    const filteredNpcs = useMemo(() => {
        return allNpcs.filter(npc => {
            const matchesSearch = npc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                npc.faction?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'All' || npc.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [allNpcs, searchTerm, filterType]);

    return (
        <div className="space-y-8 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tight">Bestiary & NPC Registry</h1>
                    <p className="text-slate-400 text-sm mt-1">Foundational library of entities and custom creatures.</p>
                </div>
                <button className="bg-primary text-black px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 border-t border-white/20">
                    Forge New Entity
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                    <input
                        type="text"
                        placeholder="Search by name, faction, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-slate-100 focus:border-primary/50 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {['All', 'NPC', 'Monster', 'Beast', 'Boss'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-6 py-2.5 rounded-xl border font-black uppercase text-[10px] tracking-widest transition-all ${filterType === type
                                ? 'bg-primary text-black border-primary shadow-lg shadow-primary/10'
                                : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div key={filterType} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNpcs.map((npc, index) => (
                    <div
                        key={npc.id}
                        className="obsidian-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-primary/40 transition-all"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
                        <div className="flex gap-6">
                            <div className="size-24 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 relative overflow-hidden">
                                <ImageWithPlaceholder
                                    src={npc.visualUrl}
                                    alt={npc.name}
                                    fill
                                    sizes="96px"
                                    priority={index < 3}
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    fallbackIcon={npc.type === 'Boss' ? 'crown' : npc.type === 'Beast' ? 'pets' : 'person'}
                                />
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">{npc.name}</h3>
                                        <div className="flex gap-2 items-center">
                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded shadow-sm ${npc.type === 'Boss' ? 'bg-red-500 text-white shadow-red-500/20' :
                                                npc.type === 'Monster' ? 'bg-amber-500 text-white shadow-amber-500/20' :
                                                    npc.type === 'Beast' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                                        'bg-primary text-black shadow-primary/20'
                                                }`}>
                                                {npc.type}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">CR {npc.cr}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <div className="flex gap-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">HP {npc.hp}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">AC {npc.ac}</p>
                                        </div>
                                        {(npc as any).webLink && (
                                            <a
                                                href={(npc as any).webLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-[8px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors"
                                            >
                                                Full Lore <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed italic line-clamp-3 group-hover:line-clamp-none transition-all">{npc.description || 'A mysterious resident of the realm.'}</p>
                            </div>
                        </div>

                        {npc.stats && (
                            <div className="grid grid-cols-6 gap-2 mt-4 pt-4 border-t border-white/5">
                                {Object.entries(npc.stats).map(([s, v]: [string, any]) => (
                                    <div key={s} className="text-center">
                                        <p className="text-[6px] font-black text-slate-600 uppercase mb-0.5">{s}</p>
                                        <p className="text-xs font-black text-slate-200">{v}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {npc.actions && npc.actions.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-primary text-[10px]">swords</span>
                                    <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Notable Actions</h4>
                                </div>
                                {npc.actions.slice(0, 2).map((action: string, i: number) => (
                                    <div key={i} className="bg-white/5 p-2 rounded-lg text-[9px] text-slate-300 border border-white/5 line-clamp-2">
                                        <span className="font-black text-primary uppercase mr-2">{action.split(':')[0]}:</span>
                                        {action.split(':').slice(1).join(':')}
                                    </div>
                                ))}
                                {npc.actions.length > 2 && (
                                    <p className="text-[8px] text-center text-slate-600 font-bold uppercase mt-1">+ {npc.actions.length - 2} more actions in full lore</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredNpcs.length === 0 && (
                <div className="text-center py-20">
                    <span className="material-symbols-outlined text-5xl text-slate-700 mb-4 block">sentiment_dissatisfied</span>
                    <h3 className="text-xl font-black text-slate-300 uppercase tracking-tight">No entities found</h3>
                    <p className="text-slate-500 text-sm">Maybe they are hidden in the shadows?</p>
                </div>
            )}
        </div>
    );
}
