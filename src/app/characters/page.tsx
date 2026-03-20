"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSyncedState } from '@/hooks/useSyncedState';
import { usePersistentState } from '@/hooks/usePersistentState';
import Link from 'next/link';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ABILITIES_LIST } from '@/lib/rules';

const CLASS_COLORS: Record<string, string> = {
    Fighter: 'text-red-400 bg-red-500/10 border-red-500/20',
    Wizard: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Rogue: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    Cleric: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    Paladin: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Ranger: 'text-green-400 bg-green-500/10 border-green-500/20',
    Barbarian: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    Druid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Bard: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    Warlock: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    Sorcerer: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    Monk: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

function getHPColor(current: number, max: number) {
    const pct = max > 0 ? current / max : 1;
    if (pct > 0.6) return 'from-green-500 to-green-400';
    if (pct > 0.3) return 'from-amber-500 to-amber-400';
    return 'from-red-500 to-red-400';
}

export default function CharacterGallery() {
    const [characters, setCharacters] = useSyncedState<any[]>('/api/characters', 'mythic_saved_characters', []);
    const [showRetired, setShowRetired] = usePersistentState('mythic_gallery_show_retired', false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const deleteCharacter = async () => {
        if (deleteTargetId) {
            try {
                await fetch(`/api/characters?id=${deleteTargetId}`, { method: 'DELETE' });
                setCharacters((prev: any[]) => prev.filter(c => c.id !== deleteTargetId));
                setDeleteTargetId(null);
            } catch (error) {
                console.error("Failed to delete from master database:", error);
            }
        }
    };

    const toggleRetire = (id: string) => {
        setCharacters((prev: any[]) => prev.map(c =>
            c.id === id ? { ...c, retired: !c.retired } : c
        ));
    };

    const activeHeroes = characters.filter(c => !c.retired);
    const retiredHeroes = characters.filter(c => c.retired);
    const filteredCharacters = showRetired ? retiredHeroes : activeHeroes;

    return (
        <div
            className="min-h-screen selection:bg-primary selection:text-black"
            style={{ background: 'var(--background)', color: 'var(--foreground)' }}
        >
            {/* Page Header */}
            <div className="border-b px-6 md:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{ borderColor: 'var(--panel-border)', background: 'var(--panel-bg)' }}>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: 'var(--foreground)' }}>
                        Hero Gallery
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                        {activeHeroes.length} Active · {retiredHeroes.length} Retired
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowRetired(!showRetired)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border"
                        style={{
                            background: showRetired ? 'var(--primary-subtle)' : 'transparent',
                            color: showRetired ? 'var(--primary)' : 'var(--foreground-muted)',
                            borderColor: showRetired ? 'var(--panel-border-accent)' : 'var(--panel-border)',
                        }}
                    >
                        {showRetired ? '⚔ Active' : '☽ Retired'}
                    </button>

                    <Link
                        href="/characters/create"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-black"
                        style={{ background: 'var(--primary)' }}
                    >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Forge Hero
                    </Link>
                </div>
            </div>

            {/* Hero Grid */}
            <div className="p-4 md:p-6">
                {characters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                        <div
                            className="size-20 rounded-2xl flex items-center justify-center"
                            style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
                        >
                            <span className="material-symbols-outlined text-[48px]" style={{ color: 'var(--foreground-muted)' }}>person_off</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tighter" style={{ color: 'var(--foreground-muted)' }}>The Hall is Empty</h3>
                            <p className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                No champions registered yet
                            </p>
                        </div>
                        <Link
                            href="/characters/create"
                            className="mt-4 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-black"
                            style={{ background: 'var(--primary)' }}
                        >
                            Forge First Hero
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        <AnimatePresence mode="popLayout">
                            {filteredCharacters.map((char, index) => {
                                const isExpanded = expandedId === char.id;
                                const classStyle = CLASS_COLORS[char.class] || 'text-primary bg-primary/10 border-primary/20';
                                const hpPct = Math.min(((char.currentHP || char.currentHp || char.maxHP || 10) / (char.maxHP || char.maxHp || 10)) * 100, 100);
                                const hpGradient = getHPColor(char.currentHP || char.currentHp || char.maxHP || 10, char.maxHP || char.maxHp || 10);
                                const hpCurrent = char.currentHP ?? char.currentHp ?? char.maxHP ?? char.maxHp ?? 10;
                                const hpMax = char.maxHP ?? char.maxHp ?? 10;
                                const ac = char.armorClass ?? char.ac ?? 10;
                                const spd = char.speed ?? 30;
                                const pb = char.proficiencyBonus ?? 2;
                                const lvl = char.level ?? 1;

                                return (
                                    <motion.div
                                        key={char.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="rounded-2xl overflow-hidden flex flex-col"
                                        style={{
                                            background: 'var(--panel-bg)',
                                            border: '1px solid var(--panel-border)',
                                        }}
                                    >
                                        {/* Top Row: Avatar + Identity + Level Ring */}
                                        <div className="flex items-center gap-3 p-3 pb-2">
                                            {/* Portrait */}
                                            <div
                                                className="size-14 rounded-xl overflow-hidden relative flex-shrink-0"
                                                style={{ border: `1px solid var(--panel-border-accent)` }}
                                            >
                                                <ImageWithPlaceholder
                                                    src={char.imageUrl || char.image || char.portrait}
                                                    alt={char.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            {/* Identity */}
                                            <div className="flex-grow min-w-0">
                                                <h3
                                                    className="font-black uppercase tracking-tight text-base leading-tight truncate"
                                                    style={{ color: 'var(--foreground)' }}
                                                >
                                                    {char.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border tracking-widest ${classStyle}`}>
                                                        {char.class}
                                                    </span>
                                                    <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>
                                                        {char.species}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Level Badge */}
                                            <div
                                                className="size-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                                                style={{ background: 'var(--primary-subtle)', border: '1px solid var(--panel-border-accent)' }}
                                            >
                                                <span className="text-[7px] font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>LVL</span>
                                                <span className="text-base font-black leading-none" style={{ color: 'var(--primary)' }}>{lvl}</span>
                                            </div>
                                        </div>

                                        {/* HP Bar */}
                                        <div className="px-3 pb-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>HP</span>
                                                <span className="text-[9px] font-black" style={{ color: 'var(--foreground)' }}>
                                                    {hpCurrent} <span style={{ color: 'var(--foreground-muted)' }}>/ {hpMax}</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${hpPct}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    className={`h-full bg-gradient-to-r ${hpGradient} rounded-full`}
                                                />
                                            </div>
                                        </div>

                                        {/* Core Stats Row */}
                                        <div
                                            className="mx-3 mb-2 rounded-xl grid grid-cols-3 divide-x"
                                            style={{
                                                background: 'var(--bg-raised)',
                                                border: '1px solid var(--panel-border)',
                                            }}
                                        >
                                            {[
                                                { label: 'AC', value: ac, icon: 'shield' },
                                                { label: 'SPD', value: `${spd}ft`, icon: 'sprint' },
                                                { label: 'PROF', value: `+${pb}`, icon: 'star' },
                                            ].map((stat) => (
                                                <div key={stat.label} className="flex flex-col items-center py-2 px-1">
                                                    <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>{stat.label}</span>
                                                    <span className="text-sm font-black leading-none mt-0.5" style={{ color: 'var(--foreground)' }}>{stat.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Expandable: Ability Scores */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mx-3 mb-2 rounded-xl p-2 grid grid-cols-6 gap-1"
                                                        style={{ background: 'var(--bg-raised)', border: '1px solid var(--panel-border)' }}>
                                                        {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(ab => {
                                                            const raw = char.abilityScores?.[ab] || (char as any)[ab.toLowerCase()] || (char as any)[{ STR: 'strength', DEX: 'dexterity', CON: 'constitution', INT: 'intelligence', WIS: 'wisdom', CHA: 'charisma' }[ab] as string] || 10;
                                                            const mod = Math.floor((raw - 10) / 2);
                                                            return (
                                                                <div key={ab} className="flex flex-col items-center py-1.5">
                                                                    <span className="text-[6px] font-black uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>{ab}</span>
                                                                    <span className="text-xs font-black leading-none mt-0.5" style={{ color: 'var(--primary)' }}>{mod >= 0 ? `+${mod}` : mod}</span>
                                                                    <span className="text-[7px] font-bold" style={{ color: 'var(--foreground-muted)' }}>{raw}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {char.background && (
                                                        <div className="mx-3 mb-2 flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-[12px]" style={{ color: 'var(--primary)' }}>bookmark</span>
                                                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>
                                                                {char.background} · {char.alignment || 'Neutral'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Footer Actions */}
                                        <div className="flex items-center gap-1.5 p-2 pt-1 mt-auto">
                                            <Link
                                                href={`/characters/print/${char.id}`}
                                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-black"
                                                style={{ background: 'var(--primary)' }}
                                            >
                                                <span className="material-symbols-outlined text-[13px]">description</span>
                                                Sheet
                                            </Link>

                                            <Link
                                                href={`/combat?id=${char.id}`}
                                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border"
                                                style={{
                                                    color: 'var(--foreground-muted)',
                                                    borderColor: 'var(--panel-border)',
                                                    background: 'var(--panel-bg)',
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[13px]">swords</span>
                                                Battle
                                            </Link>

                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : char.id)}
                                                className="size-8 flex items-center justify-center rounded-xl transition-all border"
                                                style={{
                                                    color: isExpanded ? 'var(--primary)' : 'var(--foreground-muted)',
                                                    borderColor: isExpanded ? 'var(--panel-border-accent)' : 'var(--panel-border)',
                                                    background: isExpanded ? 'var(--primary-subtle)' : 'transparent',
                                                }}
                                                title="Toggle stats"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {isExpanded ? 'expand_less' : 'expand_more'}
                                                </span>
                                            </button>

                                            <Link
                                                href={`/characters/edit/${char.id}`}
                                                className="size-8 flex items-center justify-center rounded-xl transition-all border"
                                                style={{
                                                    color: 'var(--foreground-muted)',
                                                    borderColor: 'var(--panel-border)',
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                            </Link>

                                            <button
                                                onClick={() => toggleRetire(char.id)}
                                                className="size-8 flex items-center justify-center rounded-xl transition-all border"
                                                title={char.retired ? 'Restore hero' : 'Retire hero'}
                                                style={{
                                                    color: char.retired ? 'var(--primary)' : 'var(--foreground-muted)',
                                                    borderColor: char.retired ? 'var(--panel-border-accent)' : 'var(--panel-border)',
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">{char.retired ? 'restore' : 'archive'}</span>
                                            </button>

                                            <button
                                                onClick={() => setDeleteTargetId(char.id)}
                                                className="size-8 flex items-center justify-center rounded-xl transition-all border"
                                                style={{
                                                    color: 'var(--danger)',
                                                    borderColor: 'rgba(239,68,68,0.15)',
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

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
