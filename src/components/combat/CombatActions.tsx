'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Zap, FlaskConical, Sparkles, Target, Footprints } from 'lucide-react';
import type { CombatantState, Action } from '@/types';

interface CombatActionsProps {
    activeCombatant: CombatantState | null;
    onAction: (combatant: CombatantState, action: Action) => void;
    onDash?: (combatantId: string) => void;
    onMove?: () => void;
    combatPhase?: string;
    disabled?: boolean;
}

export default function CombatActions({ activeCombatant, onAction, onDash, onMove, combatPhase, disabled }: CombatActionsProps) {
    if (!activeCombatant) return null;

    const allActions = [...(activeCombatant.actions || []), ...(activeCombatant.tempActions || [])];
    const weaponActions = allActions.filter(a => a.actionType === 'Attack');
    const spellActions = allActions.filter(a => a.actionType === 'Spell');
    const utilityActions = allActions.filter(a => a.actionType !== 'Attack' && a.actionType !== 'Spell');

    const actionUsed = activeCombatant.resources?.actionUsed;
    const movementRemaining = activeCombatant.resources?.movementRemaining ?? (
        (activeCombatant.resources?.movementMax ?? 0) - (activeCombatant.resources?.movementSpent ?? 0)
    );
    const isMoving = combatPhase === 'move_preview';

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: isMoving ? 0.35 : 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 transition-all max-w-[90%] ${isMoving ? 'pointer-events-none' : ''}`}
        >
            {/* Active Label */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0a0c] border border-amber-500/30">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500">
                    {activeCombatant.name}'s Turn
                </span>
                {isMoving && (
                    <>
                        <span className="text-slate-600">·</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400">Move Mode</span>
                    </>
                )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-[#060608] border border-white/10 shadow-2xl ring-1 ring-white/5 overflow-x-auto scrollbar-hide" style={{ backdropFilter: 'none', maxWidth: '100%' }}>
                {/* Move Button */}
                {onMove && (
                    <div className="flex items-center gap-1 px-1 border-r border-white/5">
                        <button
                            onClick={onMove}
                            disabled={disabled || movementRemaining <= 0}
                            className={`
                                min-h-[44px] px-3 sm:px-4 flex items-center gap-2 rounded-xl border transition-all duration-300 disabled:opacity-30 disabled:grayscale
                                ${isMoving
                                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40'
                                }
                                hover:scale-105 active:scale-95 group
                            `}
                        >
                            <div className="shrink-0 group-hover:scale-110 transition-transform">
                                <Footprints className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[11px] font-black uppercase tracking-tight">Move</span>
                                <span className="text-[9px] opacity-70 font-medium tabular-nums">{movementRemaining}ft</span>
                            </div>
                        </button>
                    </div>
                )}

                {/* Attack Group */}
                {weaponActions.length > 0 && (
                    <div className="flex items-center gap-1 px-1 border-r border-white/5">
                        {weaponActions.map(action => (
                            <ActionButton
                                key={action.id}
                                action={action}
                                icon={<Swords className="w-3.5 h-3.5" />}
                                onClick={() => onAction(activeCombatant, action)}
                                disabled={disabled || actionUsed}
                            />
                        ))}
                    </div>
                )}

                {/* Spell Group */}
                {spellActions.length > 0 && (
                    <div className="flex items-center gap-1 px-1 border-r border-white/5">
                        {spellActions.map(action => (
                            <ActionButton
                                key={action.id}
                                action={action}
                                icon={<Sparkles className="w-3.5 h-3.5" />}
                                onClick={() => onAction(activeCombatant, action)}
                                disabled={disabled || actionUsed}
                                variant="purple"
                            />
                        ))}
                    </div>
                )}

                {/* Utility Group */}
                <div className="flex items-center gap-1 px-1">
                    <ActionButton
                        action={{ id: 'dash', name: 'Dash', type: 'Action', description: 'Double your movement for the turn.' }}
                        icon={<Zap className="w-3.5 h-3.5" />}
                        onClick={() => onDash?.(activeCombatant.instanceId)}
                        disabled={disabled || actionUsed}
                        variant="slate"
                    />
                    {utilityActions.map(action => (
                        <ActionButton
                            key={action.id}
                            action={action}
                            icon={<Zap className="w-3.5 h-3.5" />}
                            onClick={() => onAction(activeCombatant, action)}
                            disabled={disabled || actionUsed}
                            variant="slate"
                        />
                    ))}
                </div>
            </div>

            {/* Turn Summary Hint */}
            {actionUsed && (
                <p className="text-[9px] font-medium text-slate-500 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    Action used this turn
                </p>
            )}
        </motion.div>
    );
}

function ActionButton({
    action,
    icon,
    onClick,
    disabled,
    variant = 'amber'
}: {
    action: Action;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'amber' | 'purple' | 'slate';
}) {
    const colors = {
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40',
        slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20 hover:border-slate-500/40'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                min-h-[44px] px-3 sm:px-4 flex items-center gap-2 rounded-xl border transition-all duration-300 disabled:opacity-30 disabled:grayscale
                ${colors[variant]}
                hover:scale-105 active:scale-95 group
            `}
        >
            <div className="shrink-0 group-hover:rotate-12 transition-transform">{icon}</div>
            <div className="flex flex-col items-start leading-none">
                <span className="text-[11px] font-black uppercase tracking-tight">{action.name}</span>
                {action.damageDice && (
                    <span className="text-[9px] opacity-60 font-medium tabular-nums">{action.damageDice}</span>
                )}
            </div>
        </button>
    );
}
