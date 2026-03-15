"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NPC {
    id: string;
    name: string;
    type: 'NPC' | 'Monster' | 'Boss';
    cr: string;
    hp: number;
    ac: number;
    faction?: string;
    location?: string;
}

const MOCK_NPCS: NPC[] = [
    { id: '1', name: 'Zorlak the Cruel', type: 'Boss', cr: '12', hp: 154, ac: 18, faction: 'The Iron Legion', location: 'Doom Peak' },
    { id: '2', name: 'Village Elder Elara', type: 'NPC', cr: '0', hp: 9, ac: 10, faction: 'Oakhaven', location: 'Town Square' },
    { id: '3', name: 'Goblin Scout', type: 'Monster', cr: '1/4', hp: 7, ac: 13, faction: 'Red Fang Tribe' },
    { id: '4', name: 'Mithral Knight', type: 'Monster', cr: '8', hp: 110, ac: 20, location: 'High Sanctuary' },
];

export default function NPCManager() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('All');

    const filteredNpcs = MOCK_NPCS.filter(npc => {
        const matchesSearch = npc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            npc.faction?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || npc.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-8 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tight">Bestiary & NPC Registry</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage every inhabitant and threat in your campaign world.</p>
                </div>
                <button className="bg-primary text-background-dark px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all primary-glow">
                    Create Entry
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
                    {['All', 'NPC', 'Monster', 'Boss'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-primary text-background-dark border-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredNpcs.map(npc => (
                        <motion.div
                            key={npc.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="obsidian-panel rounded-2xl p-6 border border-white/5 group hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10 group-hover:bg-primary/10 transition-all" />

                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter ${npc.type === 'Boss' ? 'bg-red-500/20 text-red-500' :
                                        npc.type === 'Monster' ? 'bg-emerald-500/20 text-emerald-500' :
                                            'bg-blue-500/20 text-blue-500'
                                    }`}>
                                    {npc.type} • CR {npc.cr}
                                </div>
                                <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors">more_vert</span>
                            </div>

                            <h3 className="text-xl font-black text-slate-100 mb-1 group-hover:text-primary transition-colors">{npc.name}</h3>
                            {npc.faction && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">group</span> {npc.faction}
                            </p>}

                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <p className="text-[8px] font-black text-slate-500 uppercase">Hit Points</p>
                                    <p className="text-lg font-black text-slate-200">{npc.hp}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <p className="text-[8px] font-black text-slate-500 uppercase">Armor Class</p>
                                    <p className="text-lg font-black text-slate-200">{npc.ac}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
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
