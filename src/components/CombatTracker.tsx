"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Combatant {
    id: string;
    name: string;
    initiative: number;
    hp: number;
    maxHp: number;
    ac: number;
    conditions: string[];
    type: 'player' | 'enemy';
}

export default function CombatTracker() {
    const [combatants, setCombatants] = useState<Combatant[]>([
        { id: '1', name: 'Valerius', initiative: 18, hp: 45, maxHp: 45, ac: 18, conditions: [], type: 'player' },
        { id: '2', name: 'Goblin Scout A', initiative: 22, hp: 7, maxHp: 7, ac: 13, conditions: [], type: 'enemy' },
        { id: '3', name: 'Grog', initiative: 12, hp: 58, maxHp: 58, ac: 14, conditions: ['Frightened'], type: 'player' },
        { id: '4', name: 'Goblin Scout B', initiative: 9, hp: 7, maxHp: 7, ac: 13, conditions: [], type: 'enemy' },
    ].sort((a, b) => b.initiative - a.initiative));

    const [turnIndex, setTurnIndex] = useState(0);

    const nextTurn = () => {
        setTurnIndex((turnIndex + 1) % combatants.length);
    };

    const updateHp = (id: string, amount: number) => {
        setCombatants(combatants.map(c =>
            c.id === id ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + amount)) } : c
        ));
    };

    return (
        <div className="space-y-8 p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tight">Combat Tracker</h2>
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Encounter: Ambush at the Crossroads</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white/5 hover:bg-white/10 text-slate-400 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all">Add Combatant</button>
                    <button onClick={nextTurn} className="bg-primary text-background-dark px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all primary-glow">Next Turn</button>
                </div>
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {combatants.map((c, index) => (
                        <motion.div
                            key={c.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{
                                opacity: 1,
                                x: 0,
                                scale: turnIndex === index ? 1.02 : 1,
                                borderColor: turnIndex === index ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255, 255, 255, 0.05)'
                            }}
                            className={`obsidian-panel rounded-xl p-4 border flex items-center justify-between transition-all ${turnIndex === index ? 'bg-primary/10 shadow-[0_0_30px_rgba(251,191,36,0.1)]' : 'bg-slate-900/40'
                                }`}
                        >
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-white/5 border border-white/10">
                                    <p className="text-[10px] font-black text-slate-500 uppercase leading-none mb-1">Init</p>
                                    <p className="text-xl font-black text-slate-100 leading-none">{c.initiative}</p>
                                </div>

                                <div>
                                    <h4 className={`text-lg font-black uppercase tracking-tight ${c.type === 'enemy' ? 'text-red-400' : 'text-slate-100'}`}>
                                        {c.name}
                                        {turnIndex === index && <span className="ml-3 text-[8px] bg-primary text-background-dark px-1.5 py-0.5 rounded align-middle">CURRENT TURN</span>}
                                    </h4>
                                    <div className="flex gap-2 mt-1">
                                        {c.conditions.map(cond => (
                                            <span key={cond} className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-black uppercase">{cond}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Armor</p>
                                    <div className="size-8 rounded-full border-2 border-slate-700 flex items-center justify-center">
                                        <span className="text-sm font-black text-slate-300">{c.ac}</span>
                                    </div>
                                </div>

                                <div className="w-48">
                                    <div className="flex justify-between items-end mb-1">
                                        <p className="text-[8px] font-black text-slate-500 uppercase font-mono">Health Points</p>
                                        <p className="text-xs font-black text-slate-200">{c.hp} / {c.maxHp}</p>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                                            className={`h-full transition-all ${c.hp / c.maxHp < 0.3 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    <button onClick={() => updateHp(c.id, -5)} className="size-8 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black border border-red-500/20 transition-all">-5</button>
                                    <button onClick={() => updateHp(c.id, 5)} className="size-8 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-black border border-emerald-500/20 transition-all">+5</button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
