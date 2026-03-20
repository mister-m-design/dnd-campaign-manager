"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CombatantState as Combatant, Resource } from '@/types';
import { BarbarianRageView } from '@/components/combat/ClassViews/BarbarianRageView';
import { DruidWildshapeView } from '@/components/combat/ClassViews/DruidWildshapeView';
import { SorcererPointsView } from '@/components/combat/ClassViews/SorcererPointsView';

interface ClassSidebarProps {
    combatant: Combatant | null;
    onUpdateCombatant: (id: string, updates: Partial<Combatant>) => void;
    onOpenWildshape?: () => void;
}

export function ClassSidebar({ combatant, onUpdateCombatant, onOpenWildshape }: ClassSidebarProps) {
    if (!combatant) return null;

    const renderClassView = () => {
        switch (combatant.class) {
            case 'Barbarian':
                return <BarbarianRageView combatant={combatant} onUpdate={onUpdateCombatant} />;
            case 'Druid':
                return <DruidWildshapeView combatant={combatant} onUpdate={onUpdateCombatant} onOpenWildshape={onOpenWildshape} />;
            case 'Sorcerer':
                return <SorcererPointsView combatant={combatant} onUpdate={onUpdateCombatant} />;
            default:
                return (
                    <div className="p-6 text-center opacity-20 mt-20">
                        <span className="material-symbols-outlined text-6xl mb-4">Sd_card_alert</span>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">No active class features</p>
                    </div>
                );
        }
    };

    return (
        <aside className="w-[400px] border-l border-white/5 bg-[#0a0c14]/50 backdrop-blur-3xl h-full flex flex-col">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-2xl">
                            {combatant.class === 'Barbarian' ? 'raze' : 
                             combatant.class === 'Druid' ? 'nature' : 
                             combatant.class === 'Sorcerer' ? 'auto_fix_high' : 'person'}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-100 uppercase tracking-tighter">{combatant.name}</h2>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">
                            Level {combatant.level} {combatant.class}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={combatant.id + combatant.class}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="p-6"
                    >
                        {renderClassView()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </aside>
    );
}
