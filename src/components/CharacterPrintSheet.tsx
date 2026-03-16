"use client";

import React, { useEffect, useState } from 'react';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useParams } from 'next/navigation';

export default function CharacterPrintSheet() {
    const params = useParams();
    const [savedCharacters] = usePersistentState<any[]>('mythic_characters', []);
    const [char, setChar] = useState<any>(null);

    useEffect(() => {
        const found = savedCharacters.find(c => c.id === params.id);
        if (found) setChar(found);
    }, [params.id, savedCharacters]);

    if (!char) return <div className="p-20 text-white font-black uppercase">Locating Hero in the archives...</div>;

    const getMod = (score: number) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : mod;
    };

    return (
        <div className="min-h-screen bg-white text-black p-8 print:p-0 font-serif max-w-[850px] mx-auto overflow-hidden">
            {/* Print Header Controls (Hidden on Print) */}
            <div className="mb-8 flex justify-between items-center print:hidden bg-slate-900 p-4 rounded-xl">
                <div className="flex gap-4 items-center">
                    <div className="size-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">print</span>
                    </div>
                    <p className="text-white font-black uppercase text-xs">Print Character Sheet</p>
                </div>
                <button onClick={() => window.print()} className="bg-primary text-black px-6 py-2 rounded font-black uppercase text-xs">Confirm Print</button>
            </div>

            {/* Standard 5e Header */}
            <div className="border-[3px] border-black p-6 mb-6">
                <div className="flex justify-between items-end gap-12">
                    <div className="flex-grow space-y-4">
                        <div className="border-b-2 border-black pb-1">
                            <p className="text-[24px] font-bold uppercase">{char.name || 'UNNAMED HERO'}</p>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Character Name</label>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 border-l-2 border-black pl-8">
                        <div className="border-b border-black">
                            <p className="text-sm font-bold uppercase">{char.class} 1</p>
                            <label className="text-[8px] font-bold uppercase text-slate-500">Class & Level</label>
                        </div>
                        <div className="border-b border-black">
                            <p className="text-sm font-bold uppercase">{char.background}</p>
                            <label className="text-[8px] font-bold uppercase text-slate-500">Background</label>
                        </div>
                        <div className="border-b border-black">
                            <p className="text-sm font-bold uppercase">{char.playerName || 'Michael'}</p>
                            <label className="text-[8px] font-bold uppercase text-slate-500">Player Name</label>
                        </div>
                        <div className="border-b border-black">
                            <p className="text-sm font-bold uppercase">{char.species}</p>
                            <label className="text-[8px] font-bold uppercase text-slate-500">Race</label>
                        </div>
                        <div className="border-b border-black">
                            <p className="text-sm font-bold uppercase">{char.alignment}</p>
                            <label className="text-[8px] font-bold uppercase text-slate-500">Alignment</label>
                        </div>
                        <div className="border-b border-black">
                            <p className="text-sm font-bold uppercase">0</p>
                            <label className="text-[8px] font-bold uppercase text-slate-500">Experience Points</label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8 h-full">
                {/* Stats & Skills Column */}
                <div className="space-y-6">
                    {/* Core Stats */}
                    <div className="space-y-4 border-2 border-black p-4 rounded-3xl">
                        {Object.entries(char.stats).map(([stat, val]: [string, any]) => (
                            <div key={stat} className="flex flex-col items-center border-[2px] border-black rounded-xl p-2 w-full relative pt-4 mb-2">
                                <label className="text-[8px] font-bold uppercase absolute -top-2 bg-white px-2">{stat}</label>
                                <p className="text-xl font-black">{getMod(val)}</p>
                                <p className="text-[10px] font-bold border-t border-black mt-1 px-4">{val}</p>
                            </div>
                        ))}
                    </div>

                    {/* Vitals */}
                    <div className="border-2 border-black p-4 space-y-4">
                        <div className="flex gap-4 text-center">
                            <div className="flex-1 border-2 border-black p-2">
                                <p className="text-lg font-black">{10 + parseInt((getMod(char.stats.DEX) as string).replace('+', ''))}</p>
                                <label className="text-[8px] font-bold uppercase">Armor Class</label>
                            </div>
                            <div className="flex-1 border-2 border-black p-2">
                                <p className="text-lg font-black">{getMod(char.stats.DEX)}</p>
                                <label className="text-[8px] font-bold uppercase">Initiative</label>
                            </div>
                            <div className="flex-1 border-2 border-black p-2">
                                <p className="text-lg font-black">30</p>
                                <label className="text-[8px] font-bold uppercase">Speed</label>
                            </div>
                        </div>
                        <div className="border-2 border-black p-4 text-center">
                            <div className="flex justify-between border-b border-black pb-2 mb-2">
                                <span className="text-[8px] font-bold uppercase">Max HP: 10</span>
                                <span className="text-[8px] font-bold uppercase">Current HP</span>
                            </div>
                            <div className="h-12"></div>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Traits & Equipment */}
                <div className="col-span-1 space-y-6">
                    <div className="border-2 border-black p-4 h-[120px]">
                        <p className="text-[8px] font-bold uppercase mb-2">Personality Traits</p>
                        <p className="text-[10px] italic">Set your nature in the Digital Forge</p>
                    </div>
                    <div className="border-2 border-black p-4 h-[100px]">
                        <p className="text-[8px] font-bold uppercase mb-2">Ideals</p>
                    </div>
                    <div className="border-2 border-black p-4 h-[300px]">
                        <p className="text-[8px] font-bold uppercase mb-2">Equipment</p>
                        <ul className="text-[10px] list-disc pl-4">
                            <li>Adventurer's Pack</li>
                            <li>Starting Weapon</li>
                        </ul>
                    </div>
                </div>

                {/* Right Column: Features & Imagery */}
                <div className="space-y-6">
                    <div className="aspect-square border-2 border-black relative overflow-hidden flex items-center justify-center">
                        {char.image ? (
                            <img src={char.image} alt="Portrait" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                            <span className="text-slate-300 text-6xl">?</span>
                        )}
                        <label className="text-[8px] font-bold uppercase absolute bottom-0 left-0 right-0 bg-black text-white text-center py-1">Character Portrait</label>
                    </div>

                    <div className="border-2 border-black p-4 min-h-[400px]">
                        <p className="text-[8px] font-bold uppercase mb-4 border-b border-black pb-1">Features & Traits</p>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black uppercase">{char.species} Traits</p>
                                <p className="text-[9px] italic">See digital grimoire for full details.</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase">{char.class} Features</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer QR (Metadata) */}
            <div className="mt-12 pt-4 border-t border-black/10 flex justify-between items-center opacity-50 grayscale">
                <p className="text-[8px] font-bold uppercase tracking-widest text-black">Generated via MythicTable Character Orchestrator</p>
                <div className="size-12 bg-black flex items-center justify-center text-white text-[10px] font-black">QR</div>
            </div>
        </div>
    );
}
