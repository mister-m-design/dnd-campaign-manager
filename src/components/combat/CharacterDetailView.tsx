import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, Shield, Zap, Swords, Sparkles, BookOpen, 
    FlaskConical, Footprints, RotateCcw 
} from 'lucide-react';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';
import { Action, CombatantState } from '../../types';
import { STD_ACTIONS, getCondColor } from '../../utils/combatUtils';

interface CharacterDetailViewProps {
    focus: any;
    activeCombatant: CombatantState | null;
    activeId: string | null;
    selectedCombatant: CombatantState | null;
    selectedId: string | null;
    targetId: string | null;
    combatants: CombatantState[];
    actionTab: string;
    setActionTab: (tab: any) => void;
    setTargetId: (id: string | null) => void;
    setSelectedId: (id: string | null) => void;
    handleAction: (subject: CombatantState, action: Action) => void;

    handleStdAction: (action: any) => void;
    updateCombatant: (id: string, updates: any) => void;
    consumeResources: (attacker: CombatantState, action: Action) => void;
    addLog: (msg: string, type?: any) => void;
    updatePortrait: (id: string) => void;
    isSidebar?: boolean;
    isDMMode?: boolean;
    dmChangeLevel?: (id: string, delta: number) => void;
}

export function CharacterDetailView({
    activeCombatant, activeId, selectedCombatant,
    actionTab, setActionTab, updateCombatant,
    handleAction, handleStdAction, updatePortrait,
    isDMMode, isSidebar,
}: CharacterDetailViewProps) {
    const subject = selectedCombatant || activeCombatant;
    
    if (!subject) {
        return (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center opacity-30">
                <Heart className="w-12 h-12 text-slate-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Select a combatant to view details</p>
            </div>
        );
    }

    const hpPct = Math.max(0, Math.min(100, (subject.currentHP / subject.maxHP) * 100));
    const isActive = subject.instanceId === activeId;
    const actionUsed = subject.resources?.actionUsed;
    const bonusUsed = subject.resources?.bonusActionUsed;
    const movRemaining = subject.resources?.movementRemaining ?? (subject.speed || 30);
    const movMax = subject.speed || 30;

    const allActions: Action[] = [...(subject.actions ?? []), ...(subject.tempActions ?? [])];
    const classActions = allActions.filter((a: any) => a.source === 'Class' || a.source === 'Form');
    const spellActions = allActions.filter((a: any) => a.actionType === 'Spell' || a.type === 'Spell');
    const weaponActions = allActions.filter((a: any) => a.actionType === 'Attack' && a.type !== 'Spell');

    return (
        <div className="flex-1 flex flex-col bg-[#0D0D0F] overflow-hidden">
            {/* ── TOP: IDENTITY & VITALS ── */}
            <div className={`shrink-0 border-b border-white/5 bg-gradient-to-b from-slate-900/50 to-[#0D0D0F] ${isSidebar ? 'p-3' : 'p-6'}`}>
                {/* ── SIDEBAR: compact layout ── */}
                {isSidebar ? (
                    <div className="flex flex-col gap-2">
                        {/* Row 1: portrait + name/class */}
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl border border-white/10 overflow-hidden relative group shrink-0 shadow-lg">
                                {subject.portrait ? (
                                    <ImageWithPlaceholder src={subject.portrait} alt={subject.name} name={subject.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xl font-black text-white/30 uppercase">
                                        {subject.name?.[0]}
                                    </div>
                                )}
                                <button onClick={() => updatePortrait(subject.instanceId)} className="absolute inset-0 bg-black/50 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                                    <span className="material-symbols-outlined text-[12px]">photo_camera</span>
                                </button>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                    <h2 className="text-sm font-black uppercase text-white tracking-tight leading-none truncate">{subject.name}</h2>
                                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border shrink-0 ${subject.side === 'Ally' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                        {subject.side}
                                    </span>
                                    {isActive && <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[7px] font-black uppercase shrink-0">Active</span>}
                                </div>
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{subject.subclass && `${subject.subclass} · `}{subject.class} · Lvl {subject.level}</p>
                            </div>
                        </div>
                        {/* Row 2: HP bar */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-baseline gap-1">
                                    {isDMMode ? (
                                        <div className="flex items-baseline gap-1">
                                            <input type="number" defaultValue={subject.currentHP}
                                                onBlur={e => updateCombatant(subject.instanceId, { currentHP: parseInt(e.target.value) || 0 })}
                                                className={`w-12 bg-transparent text-xl font-black tabular-nums text-center focus:outline-none ${hpPct < 25 ? 'text-rose-500' : 'text-white'}`} />
                                            <span className="text-sm font-bold text-slate-500">/</span>
                                            <input type="number" defaultValue={subject.maxHP}
                                                onBlur={e => updateCombatant(subject.instanceId, { maxHP: parseInt(e.target.value) || 0 })}
                                                className="w-12 bg-transparent text-sm font-bold text-slate-500 text-center focus:outline-none" />
                                        </div>
                                    ) : (
                                        <>
                                            <span className={`text-xl font-black tabular-nums ${hpPct < 25 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>{subject.currentHP}</span>
                                            <span className="text-sm font-bold text-slate-500">/ {subject.maxHP}</span>
                                        </>
                                    )}
                                </div>
                                <span className={`text-[8px] font-black uppercase ${hpPct > 50 ? 'text-emerald-400' : hpPct > 25 ? 'text-amber-400' : 'text-rose-500'}`}>
                                    {hpPct === 100 ? 'Pristine' : hpPct > 50 ? 'Stable' : hpPct > 25 ? 'Wounded' : 'Critical'}
                                </span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div className={`h-full rounded-full ${hpPct > 50 ? 'bg-emerald-500' : hpPct > 25 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    initial={{ width: 0 }} animate={{ width: `${hpPct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                            </div>
                        </div>
                        {/* Row 3: AC / INIT / SPEED inline */}
                        <div className="grid grid-cols-3 gap-1.5">
                            {[
                                { label: 'AC', icon: <Shield className="w-2 h-2 text-amber-500/70" />, val: subject.ac, key: 'ac', color: 'amber' },
                                { label: 'Init', icon: <Zap className="w-2 h-2 text-emerald-500/70" />, val: subject.initiative ?? '--', key: 'initiative', color: 'emerald' },
                                { label: 'Speed', icon: <Footprints className="w-2 h-2 text-cyan-500/70" />, val: subject.speed || 30, key: 'speed', color: 'cyan' },
                            ].map(stat => (
                                <div key={stat.label} className="bg-white/[0.03] border border-white/8 rounded-lg p-1.5 flex flex-col items-center gap-0.5">
                                    <span className="text-[6px] font-black uppercase text-slate-500 tracking-wider">{stat.label}</span>
                                    <div className="flex items-center gap-0.5">
                                        {stat.icon}
                                        {isDMMode ? (
                                            <input type="number" defaultValue={typeof stat.val === 'number' ? stat.val : 0}
                                                onBlur={e => updateCombatant(subject.instanceId, { [stat.key]: parseInt(e.target.value) || 0 })}
                                                className="w-8 bg-transparent text-sm font-black text-white text-center focus:outline-none" />
                                        ) : (
                                            <span className="text-sm font-black text-white">{stat.val}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ── FULL: wide layout ── */
                    <>
                    <div className="flex gap-8 items-start">
                        {/* Portrait Card */}
                        <div className="w-32 h-32 rounded-2xl border-2 border-white/5 overflow-hidden relative group shrink-0 shadow-2xl">
                            {subject.portrait ? (
                                <ImageWithPlaceholder src={subject.portrait} alt={subject.name} name={subject.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-4xl font-black text-white/10 uppercase">
                                    {subject.name?.[0]}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <button onClick={() => updatePortrait(subject.instanceId)} className="absolute bottom-2 right-2 size-7 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-white">
                                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col min-w-0">
                            {/* Header Info */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                        <h1 className="text-4xl font-black uppercase text-white tracking-tight leading-none truncate">{subject.name}</h1>
                                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${subject.side === 'Ally' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                            {subject.side}
                                        </div>
                                        {isActive && <div className="px-2 py-0.5 rounded-md bg-amber-500 text-black text-[8px] font-black uppercase tracking-widest animate-pulse">Current Turn</div>}
                                    </div>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none drop-shadow-sm">
                                        {subject.subclass && `${subject.subclass} · `}{subject.class} · Lvl {subject.level}
                                    </p>
                                </div>

                            {/* Essential Vitals (AC & Init) */}
                            <div className="flex gap-3 shrink-0">
                            <div className="flex gap-2 shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center gap-0.5 shadow-lg ring-1 ring-white/5 group/stat relative">
                                    <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider">AC</span>
                                    <div className="flex items-center gap-1">
                                        <Shield className="w-2.5 h-2.5 text-amber-500/70" />
                                        {isDMMode ? (
                                            <input type="number" defaultValue={subject.ac}
                                                onBlur={(e) => updateCombatant(subject.instanceId, { ac: parseInt(e.target.value) || 0 })}
                                                className="w-10 bg-transparent text-xl font-black text-white tabular-nums text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50 rounded-md" />
                                        ) : (
                                            <span className="text-xl font-black text-white tabular-nums">{subject.ac}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center gap-0.5 shadow-lg ring-1 ring-white/5 group/stat relative">
                                    <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider">INIT</span>
                                    <div className="flex items-center gap-1">
                                        <Zap className="w-2.5 h-2.5 text-emerald-500/70" />
                                        {isDMMode ? (
                                            <input type="number" defaultValue={subject.initiative || 0}
                                                onBlur={(e) => updateCombatant(subject.instanceId, { initiative: parseInt(e.target.value) || 0 })}
                                                className="w-10 bg-transparent text-xl font-black text-white tabular-nums text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded-md" />
                                        ) : (
                                            <span className="text-xl font-black text-white tabular-nums">{subject.initiative !== undefined ? subject.initiative : '--'}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center gap-0.5 shadow-lg ring-1 ring-white/5 group/stat relative">
                                    <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider">SPEED</span>
                                    <div className="flex items-center gap-1">
                                        <Footprints className="w-2.5 h-2.5 text-cyan-500/70" />
                                        {isDMMode ? (
                                            <input type="number" defaultValue={subject.speed || 0}
                                                onBlur={(e) => updateCombatant(subject.instanceId, { speed: parseInt(e.target.value) || 0 })}
                                                className="w-10 bg-transparent text-xl font-black text-white tabular-nums text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded-md" />
                                        ) : (
                                            <span className="text-xl font-black text-white tabular-nums">{subject.speed || 30}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            </div>
                            </div>
                        </div>

                        {/* Large HP Bar Section */}
                        <div className="space-y-3">
                            <div className="flex items-end justify-between px-0.5">
                                <div className="flex items-baseline gap-2">
                                    {isDMMode ? (
                                        <div className="flex items-baseline gap-1">
                                            <input 
                                                type="number" 
                                                defaultValue={subject.currentHP} 
                                                onBlur={(e) => updateCombatant(subject.instanceId, { currentHP: parseInt(e.target.value) || 0 })}
                                                className={`w-28 bg-transparent text-4xl font-black tracking-tighter tabular-nums ${hpPct < 25 ? 'text-rose-500' : 'text-white'} focus:outline-none`}
                                            />
                                            <span className="text-lg font-bold text-slate-500 tracking-tight">/</span>
                                            <input 
                                                type="number" 
                                                defaultValue={subject.maxHP} 
                                                onBlur={(e) => updateCombatant(subject.instanceId, { maxHP: parseInt(e.target.value) || 0 })}
                                                className="w-20 bg-transparent text-lg font-bold text-slate-500 tracking-tight focus:outline-none"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <span className={`text-4xl font-black tracking-tighter tabular-nums ${hpPct < 25 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                                                {subject.currentHP}
                                            </span>
                                            <span className="text-lg font-bold text-slate-500 tracking-tight">/ {subject.maxHP}</span>
                                        </>
                                    )}
                                    {subject.tempHP > 0 && (
                                        <div className="ml-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-1">
                                            {isDMMode && <span className="text-[7px] text-cyan-600 font-bold uppercase">Tmp</span>}
                                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">+{subject.tempHP}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Stability Status</span>
                                    <div className="flex items-center gap-1.5">
                                        {hpPct === 100 ? <span className="text-[8px] font-black uppercase text-emerald-400">Pristine</span> : hpPct > 50 ? <span className="text-[8px] font-black uppercase text-slate-400">Stable</span> : hpPct > 25 ? <span className="text-[8px] font-black uppercase text-amber-400">Wounded</span> : <span className="text-[8px] font-black uppercase text-rose-500">Critical</span>}
                                        <div className={`size-1.5 rounded-full ${hpPct > 50 ? 'bg-emerald-500' : hpPct > 25 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'}`} />
                                    </div>
                                </div>
                            </div>
                            <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner relative group">
                                <motion.div 
                                    className={`h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] ${hpPct > 50 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : hpPct > 25 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-700 to-rose-500'}`} 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${hpPct}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">{subject.currentHP} / {subject.maxHP} HP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
                )}
            </div>

            {/* ── MIDDLE: ACTIONS ── */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Control Bar: Actions Used & Tabs */}
                <div className="px-8 py-4 bg-slate-900/30 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest">Resources</span>
                            <div className="flex items-center gap-2">
                                {[
                                    { label: 'Action', key: 'actionUsed', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                    { label: 'Bonus', key: 'bonusActionUsed', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                                    { label: 'React', key: 'reactionUsed', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                ].map(res => (
                                    <button
                                        key={res.key}
                                        onClick={() => updateCombatant(subject.instanceId, { resources: { ...subject.resources, [res.key]: !subject.resources?.[res.key as keyof typeof subject.resources] } })}
                                        className={`px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${
                                            subject.resources?.[res.key as keyof typeof subject.resources] 
                                            ? 'bg-slate-900 border-slate-800 text-slate-600 grayscale' 
                                            : `${res.bg} border-white/5 ${res.color} shadow-sm active:scale-95`
                                        }`}
                                    >
                                        {res.label}{subject.resources?.[res.key as keyof typeof subject.resources] ? ' (Used)' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 items-end">
                        <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest text-right">Action Categories</span>
                        <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/5">
                            {[
                                { key: 'standard', icon: 'swords', label: 'Main' },
                                { key: 'class', icon: 'auto_awesome', label: 'Feats' },
                                { key: 'spells', icon: 'magic_button', label: 'Spells' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActionTab(tab.key)}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                        actionTab === tab.key ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sub-header for Action Economy Hints */}
                {isActive && (
                    <div className="px-8 py-2 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-4">
                        <span className="text-[8px] font-bold text-amber-500/60 uppercase tracking-widest">Ready to Act:</span>
                        <div className="flex items-center gap-3">
                            <span className={`text-[8px] font-black uppercase ${!actionUsed ? 'text-emerald-400' : 'text-slate-600 line-through'}`}>Main Action</span>
                            <span className="text-slate-700">·</span>
                            <span className={`text-[8px] font-black uppercase ${!bonusUsed ? 'text-amber-400' : 'text-slate-600 line-through'}`}>Bonus Action</span>
                        </div>
                    </div>
                )}

                {/* Scrolled Action Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={actionTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            className="grid grid-cols-1 gap-4"
                        >
                            {actionTab === 'standard' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {weaponActions.map((action: any) => {
                                            const disabledReason = !isActive ? 'Not Your Turn' : actionUsed ? 'Action Already Used' : null;
                                            return (
                                                <button
                                                    key={action.id}
                                                    onClick={() => isActive && handleAction(subject, action)}
                                                    disabled={!!disabledReason}
                                                    className="group text-left p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] hover:border-amber-500/40 transition-all shadow-xl disabled:opacity-30 disabled:hover:border-white/10 relative overflow-hidden"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Swords className="w-3 h-3 text-amber-500/70" />
                                                                <span className="text-xs font-black uppercase text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight">{action.name}</span>
                                                            </div>
                                                            <div className="flex gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{action.damageDice}</span>
                                                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{action.damageType}</span>
                                                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{action.range}ft</span>
                                                            </div>
                                                        </div>
                                                        <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black tabular-nums text-sm group-hover:bg-amber-500 group-hover:text-black transition-all">
                                                            +{action.attackBonus || 0}
                                                        </div>
                                                    </div>
                                                    {disabledReason && (
                                                        <div className="flex items-center gap-1 mt-3 py-1.5 px-3 rounded-lg bg-black/40 text-rose-400 border border-rose-500/20">
                                                            <span className="material-symbols-outlined text-[12px]">block</span>
                                                            <span className="text-[8px] font-black uppercase tracking-widest">{disabledReason}</span>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="pt-8 border-t border-white/5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Universal Tactics</span>
                                            <div className="flex-1 h-px bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {STD_ACTIONS.filter((a: any) => a.id !== 'std-attack').map((action: any) => (
                                                <button
                                                    key={action.id}
                                                    onClick={() => isActive && handleStdAction(action)}
                                                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.05] hover:border-amber-500/20 transition-all group"
                                                >
                                                    <span className="material-symbols-outlined text-slate-600 group-hover:text-amber-400 transition-colors text-[24px]">{action.icon}</span>
                                                    <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-white transition-colors tracking-tight">{action.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {actionTab === 'class' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {classActions.length > 0 ? classActions.map((action: any) => (
                                        <button
                                            key={action.id}
                                            onClick={() => isActive && handleAction(subject, action)}
                                            className="w-full p-6 p-5 rounded-2xl bg-purple-500/[0.02] border border-purple-500/10 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all text-left group shadow-xl"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-3.5 h-3.5 text-purple-400/70" />
                                                    <span className="text-xs font-black uppercase text-white group-hover:text-purple-300 transition-colors">{action.name}</span>
                                                </div>
                                                <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">{action.type}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium line-clamp-2 italic">{action.description}</p>
                                        </button>
                                    )) : (
                                        <div className="col-span-2 py-20 text-center opacity-20">
                                            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No special features listed</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {actionTab === 'spells' && (
                                <div className="space-y-6">
                                    {subject.resources?.spellSlots && (
                                        <div className="flex flex-wrap gap-2 pb-2">
                                            {Object.entries(subject.resources.spellSlots || {}).map(([lvl, slots]: any) => (
                                                <div key={lvl} className="px-4 py-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-4 min-w-[100px] shadow-lg">
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black uppercase text-blue-400 tracking-widest leading-none mb-1">Casting Lvl</span>
                                                        <span className="text-sm font-black text-white">{lvl}</span>
                                                    </div>
                                                    <div className="w-px h-6 bg-blue-500/20" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Slots</span>
                                                        <span className="text-sm font-black text-white">{slots.current}/{slots.max}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {spellActions.map((spell: any) => (
                                            <button
                                                key={spell.id}
                                                onClick={() => isActive && handleAction(subject, spell)}
                                                className="w-full p-6 p-5 rounded-2xl bg-blue-500/[0.02] border border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all text-left group shadow-xl"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <FlaskConical className="w-3.5 h-3.5 text-blue-400/70" />
                                                        <span className="text-xs font-black uppercase text-white group-hover:text-blue-300 transition-colors">{spell.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Lvl {spell.level || 'C'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                    {spell.damageDice && <span>{spell.damageDice} {spell.damageType}</span>}
                                                    <span>Range: {spell.range || 'Self'}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* ── BOTTOM: STATS & MOVEMENT ── */}
            <div className="shrink-0 px-8 py-6 bg-black/80 border-t border-white/5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Ability Scores Block */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Core Attributes</span>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                            {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(stat => {
                                const score = (subject.abilityScores as any)?.[stat] || 10;
                                const mod = Math.floor((score - 10) / 2);
                                return (
                                    <div key={stat} className="flex flex-col items-center p-2 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] transition-all shadow-lg ring-1 ring-white/5">
                                        <span className="text-[7px] font-black uppercase text-slate-600 group-hover:text-slate-400 tracking-tighter mb-0.5">{stat}</span>
                                        {isDMMode ? (
                                            <input 
                                                type="number" 
                                                defaultValue={score} 
                                                onBlur={(e) => updateCombatant(subject.instanceId, { abilityScores: { ...(subject.abilityScores || {}), [stat]: parseInt(e.target.value) || 0 } })}
                                                className="w-full bg-transparent text-lg font-black text-white tabular-nums text-center focus:outline-none"
                                            />
                                        ) : (
                                            <span className="text-lg font-black text-white tracking-tighter leading-none mb-0.5">{score}</span>
                                        )}
                                        <div className={`px-1 py-0.5 rounded-md text-[8px] font-black ${mod >= 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {mod >= 0 ? `+${mod}` : mod}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Movement & Conditions Block */}
                    <div className="space-y-6">
                        {/* Movement */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Footprints className="w-4 h-4 text-cyan-400/70" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Movement Potential</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className={`text-2xl font-black tabular-nums ${movRemaining <= 0 ? 'text-rose-500' : 'text-white'}`}>{movRemaining}</span>
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">/ {movMax}ft</span>
                                </div>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner relative">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                                    animate={{ width: `${(movRemaining / movMax) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-700">
                                <span>Spent: {movMax - movRemaining}ft</span>
                                <button onClick={() => updateCombatant(subject.instanceId, { resources: { ...subject.resources, movementSpent: 0, movementRemaining: movMax } })} className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                                    <RotateCcw className="w-2.5 h-2.5" /> Reset Path
                                </button>
                            </div>
                        </div>

                        {/* Conditions List */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Active Effects</span>
                                <div className="flex-1 h-px bg-white/5" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {subject.conditions?.length > 0 ? (
                                    subject.conditions.filter((c: any) => !['Advantage','Disadvantage'].includes(c)).map((cond: string) => {
                                        const cfg = getCondColor(cond);
                                        return (
                                            <div key={cond} className="px-3 py-1.5 rounded-xl border flex items-center gap-2.5 backdrop-blur-md shadow-lg"
                                                style={{ backgroundColor: cfg.bg, borderColor: cfg.color + '40', color: cfg.color }}>
                                                <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest">{cond}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-800 italic">No Active Conditions</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
