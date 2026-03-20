"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CombatantState, Action, ConditionType } from '@/types';
import { 
    Heart, 
    Shield, 
    Zap, 
    Skull, 
    RotateCcw, 
    ChevronRight, 
    MoreVertical, 
    Activity, 
    Plus, 
    Minus, 
    AlertCircle,
    Eye,
    EyeOff,
    Edit3,
    Footprints
} from 'lucide-react';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';

interface CombatantCardProps {
    combatant: CombatantState;
    isActive: boolean;
    isSelected: boolean;
    isDMMode?: boolean;
    isTargeted?: boolean;
    isNext?: boolean;
    onSelect: (id: string) => void;
    onStatusToggle?: (id: string, status: string) => void;
    onHpChange?: (id: string, amount: number) => void;
    onAction?: (attacker: CombatantState, action: Action, targetOverride?: CombatantState) => void;
    onConditionToggle?: (id: string, cond: ConditionType) => void;
    onSetTarget?: (id: string | null) => void;
    onEditInitiative?: (id: string, val: number) => void;
}

export const CombatantCard: React.FC<CombatantCardProps> = ({
    combatant,
    isActive,
    isSelected,
    isDMMode,
    isTargeted,
    isNext,
    onSelect,
    onStatusToggle,
    onHpChange,
    onAction,
    onConditionToggle,
    onSetTarget,
    onEditInitiative
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const hpPercent = (combatant.currentHP / combatant.maxHP) * 100;
    const isDead = combatant.currentHP <= 0 || combatant.status?.includes('Dead');

    // Health Icon Color
    const hpColor = useMemo(() => {
        if (isDead) return 'text-slate-500';
        if (hpPercent <= 30) return 'text-red-500';
        if (hpPercent <= 70) return 'text-amber-400';
        return 'text-emerald-500';
    }, [hpPercent, isDead]);

    // ── COLORS & GRADIENTS ──────────────────────────────────────────────────
    const sideStyles = useMemo(() => {
        if (combatant.side === 'Ally') {
            return {
                accent: 'var(--teal)',
                glow: 'rgba(20, 184, 166, 0.4)',
                border: 'rgba(20, 184, 166, 0.4)',
                bg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(20, 184, 166, 0.02) 100%)',
                badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
            };
        }
        if (combatant.side === 'Enemy') {
            return {
                accent: 'var(--red)',
                glow: 'rgba(239, 68, 68, 0.4)',
                border: 'rgba(239, 68, 68, 0.4)',
                bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.02) 100%)',
                badge: 'bg-red-500/10 text-red-400 border-red-500/20'
            };
        }
        return {
            accent: 'var(--purple)',
            glow: 'rgba(168, 85, 247, 0.4)',
            border: 'rgba(168, 85, 247, 0.4)',
            bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.02) 100%)',
            badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        };
    }, [combatant.side]);

    const displayHpPercent = Math.max(0, Math.min(100, hpPercent));
    const tempHpPercent = Math.max(0, Math.min(100, (combatant.tempHP / combatant.maxHP) * 100));

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
                opacity: 1, 
                x: 0,
                scale: isActive ? 1.02 : 1,
                filter: isDead ? 'grayscale(0.8) opacity(0.6)' : 'grayscale(0) opacity(1)'
            }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            whileHover={{ x: 4, scale: isActive ? 1.02 : 1.01 }}
            onClick={() => {
                onSelect(combatant.instanceId);
                setIsExpanded(!isExpanded);
            }}
            className={`
                group relative flex w-full cursor-pointer select-none flex-col overflow-hidden
                rounded-2xl border transition-all duration-500 p-4 gap-3
                ${isActive 
                    ? `z-10 border-amber-500/50 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.3)] bg-amber-500/10 ring-1 ring-amber-500/20` 
                    : isSelected 
                        ? 'border-white/30 bg-white/10 shadow-xl' 
                        : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                }
                backdrop-blur-3xl
            `}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${isActive ? 'from-amber-500/20 via-transparent' : isNext ? 'from-amber-500/5 via-transparent' : 'from-transparent'} to-transparent opacity-50`} />
            
            {/* ACTIVE INDICATOR GLOW */}
            {isActive && (
                <motion.div
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-amber-500/10 pointer-events-none"
                />
            )}

            {/* ROW 1: PORTRAIT, NAME, LEVEL */}
            <div className="flex items-center gap-4 relative z-10">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 shadow-2xl">
                    {combatant.portrait ? (
                        <ImageWithPlaceholder 
                            src={combatant.portrait} 
                            alt={combatant.name} 
                            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-white/5 text-xs font-black text-white/20">
                            {combatant.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    
                    {/* LEVEL BADGE */}
                    <div className="absolute top-0 right-0 px-1 py-0.5 bg-black/80 rounded-bl-lg border-l border-b border-white/10">
                        <span className="text-[7px] font-black text-amber-500 tracking-tighter">L{combatant.level}</span>
                    </div>

                    {/* SIDE INDICATOR DOT */}
                    <div
                        className="absolute bottom-1 right-1 h-2 w-2 rounded-full border border-slate-950 shadow-sm"
                        style={{ backgroundColor: isDead ? '#64748b' : sideStyles.accent }}
                    />
                </div>

                <div className="flex flex-col min-w-0">
                    <h3 className={`text-sm font-black tracking-tight text-white/90 truncate sm:text-base ${isActive ? 'text-amber-200' : ''}`}>
                        {combatant.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${sideStyles.badge}`}>
                            {combatant.side}
                        </span>
                        {isActive && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 animate-pulse">
                                Active Turn
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="ml-auto shrink-0 flex items-center gap-2">
                    {isDead && <Skull className="h-4 w-4 text-slate-500" />}
                    <ChevronRight className={`h-4 w-4 text-white/10 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
            </div>

            {/* ROW 2: HP, AC, SPEED */}
            <div className="flex items-center gap-6 relative z-10">
                {/* HP UNIT */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                            <Heart className={`h-3 w-3 ${hpColor} fill-current`} />
                            <span className="text-[14px] font-black text-white tabular-nums leading-none">
                                {combatant.currentHP} <span className="text-white/30 text-[10px]">/ {combatant.maxHP}</span>
                            </span>
                        </div>
                        {combatant.tempHP > 0 && (
                            <span className="text-[10px] font-bold text-amber-400">+{combatant.tempHP} THP</span>
                        )}
                    </div>
                    {/* HP BAR */}
                    <div className="relative w-full h-2 rounded-full bg-white/[0.03] overflow-hidden border border-white/5 shadow-inner">
                        <motion.div 
                            className="h-full relative z-10 rounded-full"
                            style={{ 
                                background: isDead ? '#475569' : (combatant.side === 'Ally' 
                                    ? 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)' 
                                    : 'linear-gradient(90deg, #f43f5e 0%, #be123c 100%)'),
                            }}
                            initial={false}
                            animate={{ width: `${displayHpPercent}%` }}
                            transition={{ type: "spring", stiffness: 60, damping: 20 }}
                        />
                        {combatant.tempHP > 0 && (
                            <motion.div 
                                className="absolute top-0 h-full bg-amber-400/40 z-20"
                                style={{ 
                                    left: `${displayHpPercent}%`,
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${tempHpPercent}%` }}
                            />
                        )}
                    </div>
                </div>

                {/* AC UNIT */}
                <div className="flex flex-col items-center justify-center px-3 border-l border-white/5 h-10 shrink-0">
                    <Shield className="h-3 w-3 text-slate-500 mb-0.5" />
                    <span className="text-sm font-black text-white/90 tabular-nums">{combatant.ac}</span>
                </div>

                {/* SPEED UNIT */}
                <div className="flex flex-col items-center justify-center px-3 border-l border-white/5 h-10 shrink-0">
                    <Footprints className="h-3 w-3 text-slate-500 mb-0.5" />
                    <span className="text-sm font-black text-white/90 tabular-nums">{combatant.speed}ft</span>
                </div>
            </div>

            {/* ROW 3: STATUS INDICATORS */}
            <AnimatePresence>
                {(combatant.conditions?.length > 0 || combatant.status?.length > 0) && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-1.5 pt-1 relative z-10"
                    >
                        {(combatant.conditions || []).map((c, i) => (
                            <div key={`cond-${i}`} className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[8px] font-black text-purple-300 uppercase tracking-widest shadow-sm">
                                {c}
                            </div>
                        ))}
                        {(combatant.status || []).filter(s => s !== 'Normal').map((s, i) => (
                            <div key={`stat-${i}`} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black text-white/40 uppercase tracking-widest shadow-sm">
                                {s}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ROW 4: QUICK ACTIONS (EXPANDABLE) */}
            <AnimatePresence>
                {(isExpanded || isSelected) && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-2 pt-3 border-t border-white/5 relative z-10">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onHpChange?.(combatant.instanceId, 1); }}
                                className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all active:scale-95 group/btn"
                                title="Heal"
                            >
                                <Plus className="h-4 w-4 group-hover/btn:scale-125 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Heal</span>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onHpChange?.(combatant.instanceId, -1); }}
                                className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all active:scale-95 group/btn"
                                title="Damage"
                            >
                                <Minus className="h-4 w-4 group-hover/btn:scale-125 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Dmg</span>
                            </button>
                            
                            {isDMMode && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSetTarget?.(isSelected ? null : combatant.instanceId); }}
                                    className={`size-10 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${isSelected ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-white/5 border-white/10 text-white/20 hover:text-white/40'}`}
                                >
                                    <Edit3 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CombatantCard;

