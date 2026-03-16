"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';
import Link from 'next/link';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Encounter {
    id: string;
    name: string;
    campaignId: string | null;
    combatants: any[];
    round: number;
    turnIndex: number;
    log: any[];
    lastUpdated: string;
}

export default function CombatLibrary() {
    const [savedEncounters, setSavedEncounters] = usePersistentState<Encounter[]>('mythic_saved_encounters', []);
    const [campaigns] = usePersistentState<any[]>('mythic_campaigns', []);
    const [filterCampaign, setFilterCampaign] = useState<string>('all');

    const filteredEncounters = savedEncounters.filter(e =>
        filterCampaign === 'all' || e.campaignId === filterCampaign
    ).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const deleteEncounter = () => {
        if (deleteTargetId) {
            setSavedEncounters(prev => prev.filter(e => e.id !== deleteTargetId));
            setDeleteTargetId(null);
        }
    };

    const getCampaignName = (id: string | null) => {
        if (!id) return "None";
        return campaigns.find(c => c.id === id)?.name || "Unknown";
    };

    return (
        <main className="p-8 max-w-6xl mx-auto space-y-12 min-h-screen">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-100 uppercase tracking-tighter">Combat Library</h1>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">history_edu</span>
                        Stored Encounters & Battle States
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Filter Campaign</label>
                        <select
                            value={filterCampaign}
                            onChange={(e) => setFilterCampaign(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-black text-slate-300 outline-none focus:border-primary/50 transition-all min-w-[200px]"
                        >
                            <option value="all">All Campaigns</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredEncounters.map((encounter) => (
                        <motion.div
                            key={encounter.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="obsidian-panel rounded-3xl p-6 border border-white/5 group hover:border-primary/20 transition-all flex flex-col h-full relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setDeleteTargetId(encounter.id)}
                                    className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 transition-all hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-2xl font-black">swords</span>
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-lg font-black text-slate-100 uppercase tracking-tight line-clamp-1">{encounter.name}</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{getCampaignName(encounter.campaignId)}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 flex-grow">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <p className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1">Combatants</p>
                                        <p className="text-sm font-black text-slate-200">{encounter.combatants?.length || 0}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <p className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1">State</p>
                                        <p className="text-sm font-black text-slate-200">Round {encounter.round}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {encounter.combatants?.slice(0, 4).map((c: any, i: number) => (
                                            <div key={i} className="size-6 rounded-full border-2 border-background-dark bg-slate-800 overflow-hidden relative">
                                                {c.imageUrl && <div className="w-full h-full bg-slate-700"><span className="text-[6px] text-slate-400">{c.name?.[0]}</span></div>}
                                            </div>
                                        ))}
                                        {(encounter.combatants?.length || 0) > 4 && (
                                            <div className="size-6 rounded-full border-2 border-background-dark bg-slate-900 flex items-center justify-center text-[8px] font-black text-slate-500">
                                                +{(encounter.combatants?.length || 0) - 4}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
                                        Last Active: {new Date(encounter.lastUpdated).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <Link
                                href={`/combat?encounterId=${encounter.id}`}
                                className="mt-auto bg-white/5 border border-white/10 text-slate-100 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest text-center hover:bg-primary hover:text-black hover:border-primary transition-all active:scale-95"
                            >
                                Restore Battle State
                            </Link>
                        </motion.div>
                    ))}

                    {filteredEncounters.length === 0 && (
                        <div className="col-span-full py-24 text-center">
                            <div className="size-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-3xl text-slate-700">inventory_2</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-200 uppercase tracking-tight">No Saved Encounters</h3>
                            <p className="text-slate-600 mt-2 max-w-sm mx-auto text-sm">Encounters saved from the Combat tracker will appear here for quick restoration.</p>
                            <Link href="/combat" className="inline-flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest mt-6 hover:underline">
                                Go to Combat Tracker <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>
                    )}
                </AnimatePresence>
            </div>
            <ConfirmModal
                isOpen={!!deleteTargetId}
                onClose={() => setDeleteTargetId(null)}
                onConfirm={deleteEncounter}
                title="Delete Encounter"
                message="Are you sure you want to delete this saved encounter? This cannot be undone."
                confirmLabel="Delete Encounter"
                icon="delete"
            />
        </main>
    );
}
