"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Spell {
    id: string;
    name: string;
    level: number;
    school: string;
    castingTime: string;
    range: string;
    description: string;
}

const MOCK_SPELLS: Spell[] = [
    { id: '1', name: 'Fireball', level: 3, school: 'Evocation', castingTime: '1 Action', range: '150 feet', description: 'A bright streak flashes from your pointing finger to a point you choose...' },
    { id: '2', name: 'Shield', level: 1, school: 'Abjuration', castingTime: '1 Reaction', range: 'Self', description: 'An invisible barrier of magical force appears and protects you...' },
    { id: '3', name: 'Misty Step', level: 2, school: 'Conjuration', castingTime: '1 Bonus Action', range: 'Self', description: 'Briefly surrounded by silvery mist, you teleport up to 30 feet...' },
    { id: '4', name: 'Cure Wounds', level: 1, school: 'Evocation', castingTime: '1 Action', range: 'Touch', description: 'A creature you touch regains a number of hit points...' },
];

export default function Spellbook() {
    const [activeLevel, setActiveLevel] = useState<number | 'All'>('All');
    const [slots, setSlots] = useState<{ [key: number]: { current: number; max: number } }>({
        1: { current: 4, max: 4 },
        2: { current: 3, max: 3 },
        3: { current: 2, max: 2 },
    });

    const filteredSpells = MOCK_SPELLS.filter(s => activeLevel === 'All' || s.level === activeLevel);

    const useSlot = (level: number) => {
        if (slots[level]?.current > 0) {
            setSlots({
                ...slots,
                [level]: { ...slots[level], current: slots[level].current - 1 }
            });
        }
    };

    return (
        <div className="space-y-8 p-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tight">Grimoire</h2>
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mt-1">Prepared Spells & Mystic Power</p>
                </div>
                <div className="flex gap-4">
                    {[1, 2, 3].map(level => (
                        <div key={level} className="obsidian-panel rounded-xl px-4 py-2 border-t border-white/10 flex flex-col items-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
                                L{level} Slots
                            </p>
                            <div className="flex gap-1">
                                {Array.from({ length: slots[level].max }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => useSlot(level)}
                                        className={`size-2.5 rounded-full border transition-all ${i < slots[level].current ? 'bg-primary border-primary' : 'bg-transparent border-slate-700'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {['All', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
                    <button
                        key={lvl}
                        onClick={() => setActiveLevel(lvl as any)}
                        className={`px-4 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 ${activeLevel === lvl ? 'bg-primary text-background-dark border-primary' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                            }`}
                    >
                        {lvl === 'All' ? 'All' : lvl === 0 ? 'Cantrips' : `Lvl ${lvl}`}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredSpells.map(spell => (
                        <motion.div
                            key={spell.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="obsidian-panel rounded-2xl p-6 border border-white/5 group hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-100 group-hover:text-primary transition-colors">{spell.name}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{spell.school} • {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}</p>
                                </div>
                                <button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all">CAST</button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-500 font-bold uppercase">Casting Time</span>
                                    <span className="text-xs font-black text-slate-300">{spell.castingTime}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-500 font-bold uppercase">Range</span>
                                    <span className="text-xs font-black text-slate-300">{spell.range}</span>
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 italic">"{spell.description}"</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
