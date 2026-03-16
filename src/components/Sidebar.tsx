"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

const NAV_ITEMS = [
    { name: 'Dashboard', icon: 'dashboard', href: '/campaign' },
    { name: 'Characters', icon: 'shield_person', href: '/characters' },
    { name: 'Bestiary', icon: 'pest_control', href: '/npcs' },
    { name: 'Combat', icon: 'swords', href: '/combat' },
    { name: 'Library', icon: 'inventory_2', href: '/combat/library' },
    { name: 'Spellbook', icon: 'auto_stories', href: '/spells' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-white/5 bg-background-dark/50 backdrop-blur-xl h-screen sticky top-0 flex flex-col pt-8">
            <div className="px-8 mb-12 flex items-center gap-3">
                <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-black shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined font-black">castle</span>
                </div>
                <h1 className="text-xl font-black text-slate-100 tracking-tighter uppercase">MYTHIC<span className="text-primary font-light">TABLE</span></h1>
            </div>

            <nav className="flex-grow px-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href}>
                            <motion.div
                                whileHover={{ x: 4 }}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(251,191,36,0.05)]'
                                    : 'text-slate-500 hover:text-slate-200'
                                    }`}
                            >
                                <span className={`material-symbols-outlined ${isActive ? 'text-primary' : 'text-slate-600 group-hover:text-slate-300'}`}>
                                    {item.icon}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="ml-auto size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(251,191,36,1)]"
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="size-8 rounded-full border border-primary overflow-hidden relative">
                        <Image src="https://ui-avatars.com/api/?name=Michael+Murtha&background=f6f6f8&color=0a0c14" alt="User" fill className="object-cover" />
                    </div>
                    <div className="flex-grow">
                        <p className="text-[10px] font-black text-slate-200 uppercase truncate">Michael Murtha</p>
                        <p className="text-[8px] text-primary font-bold uppercase tracking-tighter">Dungeon Master</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-700 hover:text-slate-300 cursor-pointer text-sm transition-colors">settings</span>
                </div>
            </div>
        </aside>
    );
}
