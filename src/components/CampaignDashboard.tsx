"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';
import Image from 'next/image';
import Link from 'next/link';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface CampaignLog {
    id: string;
    date: string;
    title: string;
    content: string;
}

interface Campaign {
    id: string;
    name: string;
    dm: string;
    setting: string;
    level: number;
    partyIds: string[];
    status: string;
    nextSession?: string;
    logs: CampaignLog[];
}

export default function CampaignDashboard() {
    const [campaigns, setCampaigns] = usePersistentState<Campaign[]>('mythic_campaigns', []);
    const [savedCharacters] = usePersistentState<any[]>('mythic_saved_characters', []);
    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

    // Auto-select first campaign if none selected
    React.useEffect(() => {
        if (!activeCampaignId && campaigns.length > 0) {
            setActiveCampaignId(campaigns[0].id);
        }
    }, [campaigns, activeCampaignId]);

    const [isCreating, setIsCreating] = useState(false);
    const [isEditingCampaign, setIsEditingCampaign] = useState(false);
    const [isRecruiting, setIsRecruiting] = useState(false);
    const [isLogging, setIsLogging] = useState(false);

    const [newCampaign, setNewCampaign] = useState({
        name: '',
        dm: 'Michael Murtha',
        setting: '',
        level: 1
    });

    const [editCampaignData, setEditCampaignData] = useState({
        name: '',
        dm: '',
        setting: '',
        level: 1
    });

    const [newLog, setNewLog] = useState({
        title: '',
        content: ''
    });

    const currentCampaign = useMemo(() =>
        campaigns.find(c => c.id === activeCampaignId) || campaigns[0]
        , [campaigns, activeCampaignId]);

    const handleEditStart = () => {
        if (!currentCampaign) return;
        setEditCampaignData({
            name: currentCampaign.name,
            dm: currentCampaign.dm,
            setting: currentCampaign.setting,
            level: currentCampaign.level
        });
        setIsEditingCampaign(true);
    };

    const handleUpdateCampaign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCampaign || !editCampaignData.name) return;

        setCampaigns(prev => prev.map(c => {
            if (c.id === currentCampaign.id) {
                return {
                    ...c,
                    ...editCampaignData
                };
            }
            return c;
        }));
        setIsEditingCampaign(false);
    };

    const activeParty = useMemo(() => {
        if (!currentCampaign) return [];
        return savedCharacters.filter(char => currentCampaign.partyIds?.includes(char.id));
    }, [savedCharacters, currentCampaign]);

    const availableHeroes = useMemo(() => {
        if (!currentCampaign) return [];
        return savedCharacters.filter(char => !currentCampaign.partyIds?.includes(char.id) && !char.retired);
    }, [savedCharacters, currentCampaign]);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCampaign.name) return;

        const campaign: Campaign = {
            ...newCampaign,
            id: crypto.randomUUID(),
            partyIds: [],
            status: "Starting",
            nextSession: new Date().toISOString(),
            logs: []
        };

        setCampaigns(prev => [...prev, campaign]);
        setActiveCampaignId(campaign.id);
        setIsCreating(false);
    };

    const toggleHeroRecruitment = (heroId: string) => {
        if (!currentCampaign) return;

        setCampaigns(prev => prev.map(c => {
            if (c.id === currentCampaign.id) {
                const partyIds = c.partyIds || [];
                const isRecruited = partyIds.includes(heroId);
                return {
                    ...c,
                    partyIds: isRecruited
                        ? partyIds.filter(id => id !== heroId)
                        : [...partyIds, heroId]
                };
            }
            return c;
        }));
    };

    const handleAddLog = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCampaign || !newLog.title) return;

        const logEntry: CampaignLog = {
            id: crypto.randomUUID(),
            date: new Date().toLocaleDateString(),
            title: newLog.title,
            content: newLog.content
        };

        setCampaigns(prev => prev.map(c => {
            if (c.id === currentCampaign.id) {
                return {
                    ...c,
                    logs: [logEntry, ...(c.logs || [])]
                };
            }
            return c;
        }));

        setNewLog({ title: '', content: '' });
        setIsLogging(false);
    };

    const [deleteLogTargetId, setDeleteLogTargetId] = useState<string | null>(null);

    const deleteLog = () => {
        if (!currentCampaign || !deleteLogTargetId) return;

        setCampaigns(prev => prev.map(c => {
            if (c.id === currentCampaign.id) {
                return {
                    ...c,
                    logs: c.logs.filter(l => l.id !== deleteLogTargetId)
                };
            }
            return c;
        }));
        setDeleteLogTargetId(null);
    };

    if (isCreating) {
        return (
            <div className="max-w-2xl mx-auto p-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-12">
                    <button onClick={() => setIsCreating(false)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">Establish Campaign</h1>
                        <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">Foundation for a new legend</p>
                    </div>
                </motion.div>

                <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate} className="obsidian-panel rounded-3xl p-10 border border-white/5 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Campaign Name</label>
                        <input type="text" required value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all placeholder:text-slate-700" placeholder="e.g. Shadows of Ravenloft" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">World Setting</label>
                        <input type="text" value={newCampaign.setting} onChange={(e) => setNewCampaign({ ...newCampaign, setting: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all placeholder:text-slate-700" placeholder="e.g. Forgotten Realms, Homebrew" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Dungeon Master</label>
                            <input type="text" value={newCampaign.dm} onChange={(e) => setNewCampaign({ ...newCampaign, dm: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Starting Level</label>
                            <input type="number" min="1" max="20" value={newCampaign.level} onChange={(e) => setNewCampaign({ ...newCampaign, level: parseInt(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                        </div>
                    </div>
                    <div className="pt-6">
                        <button type="submit" className="w-full bg-primary text-black py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all primary-glow">Commence Adventure</button>
                    </div>
                </motion.form>
            </div>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full animate-pulse" />
                    <div className="size-28 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center relative backdrop-blur-xl">
                        <span className="material-symbols-outlined text-6xl text-slate-700">fort</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-100 uppercase tracking-tighter">No Active Campaigns</h2>
                    <p className="text-slate-500 max-w-md mx-auto font-medium">Every legend begins somewhere. Create your first campaign to start orchestrating your world.</p>
                </div>
                <button onClick={() => setIsCreating(true)} className="bg-primary text-black px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:scale-105 active:scale-95 transition-all primary-glow border-t border-white/20">Begin New Adventure</button>
            </div>
        );
    }

    if (!currentCampaign) return null;

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header section with Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-100 uppercase tracking-tighter">{currentCampaign.name}</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">history_edu</span>
                                DM: {currentCampaign.dm}
                            </p>
                            <span className="text-slate-700">|</span>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{currentCampaign.setting}</p>
                        </div>
                    </div>
                    {campaigns.length > 1 && (
                        <select
                            value={activeCampaignId || ''}
                            onChange={(e) => setActiveCampaignId(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 outline-none focus:border-primary/50"
                        >
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                    <button onClick={() => setIsCreating(true)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-primary transition-all">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
                <div className="flex gap-4">
                    <div className="obsidian-panel rounded-2xl px-6 py-3 text-center border-t border-white/10 min-w-[100px]">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Party Level</p>
                        <p className="text-2xl font-black text-slate-200">{currentCampaign.level}</p>
                    </div>
                    <div className="obsidian-panel rounded-2xl px-6 py-3 text-center border-t border-white/10 min-w-[100px]">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Members</p>
                        <p className="text-2xl font-black text-slate-200">{currentCampaign.partyIds?.length || 0}</p>
                    </div>
                    <button
                        onClick={handleEditStart}
                        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-center min-w-[100px] hover:bg-white/10 transition-all group"
                    >
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-primary">Edit Details</p>
                        <p className="text-2xl font-black text-slate-200 group-hover:text-white"><span className="material-symbols-outlined text-sm">settings</span></p>
                    </button>
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl px-6 py-3 text-center min-w-[100px]">
                        <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Chronicles</p>
                        <p className="text-2xl font-black text-primary">{currentCampaign.logs?.length || 0}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Party & Journals */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Party Overview */}
                    <section className="obsidian-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">group</span>
                                Active Party Members
                            </h3>
                            <button
                                onClick={() => setIsRecruiting(true)}
                                className="text-primary text-[10px] font-black uppercase tracking-[0.1em] px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-all"
                            >
                                Recruit Hero
                            </button>
                        </div>

                        {activeParty.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                                <span className="material-symbols-outlined text-slate-700 text-4xl mb-4">person_add</span>
                                <p className="text-slate-500 text-sm font-medium">No heroes have joined this quest yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeParty.map(hero => (
                                    <div key={hero.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-4 items-center group relative">
                                        <div className="size-16 rounded-xl bg-slate-900 border border-white/10 relative overflow-hidden">
                                            {hero.image && <Image src={hero.image} alt={hero.name} fill className="object-cover" />}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-xs font-black text-slate-100 uppercase tracking-tight">{hero.name}</p>
                                            <p className="text-[9px] font-bold text-primary uppercase tracking-widest">{hero.class} · Level {hero.level}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleHeroRecruitment(hero.id)}
                                            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 size-8 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 transition-all hover:text-white"
                                            title="Remove from Party"
                                        >
                                            <span className="material-symbols-outlined text-sm">person_remove</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Chronicles / Campaign Log */}
                    <section className="obsidian-panel rounded-3xl p-8 border border-white/5">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">history_edu</span>
                                Chronicles of the Realm
                            </h3>
                            <button
                                onClick={() => setIsLogging(true)}
                                className="text-primary text-[10px] font-black uppercase tracking-[0.1em] px-4 py-2 border border-primary/20 rounded-xl hover:bg-primary/10 transition-all"
                            >
                                New Entry
                            </button>
                        </div>

                        {(!currentCampaign.logs || currentCampaign.logs.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-2xl">
                                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">History has yet to be written.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {currentCampaign.logs.map(log => (
                                    <div key={log.id} className="relative pl-8 border-l border-white/10 pb-6 last:pb-0 group">
                                        <div className="absolute left-0 top-0 size-3 rounded-full bg-slate-800 border-2 border-primary -translate-x-1.5 shadow-[0_0_10px_rgba(var(--color-primary),0.5)]" />
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-xs font-black text-slate-200 uppercase tracking-tight">{log.title}</h4>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{log.date}</span>
                                                <button onClick={() => setDeleteLogTargetId(log.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed italic">{log.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="space-y-8">
                    {/* DM Tools */}
                    <section className="obsidian-panel rounded-3xl p-8 border border-white/5">
                        <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] mb-8">Master Utilities</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <Link href={`/combat?campaignId=${currentCampaign.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group text-left">
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-lg">swords</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-200 uppercase">Battle Command</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Initiate combat encounter</p>
                                </div>
                            </Link>
                            <button
                                onClick={() => setIsLogging(true)}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group text-left w-full"
                            >
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-lg">history_edu</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-200 uppercase">Chronicle Entry</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Record history of this session</p>
                                </div>
                            </button>
                            <Link href="/characters" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group text-left">
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-lg">groups</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-200 uppercase">Hero Gallery</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Manage master adventurer roster</p>
                                </div>
                            </Link>
                        </div>
                    </section>

                    {/* NPC Snippet */}
                    <section className="obsidian-panel rounded-3xl p-8 border border-white/5">
                        <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">skull</span>
                            Local Threats
                        </h3>
                        <p className="text-slate-500 text-[9px] leading-relaxed mb-6">Common entities in {currentCampaign.setting}.</p>
                        <div className="space-y-3">
                            {['Goblin', 'Skeleton', 'Bandit'].map(npc => (
                                <div key={npc} className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center group hover:border-primary/30 transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase group-hover:text-slate-200 transition-colors">{npc}</p>
                                    <span className="text-[8px] font-bold text-slate-600 uppercase">CR 1/4</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Recuitment Modal */}
            <AnimatePresence>
                {isRecruiting && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="obsidian-panel w-full max-w-xl rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Recruit Adventurers</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Summoning heroes to the cause</p>
                                </div>
                                <button onClick={() => setIsRecruiting(false)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {availableHeroes.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-slate-500 text-sm font-medium">No available heroes found in the Realm.</p>
                                        <Link href="/characters" className="text-primary text-[10px] font-black uppercase tracking-widest mt-4 inline-block underline underline-offset-4">Forge New Hero</Link>
                                    </div>
                                ) : (
                                    availableHeroes.map(hero => (
                                        <div key={hero.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-4 items-center group transition-all hover:bg-white/10 hover:border-primary/20">
                                            <div className="size-14 rounded-xl bg-slate-900 border border-white/10 relative overflow-hidden">
                                                {hero.visualUrl && <Image src={hero.visualUrl} alt={hero.name} fill className="object-cover" />}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-xs font-black text-slate-100 uppercase">{hero.name}</p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{hero.class} · Level {hero.level}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleHeroRecruitment(hero.id)}
                                                className="bg-primary hover:bg-white text-black size-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all shadow-lg shadow-primary/10"
                                            >
                                                <span className="material-symbols-outlined text-lg">add</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Log / Chronicle Modal */}
            <AnimatePresence>
                {isLogging && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="obsidian-panel w-full max-w-lg rounded-3xl p-10 border border-white/10 shadow-2xl">
                            <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tight mb-8">Record Chronicle</h3>
                            <form onSubmit={handleAddLog} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Entry Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newLog.title}
                                        onChange={(e) => setNewLog({ ...newLog, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all"
                                        placeholder="e.g. The Spire of Long Shadows"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Narrative Summary</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={newLog.content}
                                        onChange={(e) => setNewLog({ ...newLog, content: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all placeholder:text-slate-700 resize-none"
                                        placeholder="Briefly describe the session's key events..."
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsLogging(false)}
                                        className="flex-1 px-6 py-4 rounded-xl border border-white/10 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-white hover:border-white/20 transition-all"
                                    >
                                        Seal Journal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-2 px-12 py-4 rounded-xl bg-primary text-black font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Imprint History
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Edit Campaign Modal */}
            <AnimatePresence>
                {isEditingCampaign && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="obsidian-panel w-full max-w-xl rounded-3xl p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Refine Campaign</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Adjusting the weave of fate</p>
                                </div>
                                <button onClick={() => setIsEditingCampaign(false)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleUpdateCampaign} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Campaign Name</label>
                                    <input type="text" required value={editCampaignData.name} onChange={(e) => setEditCampaignData({ ...editCampaignData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">World Setting</label>
                                    <input type="text" value={editCampaignData.setting} onChange={(e) => setEditCampaignData({ ...editCampaignData, setting: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Dungeon Master</label>
                                        <input type="text" value={editCampaignData.dm} onChange={(e) => setEditCampaignData({ ...editCampaignData, dm: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Party Level</label>
                                        <input type="number" min="1" max="20" value={editCampaignData.level} onChange={(e) => setEditCampaignData({ ...editCampaignData, level: parseInt(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <button type="submit" className="w-full bg-primary text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all primary-glow">Update Chronicle</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <ConfirmModal
                isOpen={!!deleteLogTargetId}
                onClose={() => setDeleteLogTargetId(null)}
                onConfirm={deleteLog}
                title="Delete Log Entry"
                message="Are you sure you want to delete this chapter from history? This cannot be undone."
                confirmLabel="Delete Entry"
                icon="history"
            />
        </div>
    );
}
