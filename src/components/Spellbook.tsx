"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';
import spellsData from '@/data/spells.json';

interface Spell {
    id: string;
    name: string;
    level: number;
    school: string;
    time: string;
    range: string;
    description: string;
    visualUrl?: string;
}

export default function Spellbook() {
    const [activeLevel, setActiveLevel] = useState<number | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [slots, setSlots] = usePersistentState<{ [key: number]: { current: number; max: number } }>('mythic_spell_slots', {
        1: { current: 4, max: 4 },
        2: { current: 3, max: 3 },
        3: { current: 2, max: 2 },
    });

    const filteredSpells = React.useMemo(() => {
        return (spellsData as Spell[]).filter(s => {
            const matchesLevel = activeLevel === 'All' || s.level === activeLevel;
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesLevel && matchesSearch;
        });
    }, [activeLevel, searchTerm]);

    const useSlot = (level: number) => {
        if (slots[level]?.current > 0) {
            setSlots({
                ...slots,
                [level]: { ...slots[level], current: slots[level].current - 1 }
            });
        }
    };

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-100 uppercase tracking-tighter">The Grimoire</h2>
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mt-1 italic">Vast archives of the mystical weave.</p>
                </div>
                <div className="flex gap-4">
                    {[1, 2, 3].map(level => (
                        <button
                            key={level}
                            onClick={() => useSlot(level)}
                            className="obsidian-panel rounded-xl px-4 py-2 border-t border-white/10 flex flex-col items-center hover:bg-primary/5 transition-all"
                        >
                            <p className="text-[7px] font-black text-slate-500 uppercase mb-1">LVL {level} Slots</p>
                            <div className="flex gap-1">
                                {Array.from({ length: slots[level].max }).map((_, i) => (
                                    <div key={i} className={`size-1.5 rounded-full ${i < slots[level].current ? 'bg-primary shadow-[0_0_8px_var(--primary-glow)]' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-grow">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:border-primary/50 focus:bg-white/[0.07] outline-none transition-all"
                        placeholder="Search for an incantation..."
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {['All', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => setActiveLevel(lvl as any)}
                            className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest whitespace-nowrap transition-all border ${activeLevel === lvl
                                ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20'
                                : 'bg-white/5 text-slate-400 border-white/5 hover:text-slate-200 hover:border-white/20'
                                }`}
                        >
                            {lvl === 'All' ? 'Master Archive' : lvl === 0 ? 'Cantrips' : `Lvl ${lvl}`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredSpells.map(spell => (
                        <motion.div
                            key={spell.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="obsidian-panel rounded-3xl p-6 border border-white/5 relative overflow-hidden group hover:border-primary/40 transition-all flex flex-col"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />

                            <div className="flex gap-6 mb-4">
                                <div className="size-20 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 relative overflow-hidden group">
                                    <ImageWithPlaceholder
                                        src={spell.visualUrl || ''}
                                        alt={spell.name}
                                        name={spell.name}
                                        fill
                                        sizes="80px"
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        fallbackIcon="auto_awesome"
                                    />
                                </div>
                                <div className="flex-grow pt-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight leading-tight">{spell.name}</h3>
                                        {(spell as any).webLink && (
                                            <a href={(spell as any).webLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mt-2 italic shadow-primary-glow">{spell.school}</p>
                                    <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-500 inline-block mt-2`}>
                                        {spell.level === 0 ? 'Cantrip' : `Level ${spell.level} Spell`}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase mb-4 py-2 border-y border-white/5">
                                <div className="text-slate-500">Casting: <span className="text-slate-200">{spell.time}</span></div>
                                <div className="text-slate-500">Range: <span className="text-slate-200">{spell.range}</span></div>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-relaxed italic flex-grow line-clamp-4 group-hover:line-clamp-none transition-all">{spell.description}</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
