"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useDice } from '@/contexts/DiceContext';

const NAV_ITEMS = [
    { name: 'Dashboard',  icon: 'dashboard',     href: '/campaign' },
    { name: 'Characters', icon: 'shield_person',  href: '/characters' },
    { name: 'Combat',     icon: 'swords',         href: '/combat' },
    { name: 'Library',    icon: 'menu_book',      href: '/library' },
    { name: 'Homebrew',   icon: 'science',        href: '/homebrew' },
    { name: 'World Map',  icon: 'map',            href: '/world-map' },
];

// ─── DARK/LIGHT MODE HOOK ─────────────────────────────────────────────────────

function useTheme() {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        // Restore from localStorage
        const stored = localStorage.getItem('mythictable_theme') as 'dark' | 'light' | null;
        const initial = stored ?? 'dark';
        setTheme(initial);
        applyTheme(initial);
    }, []);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('mythictable_theme', next);
        applyTheme(next);
    };

    return { theme, toggle };
}

function applyTheme(theme: 'dark' | 'light') {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    html.classList.add(theme);
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function TopHeader() {
    const pathname = usePathname();
    const { theme, toggle } = useTheme();
    const { isDiceOpen, setIsDiceOpen } = useDice();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <header
                className="h-14 border-b sticky top-0 z-50 flex items-center justify-between px-4 md:px-8"
                style={{
                    background: 'var(--nav-bg)',
                    borderColor: 'var(--nav-border)',
                    backdropFilter: 'blur(20px)',
                }}
            >
                {/* Logo */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2.5 shrink-0">
                        <div className="size-7 rounded-lg flex items-center justify-center text-black shadow-lg"
                            style={{ background: 'var(--primary)', boxShadow: '0 0 16px var(--primary-glow)' }}>
                            <span className="material-symbols-outlined text-[16px] font-black">castle</span>
                        </div>
                        <h1 className="text-base font-black tracking-tighter uppercase hidden sm:block"
                            style={{ color: 'var(--foreground)' }}>
                            MYTHIC<span style={{ color: 'var(--primary)', fontWeight: 300 }}>TABLE</span>
                        </h1>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-0.5">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link key={item.name} href={item.href} className="relative px-3 py-2 group">
                                    <div className={`flex items-center gap-1.5 transition-colors text-[10px] font-black uppercase tracking-widest
                                        ${isActive ? '' : 'hover:opacity-80'}`}
                                        style={{ color: isActive ? 'var(--primary)' : 'var(--foreground-muted)' }}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                        <span className="hidden lg:block">{item.name}</span>
                                    </div>
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute bottom-0 left-0 right-0 h-0.5"
                                            style={{ background: 'var(--primary)', boxShadow: '0 0 8px var(--primary-glow)' }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                    {/* Dice Toggle */}
                    <button
                        onClick={() => setIsDiceOpen(!isDiceOpen)}
                        title="Toggle Dice Tray"
                        className="size-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                        style={{
                            background: isDiceOpen ? 'var(--primary-subtle)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isDiceOpen ? 'var(--panel-border-accent)' : 'var(--panel-border)'}`,
                            color: isDiceOpen ? 'var(--primary)' : 'var(--foreground-muted)',
                        }}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            casino
                        </span>
                    </button>

                    {/* Dark/Light toggle */}
                    <button
                        onClick={toggle}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="size-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--panel-border)',
                            color: 'var(--foreground-muted)',
                        }}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    {/* User badge */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)' }}>
                        <div className="size-5 rounded-full overflow-hidden relative"
                            style={{ border: '1px solid var(--primary)' }}>
                            <Image
                                src="https://ui-avatars.com/api/?name=Michael+Murtha&background=f6f6f8&color=0a0c14"
                                alt="User" fill className="object-cover"
                            />
                        </div>
                        <div className="flex flex-col leading-none">
                            <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--foreground)' }}>Michael Murtha</p>
                            <p className="text-[7px] font-bold uppercase tracking-tighter" style={{ color: 'var(--primary)' }}>Dungeon Master</p>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(v => !v)}
                        className="md:hidden size-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color: 'var(--foreground-muted)' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {mobileMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>
            </header>

            {/* Mobile drawer */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="md:hidden fixed top-14 left-0 right-0 z-40 p-4 grid grid-cols-3 gap-2"
                    style={{
                        background: 'var(--nav-bg)',
                        borderBottom: '1px solid var(--nav-border)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    {NAV_ITEMS.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all"
                                style={{
                                    background: isActive ? 'var(--primary-subtle)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${isActive ? 'var(--panel-border-accent)' : 'var(--panel-border)'}`,
                                    color: isActive ? 'var(--primary)' : 'var(--foreground-muted)',
                                }}
                            >
                                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest">{item.name}</span>
                            </Link>
                        );
                    })}
                </motion.div>
            )}

            {/* Mobile bottom nav (always visible on small screens) */}
            <nav className="mobile-bottom-nav">
                {NAV_ITEMS.slice(0, 5).map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
                            style={{ color: isActive ? 'var(--primary)' : 'var(--foreground-muted)' }}
                        >
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            <span className="text-[7px] font-black uppercase tracking-widest">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
