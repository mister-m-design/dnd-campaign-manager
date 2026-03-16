"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';
import Link from 'next/link';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function CharacterGallery() {
    const [characters, setCharacters] = usePersistentState<any[]>('mythic_saved_characters', []);
    const [showRetired, setShowRetired] = usePersistentState('mythic_gallery_show_retired', false);

    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const deleteCharacter = () => {
        if (deleteTargetId) {
            setCharacters((prev: any[]) => prev.filter(c => c.id !== deleteTargetId));
            setDeleteTargetId(null);
        }
    };

    const toggleRetire = (id: string) => {
        setCharacters((prev: any[]) => {
            const next = prev.map(c =>
                c.id === id ? { ...c, retired: !c.retired } : c
            );
            return next;
        });
    };

    const activeHeroes = characters.filter(c => !c.retired);
    const retiredHeroes = characters.filter(c => c.retired);
    const filteredCharacters = showRetired ? retiredHeroes : activeHeroes;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-100 uppercase tracking-tighter">Hero Gallery</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] italic">Hall of legends and future pioneers.</p>
                        <button
                            onClick={() => setShowRetired(!showRetired)}
                            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${showRetired ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                        >
                            {showRetired ? 'Viewing Retired' : 'View Retired'}
                        </button>
                    </div>
                </div>
                <Link
                    href="/characters/create"
                    className="bg-primary text-black px-8 py-3 rounded-xl font-black uppercase text-[11px] tracking-widest hover:scale-105 active:scale-95 transition-all primary-glow border-t border-white/20"
                >
                    Forge New Hero
                </Link>
            </div>

            {characters.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
                    <div className="size-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-700">
                        <span className="material-symbols-outlined text-5xl">person_off</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-400 uppercase">The Hall is Empty</h3>
                        <p className="text-slate-600 text-xs mt-1 lowercase font-bold tracking-tight">No champions have been registered in the grimoire yet.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredCharacters.map((char, index) => (
                            <motion.div
                                key={char.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="obsidian-panel rounded-3xl p-6 border border-white/5 group hover:border-primary/30 transition-all relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />

                                <div className="flex gap-6 mb-6">
                                    <div className="size-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                                        <ImageWithPlaceholder
                                            src={char.image}
                                            alt={char.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            priority={index < 3}
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            fallbackIcon="person"
                                        />
                                    </div>
                                    <div className="flex-grow py-2">
                                        <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tight leading-none mb-1">{char.name}</h3>
                                        <p className="text-primary text-[10px] font-black uppercase tracking-widest">Lv.1 {char.species} {char.class}</p>
                                        <div className="flex gap-2 mt-4">
                                            <span className="bg-white/5 px-2 py-1 rounded text-[8px] font-black text-slate-400 uppercase">{char.background}</span>
                                            <span className="bg-white/5 px-2 py-1 rounded text-[8px] font-black text-slate-400 uppercase">{char.alignment}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-6 gap-2 mb-6">
                                    {Object.entries(char.stats).map(([s, v]: [string, any]) => (
                                        <div key={s} className="bg-white/5 rounded-lg p-1.5 text-center border border-white/5">
                                            <p className="text-[6px] font-black text-slate-500 uppercase">{s}</p>
                                            <p className="text-sm font-black text-slate-200">{v}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2 mt-auto">
                                    <Link
                                        href={`/characters/print/${char.id}`}
                                        target="_blank"
                                        className="bg-white/5 border border-white/10 text-slate-300 px-3 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">print</span>
                                    </Link>
                                    <Link
                                        href={`/characters/edit/${char.id}`}
                                        className="bg-white/5 border border-white/10 text-slate-300 px-3 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </Link>
                                    <button
                                        onClick={() => toggleRetire(char.id)}
                                        className={`flex-grow border py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${char.retired ? 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10' : 'border-white/10 text-slate-400 hover:bg-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">{char.retired ? 'workspace_premium' : 'bed'}</span>
                                        {char.retired ? 'Return' : 'Retire'}
                                    </button>
                                    <button
                                        onClick={() => setDeleteTargetId(char.id)}
                                        className="size-11 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl transition-all flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
            <ConfirmModal
                isOpen={!!deleteTargetId}
                onClose={() => setDeleteTargetId(null)}
                onConfirm={deleteCharacter}
                title="Delete Hero"
                message="Permanently DELETE this hero from the grimoire? This cannot be undone."
                confirmLabel="Delete Forever"
                icon="skull"
            />
        </div>
    );
}
