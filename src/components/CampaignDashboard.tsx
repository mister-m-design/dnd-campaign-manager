"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function CampaignDashboard() {
    const currentCampaign = {
        name: "The Eternal Oath",
        dm: "Michael",
        partySize: 4,
        level: 5,
        status: "In Progress",
        nextSession: "2026-03-20T19:00:00Z"
    };

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header section with Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-100 uppercase tracking-tighter">{currentCampaign.name}</h1>
                    <p className="text-primary text-xs font-bold uppercase tracking-[0.3em] mt-2">Dungeon Master: {currentCampaign.dm}</p>
                </div>
                <div className="flex gap-4">
                    <div className="obsidian-panel rounded-xl px-4 py-2 text-center border-t border-white/10">
                        <p className="text-[8px] font-black text-slate-500 uppercase">Party Level</p>
                        <p className="text-lg font-black text-slate-200">{currentCampaign.level}</p>
                    </div>
                    <div className="obsidian-panel rounded-xl px-4 py-2 text-center border-t border-white/10">
                        <p className="text-[8px] font-black text-slate-500 uppercase">Members</p>
                        <p className="text-lg font-black text-slate-200">{currentCampaign.partySize}</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 text-center">
                        <p className="text-[8px] font-black text-primary uppercase">Next Session</p>
                        <p className="text-lg font-black text-primary">Mar 20</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Party & Quests */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Party Overview */}
                    <section className="obsidian-panel rounded-2xl p-6 border border-white/5">
                        <h3 className="text-slate-100 font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">group</span>
                            Active Party Members
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: "Valerius Moonwhisper", class: "Paladin", hp: "45/45", ac: 18 },
                                { name: "Elara Nightshade", class: "Rogue", hp: "32/32", ac: 16 },
                                { name: "Grog Bonebreaker", class: "Barbarian", hp: "58/58", ac: 14 },
                                { name: "Kaelen the Wise", class: "Wizard", hp: "24/24", ac: 12 }
                            ].map(member => (
                                <div key={member.name} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black uppercase text-xs">{member.name[0]}</div>
                                        <div>
                                            <h4 className="text-slate-200 font-bold text-sm">{member.name}</h4>
                                            <p className="text-slate-500 text-[10px] uppercase font-black">{member.class}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-300 font-black text-xs">{member.hp}</p>
                                        <p className="text-slate-500 text-[8px] uppercase font-bold">Health</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Quest Tracker */}
                    <section className="obsidian-panel rounded-2xl p-6 border border-white/5">
                        <h3 className="text-slate-100 font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">auto_stories</span>
                            Active Quests
                        </h3>
                        <div className="space-y-4">
                            {[
                                { title: "The Shifting Sands", goal: "Find the pyramid of the lost king", status: "Primary" },
                                { title: "Missing Blacksmith", goal: "Locate Barnaby's apprentice", status: "Side" }
                            ].map(quest => (
                                <div key={quest.title} className="bg-white/5 border-l-2 border-primary p-4 rounded-r-xl">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="text-slate-200 font-black text-sm uppercase tracking-tight">{quest.title}</h4>
                                        <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black uppercase">{quest.status}</span>
                                    </div>
                                    <p className="text-slate-400 text-xs">{quest.goal}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: World Info & Sessions */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <section className="obsidian-panel rounded-2xl p-6 border border-white/5">
                        <h3 className="text-slate-100 font-black text-sm uppercase tracking-widest mb-6">DM Tools</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all group">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">swords</span>
                                <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-200 uppercase">New Combat</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all group">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">map</span>
                                <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-200 uppercase">Add Map</span>
                            </button>
                        </div>
                    </section>

                    {/* Timeline / Recent Activity */}
                    <section className="obsidian-panel rounded-2xl p-6 border border-white/5">
                        <h3 className="text-slate-100 font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">history</span>
                            Adventure Log
                        </h3>
                        <div className="space-y-6 relative ml-2">
                            <div className="absolute left-[-9px] top-0 bottom-0 w-px bg-white/10" />
                            {[
                                { event: "Defeated Bone Collector", date: "Session 4" },
                                { event: "Arrived at Sandhaven", date: "Session 3" },
                                { event: "Found Ancient Relic", date: "Session 2" }
                            ].map(item => (
                                <div key={item.event} className="relative pl-6">
                                    <div className="absolute left-[-13px] top-1.5 size-2 rounded-full bg-primary" />
                                    <p className="text-xs font-black text-slate-200 uppercase tracking-tight">{item.event}</p>
                                    <p className="text-[10px] text-primary/60 font-medium">{item.date}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
