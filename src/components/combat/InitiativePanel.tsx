import React from 'react';
import { Zap, ChevronRight, X } from 'lucide-react';
import { CombatantState, Action, ConditionType } from '@/types';
import CombatantCard from './CombatantCard';

interface InitiativePanelProps {
    sortedCombatants: CombatantState[];
    activeId: string | null;
    selectedId: string | null;
    targetId: string | null;
    isDMMode: boolean;
    activeMobileTab: 'initiative' | 'map' | 'journal' | 'stats';
    viewMode: 'character' | 'battlemap' | 'encounter' | 'theatre';
    sidebarsVisible: boolean;
    onSelect: (id: string) => void;
    onAction: (attacker: CombatantState, action: Action, targetOverride?: CombatantState) => void;
    onHpChange: (id: string, amount: number) => void;
    onConditionToggle: (id: string, condition: ConditionType) => void;
    onSetTarget: (id: string | null) => void;
    onEditInitiative: (id: string, val: number) => void;
    onEndTurn: () => void;
    onResetCombat: () => void;
    onLongRest: () => void;
}

export const InitiativePanel: React.FC<InitiativePanelProps> = ({
    sortedCombatants,
    activeId,
    selectedId,
    targetId,
    isDMMode,
    activeMobileTab,
    viewMode,
    sidebarsVisible,
    onSelect,
    onAction,
    onHpChange,
    onConditionToggle,
    onSetTarget,
    onEditInitiative,
    onEndTurn,
    onResetCombat,
    onLongRest,
}) => {
    const activeIndex = sortedCombatants.findIndex(c => c.instanceId === activeId);
    const nextId = activeIndex !== -1 ? sortedCombatants[(activeIndex + 1) % sortedCombatants.length].instanceId : null;

    return (
        <aside className={`w-full shrink-0 border-r border-white/5 flex flex-col bg-[#0A0A0C] transition-all duration-300 ${activeMobileTab === 'initiative' ? 'flex fixed inset-0 z-[60] pt-14 pb-20' : (viewMode === 'battlemap' && !sidebarsVisible ? 'hidden' : 'hidden lg:flex')} lg:relative lg:inset-auto lg:z-auto lg:pt-0 lg:pb-0 overflow-hidden`}>
            <div className="px-5 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Initiative</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-5 rounded-full bg-amber-500/20 text-amber-400 text-[8px] font-black flex items-center justify-center">{sortedCombatants.length}</span>
                    <button onClick={onLongRest} className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[7px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all">Rest</button>
                </div>
            </div>

            {/* End Turn button */}
            {activeId && (
                <div className="px-4 pb-3 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); onEndTurn(); }} className="w-full py-3.5 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_25px_rgba(245,158,11,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
                        End Turn <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Combatant list */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3 scrollbar-hide">
                {sortedCombatants.map((c) => (
                    <CombatantCard
                        key={c.instanceId}
                        combatant={c}
                        isActive={c.instanceId === activeId}
                        isNext={c.instanceId === nextId}
                        isSelected={c.instanceId === selectedId}
                        isDMMode={isDMMode}
                        isTargeted={c.instanceId === targetId}
                        onSelect={(id) => onSelect(id)}
                        onAction={onAction}
                        onHpChange={onHpChange}
                        onConditionToggle={onConditionToggle}
                        onSetTarget={onSetTarget}
                        onEditInitiative={onEditInitiative}
                    />
                ))}
            </div>

            {/* Reset */}
            <div className="px-3 pb-4 shrink-0">
                <button onClick={onResetCombat} className="w-full py-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-700 hover:text-red-500 hover:bg-red-500/5 border border-white/5 hover:border-red-500/20 transition-all flex items-center justify-center gap-1.5">
                    <X className="w-3 h-3" />Reset Combat
                </button>
            </div>
        </aside>
    );
};

export default InitiativePanel;
