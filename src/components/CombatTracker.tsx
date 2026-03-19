"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';
import { DiceEngine, RollResult } from '@/lib/dice';
import { DiceWidget } from '@/components/ui/DiceWidget';
import monstersData from '@/data/monsters.json';
import spellsData from '@/data/spells.json';
import abilitiesData from '@/data/abilities.json';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Action {
    id: string;
    name: string;
    description: string;
    damageRoll?: string;
    average?: number;
    range?: string;
    type: 'Attack' | 'Spell' | 'Ability';
}

interface EncounterEvent {
    id: string;
    timestamp: string;
    message: string;
    type: 'damage' | 'heal' | 'info' | 'critical' | 'system';
}

interface Combatant {
    id: string;
    name: string;
    initiative: number;
    hp: number;
    maxHp: number;
    ac: number;
    type: 'Player' | 'Monster' | 'NPC';
    status: string[];
    actions: Action[];
    imageUrl?: string;
    speed: number;
    movementRemaining: number;
    side: 'Ally' | 'Enemy' | 'Neutral';
}

interface Encounter {
    id: string;
    name: string;
    campaignId: string | null;
    combatants: Combatant[];
    round: number;
    turnIndex: number;
    log: EncounterEvent[];
    lastUpdated: string;
}

export default function CombatTracker() {
    const [combatants, setCombatants] = usePersistentState<Combatant[]>('mythic_combatants', []);
    const [savedChars] = usePersistentState<any[]>('mythic_saved_characters', []);
    const [campaigns] = usePersistentState<any[]>('mythic_campaigns', []);
    const [savedEncounters, setSavedEncounters] = usePersistentState<Encounter[]>('mythic_saved_encounters', []);
    const [customNpcs] = usePersistentState<any[]>('mythic_custom_npcs', []);
    const [campaignId, setCampaignId] = usePersistentState<string | null>('mythic_combat_campaign_id', null);
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [turnIndex, setTurnIndex] = usePersistentState('mythic_combat_turn', 0);
    const [round, setRound] = usePersistentState('mythic_combat_round', 1);
    const [combatLog, setCombatLog] = usePersistentState<EncounterEvent[]>('mythic_combat_log', []);
    const [selectedAction, setSelectedAction] = useState<Action | null>(null);
    const [targetIds, setTargetIds] = useState<string[]>([]);
    const [isManualRoll, setIsManualRoll] = useState(false);
    const [manualResult, setManualResult] = useState<string>('');
    const [combatRollResult, setCombatRollResult] = useState<RollResult | null>(null);
    const [combatAdvMode, setCombatAdvMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();

    const rollCombatDamage = () => {
        if (!selectedAction?.damageRoll) return;
        const base = selectedAction.damageRoll;
        const notation = combatAdvMode === 'normal' ? base
            : base + (combatAdvMode === 'advantage' ? 'adv' : 'dis');
        const result = DiceEngine.roll(notation);
        setCombatRollResult(result);
        setIsManualRoll(false);
        setManualResult('');
    };

    const handleSaveEncounter = () => {
        const encounterName = prompt("Enter a name for this encounter:", `Encounter ${new Date().toLocaleDateString()}`);
        if (!encounterName) return;

        const newEncounter: Encounter = {
            id: crypto.randomUUID(),
            name: encounterName,
            campaignId,
            combatants,
            round,
            turnIndex,
            log: combatLog,
            lastUpdated: new Date().toISOString()
        };

        setSavedEncounters(prev => [...prev, newEncounter]);
        addLog(`Encounter "${encounterName}" saved to library.`, 'system');
    };

    // Auto-load party if campaignId is present in URL
    useEffect(() => {
        const urlId = searchParams.get('campaignId');
        if (urlId && urlId !== campaignId) {
            setCampaignId(urlId);

            // Find campaign and its party members
            const campaign = campaigns.find(c => c.id === urlId);
            if (campaign && campaign.partyIds) {
                const newCombatants: Combatant[] = [];
                campaign.partyIds.forEach((pId: string) => {
                    const hero = savedChars.find(c => c.id === pId);
                    if (hero && !combatants.some(cn => cn.id === hero.id)) {
                        newCombatants.push({
                            id: hero.id,
                            name: hero.name,
                            maxHp: hero.maxHp || (10 + Math.floor(((hero.stats?.CON || 10) - 10) / 2)),
                            hp: hero.hp || hero.maxHp || (10 + Math.floor(((hero.stats?.CON || 10) - 10) / 2)),
                            ac: hero.ac || (10 + Math.floor(((hero.stats?.DEX || 10) - 10) / 2)),
                            initiative: 0,
                            type: 'Player',
                            status: [],
                            actions: hero.actions || [],
                            speed: 30,
                            movementRemaining: 30,
                            side: 'Ally'
                        });
                    }
                });

                if (newCombatants.length > 0) {
                    setCombatants(prev => [...prev, ...newCombatants]);

                    // Add log entry
                    addLog(`Active party from "${campaign.name}" has entered the battlefield.`, 'system');
                }
            }
        }
    }, [searchParams, campaignId, campaigns, savedChars, combatants, setCampaignId, setCombatants]);

    // Auto-load saved encounter if encounterId is present
    useEffect(() => {
        const encounterIdParam = searchParams.get('encounterId');
        if (encounterIdParam) {
            const saved = savedEncounters.find(e => e.id === encounterIdParam);
            if (saved) {
                setCombatants(saved.combatants);
                setRound(saved.round);
                setTurnIndex(saved.turnIndex);
                setCombatLog(saved.log);
                setCampaignId(saved.campaignId);
                addLog(`Restored encounter "${saved.name}" from library.`, 'system');

                // Remove the param from URL without reloading if possible, but for now just clear and set
                // In a real app we might use router.replace
            }
        }
    }, [searchParams, savedEncounters, setCombatants, setRound, setTurnIndex, setCombatLog, setCampaignId]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [combatLog]);

    const addLog = (message: string, type: EncounterEvent['type'] = 'info') => {
        const newEvent: EncounterEvent = {
            id: crypto.randomUUID(),
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        };
        setCombatLog(prev => [newEvent, ...prev.slice(0, 49)]);
    };

    const sortedCombatants = useMemo(() => {
        return [...combatants].sort((a, b) => b.initiative - a.initiative);
    }, [combatants]);

    const activeCombatant = sortedCombatants[turnIndex];

    const nextTurn = () => {
        let nextIndex = 0;
        if (turnIndex < sortedCombatants.length - 1) {
            nextIndex = turnIndex + 1;
        } else {
            nextIndex = 0;
            setRound(round + 1);
        }

        // Reset movement for the combatant who just started their turn
        const nextCombatant = sortedCombatants[nextIndex];
        if (nextCombatant) {
            setCombatants(prev => prev.map(c =>
                c.id === nextCombatant.id
                    ? { ...c, movementRemaining: c.speed }
                    : c
            ));
        }

        setTurnIndex(nextIndex);
        setSelectedAction(null);
        setTargetIds([]);
        setCombatRollResult(null);
        setCombatAdvMode('normal');
        setManualResult('');
    };

    const parseActionData = (text: string) => {
        const diceMatch = text.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);
        const avgMatch = text.match(/Hit: (\d+)/i);
        const reachMatch = text.match(/reach (\d+)\s*ft/i);
        const rangeMatch = text.match(/range (\d+(?:\/\d+)?)\s*ft/i);

        return {
            roll: diceMatch ? diceMatch[0].replace(/\s/g, '') : undefined,
            avg: avgMatch ? parseInt(avgMatch[1]) : undefined,
            range: reachMatch ? `Reach ${reachMatch[1]}ft` : (rangeMatch ? `Range ${rangeMatch[1]}ft` : undefined)
        };
    };

    const addMonster = (monsterId: string) => {
        const monster = (monstersData as any[]).find(m => m.id === monsterId) ||
            customNpcs.find(m => m.id === monsterId);

        if (monster) {
            const newId = `monster-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const mActions = (monster.actions || []).map((desc: string, idx: number) => {
                const parsed = parseActionData(desc);
                return {
                    id: `${newId}-action-${idx}`,
                    name: desc.split(':')[0] || 'Attack',
                    description: desc,
                    damageRoll: parsed.roll,
                    average: parsed.avg,
                    range: parsed.range,
                    type: 'Ability' as const
                };
            });

            setCombatants(prev => [...prev, {
                id: newId,
                name: monster.name,
                initiative: Math.floor(Math.random() * 20) + 1 + Math.floor(((monster.stats?.DEX || 10) - 10) / 2),
                hp: monster.hp,
                maxHp: monster.hp,
                ac: monster.ac,
                type: 'Monster',
                status: [],
                actions: mActions,
                imageUrl: monster.visualUrl,
                speed: 30,
                movementRemaining: 30,
                side: 'Enemy'
            }]);
            addLog(`${monster.name} joined the battle!`, 'info');
        }
    };

    const resolveAction = () => {
        if (!selectedAction || targetIds.length === 0) return;

        targetIds.forEach(tId => {
            const target = combatants.find(c => c.id === tId);
            if (!target) return;

            let damage = 0;
            let detail = "";

            if (combatRollResult) {
                damage = combatRollResult.total;
                const advLabel = combatRollResult.type !== 'normal'
                    ? ` [${combatRollResult.type === 'advantage' ? 'ADV' : 'DIS'}]`
                    : '';
                const modStr = combatRollResult.modifier !== 0
                    ? `${combatRollResult.modifier > 0 ? '+' : ''}${combatRollResult.modifier}`
                    : '';
                detail = `(${combatRollResult.notation.replace(/adv$|dis$/i, '')}${advLabel}: ${combatRollResult.rolls.join('+')}${modStr})`;
            } else if (isManualRoll && manualResult) {
                damage = parseInt(manualResult) || 0;
                detail = "(Manual)";
            } else if (selectedAction.damageRoll) {
                const roll = DiceEngine.roll(selectedAction.damageRoll);
                damage = roll.total;
                const modStr = roll.modifier !== 0 ? `${roll.modifier > 0 ? '+' : ''}${roll.modifier}` : '';
                detail = `(${roll.notation}: ${roll.rolls.join('+')}${modStr})`;
            } else if (selectedAction.average) {
                damage = selectedAction.average;
                detail = "(Average)";
            }

            if (activeCombatant) {
                updateHp(tId, -damage);
                addLog(`${activeCombatant.name} uses ${selectedAction.name} on ${target.name} for ${damage} damage ${detail}`, 'damage');
            }
        });

        setSelectedAction(null);
        setTargetIds([]);
        setManualResult('');
        setCombatRollResult(null);
    };

    const deductMovement = (combatantId: string, amount: number) => {
        setCombatants(prev => prev.map(c => {
            if (c.id === combatantId) {
                const currentMovement = typeof c.movementRemaining === 'number' ? c.movementRemaining : (c.speed || 30);
                return { ...c, movementRemaining: Math.max(0, currentMovement - amount) };
            }
            return c;
        }));
    };

    const updateHp = (id: string, delta: number) => {
        setCombatants(prev => prev.map(c =>
            c.id === id ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + delta)) } : c
        ));
    };

    const removeCombatant = (id: string) => {
        setCombatants(prev => {
            const newList = prev.filter(c => c.id !== id);
            if (turnIndex >= newList.length && newList.length > 0) {
                setTurnIndex(newList.length - 1);
            }
            return newList;
        });
    };

    const resetEncounter = () => {
        setShowResetConfirm(true);
    };

    const confirmReset = () => {
        setCombatants([]);
        setTurnIndex(0);
        setRound(1);
        setCombatLog([]);
        setShowResetConfirm(false);
        addLog('Encounter reset by Dungeon Master.', 'info');
    };

    if (combatants.length === 0 && !isSetupOpen) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full" />
                    <div className="size-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative backdrop-blur-xl">
                        <span className="material-symbols-outlined text-5xl text-slate-700">swords</span>
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">Initiative Not Started</h2>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">Roll for initiative! Add players and enemies to track the turn order.</p>
                </div>
                <button
                    onClick={() => setIsSetupOpen(true)}
                    className="bg-primary text-black px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all primary-glow border-t border-white/20"
                >
                    Setup New Encounter
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header / Rounds */}
            <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-6">
                    <div className="text-center bg-primary/10 px-6 py-2 rounded-xl border border-primary/20">
                        <p className="text-[8px] font-black text-primary uppercase">Round</p>
                        <p className="text-2xl font-black text-primary">{round}</p>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-100 uppercase">Active Turn</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">person</span>
                            {activeCombatant?.name || 'Rolling...'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleSaveEncounter} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all">Save State</button>
                    <button onClick={() => setIsSetupOpen(true)} className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Add Combatants</button>
                    <button onClick={resetEncounter} className="border border-red-500/30 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all">Reset</button>
                    {/* Reset Confirmation Modal */}
                    <AnimatePresence>
                        {showResetConfirm && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
                                onClick={() => setShowResetConfirm(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-[#111827] border border-red-500/20 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-red-500">warning</span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-100 uppercase tracking-tight">Reset Encounter</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-6">Clear all combatants and reset the round counter? This action cannot be undone.</p>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => setShowResetConfirm(false)}
                                            className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                        >Cancel</button>
                                        <button
                                            onClick={confirmReset}
                                            className="px-5 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/30 transition-all"
                                        >Reset Battle</button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button onClick={nextTurn} className="bg-primary text-black px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all primary-glow border-t border-white/20">Next Turn</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Initiative List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Battle Order</h3>
                        {selectedAction && (
                            <div className="flex items-center gap-2 animate-pulse">
                                <span className="material-symbols-outlined text-primary text-sm">target</span>
                                <span className="text-[10px] font-black text-primary uppercase">Select Target(s)...</span>
                            </div>
                        )}
                    </div>
                    <AnimatePresence mode="popLayout">
                        {sortedCombatants.map((c, idx) => {
                            const isActive = idx === turnIndex;
                            const isTargeted = targetIds.includes(c.id);
                            return (
                                <motion.div
                                    key={c.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => {
                                        if (selectedAction) {
                                            setTargetIds(prev =>
                                                prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                                            );
                                        }
                                    }}
                                    className={`obsidian-panel rounded-2xl p-4 border transition-all flex items-center gap-4 relative overflow-hidden cursor-pointer ${isActive ? 'border-primary ring-1 ring-primary/30 shadow-[0_0_30px_rgba(254,202,87,0.1)] scale-[1.02]' :
                                        isTargeted ? 'border-red-500 ring-2 ring-red-500/20' :
                                            'border-white/5 opacity-60 hover:opacity-100 hover:border-white/10'
                                        }`}
                                >
                                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                    {isTargeted && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_red]" />
                                    )}

                                    <div className="w-10 text-center">
                                        <p className="text-[8px] font-black text-slate-500 uppercase">Init</p>
                                        <p className="text-lg font-black text-slate-100">{c.initiative}</p>
                                    </div>

                                    <div className="size-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 relative">
                                        <ImageWithPlaceholder
                                            src={c.imageUrl}
                                            alt={c.name}
                                            fill
                                            sizes="48px"
                                            className="object-cover"
                                            fallbackIcon={c.type === 'Player' ? 'person' : 'skull'}
                                        />
                                    </div>

                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-black text-slate-100 uppercase tracking-tight text-sm">{c.name}</h3>
                                            <span className={`text-[7px] px-1.5 py-0.5 rounded font-black uppercase ${c.type === 'Player' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                                                }`}>{c.type}</span>
                                        </div>
                                        {/* HP Bar */}
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative mb-2">
                                            <div
                                                className={`h-full transition-all duration-500 ${(c.hp / c.maxHp) > 0.5 ? 'bg-emerald-500' : (c.hp / c.maxHp) > 0.25 ? 'bg-amber-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                                            />
                                        </div>

                                        {/* Movement Tracking */}
                                        <div className="flex items-center gap-2">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Movement:</p>
                                            <div className="flex-grow h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary/40 transition-all duration-300"
                                                    style={{ width: `${(c.movementRemaining / c.speed) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-300 min-w-[2rem] text-right">{c.movementRemaining}/{c.speed}ft</p>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deductMovement(c.id, 5); }}
                                                    className="size-5 rounded-md bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                                                >
                                                    <span className="text-[8px] font-bold">-5</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deductMovement(c.id, 10); }}
                                                    className="size-5 rounded-md bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                                                >
                                                    <span className="text-[8px] font-bold">-10</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-2 py-1 border border-white/5">
                                            <button onClick={(e) => { e.stopPropagation(); updateHp(c.id, -1); }} className="text-slate-500 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined text-xs">remove</span>
                                            </button>
                                            <div className="text-center min-w-[2.5rem]">
                                                <p className="text-[10px] font-black text-slate-100 leading-tight">{c.hp}</p>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); updateHp(c.id, 1); }} className="text-slate-500 hover:text-emerald-500 transition-colors">
                                                <span className="material-symbols-outlined text-xs">add</span>
                                            </button>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); removeCombatant(c.id); }} className="text-slate-700 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Left Column: Action Panel & Monster List */}
                <div className="space-y-6">
                    {/* Action Panel */}
                    <div className="obsidian-panel rounded-3xl p-6 border border-white/5">
                        <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">bolt</span>
                            Actions: {activeCombatant?.name}
                        </h3>
                        <div className="space-y-2">
                            {activeCombatant?.actions?.length > 0 ? activeCombatant.actions.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => setSelectedAction(selectedAction?.id === action.id ? null : action)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all group ${selectedAction?.id === action.id ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[10px] font-black text-slate-200 uppercase">{action.name}</p>
                                        <div className="text-right">
                                            {action.range && <p className="text-[7px] font-black text-slate-500 uppercase leading-none mb-1">{action.range}</p>}
                                            {action.damageRoll && <span className="text-[8px] font-black text-primary/70">{action.damageRoll}</span>}
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-tight line-clamp-1 group-hover:line-clamp-none">{action.description}</p>
                                </button>
                            )) : (
                                <p className="text-[10px] text-slate-600 italic text-center py-4">No automated actions found.</p>
                            )}

                            {selectedAction && (
                                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                    {/* Action header */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">bolt</span>
                                            {selectedAction.name}
                                        </p>
                                        {selectedAction.damageRoll && (
                                            <span className="text-[9px] font-black font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                                                {selectedAction.damageRoll}
                                            </span>
                                        )}
                                    </div>

                                    {/* ── ADV / NORMAL / DIS toggle ─────────────────────── */}
                                    <div className="space-y-1">
                                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Roll Mode</p>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <button
                                                onClick={() => { setCombatAdvMode('disadvantage'); setCombatRollResult(null); }}
                                                className={`py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                                                    combatAdvMode === 'disadvantage'
                                                        ? 'bg-red-500/20 border-red-500/40 text-red-300'
                                                        : 'bg-white/5 border-white/5 text-slate-600 hover:text-slate-300 hover:border-white/10'
                                                }`}
                                            >
                                                ↓ Disadv
                                            </button>
                                            <button
                                                onClick={() => { setCombatAdvMode('normal'); setCombatRollResult(null); }}
                                                className={`py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                                                    combatAdvMode === 'normal'
                                                        ? 'bg-white/10 border-white/20 text-slate-200'
                                                        : 'bg-white/5 border-white/5 text-slate-600 hover:text-slate-300 hover:border-white/10'
                                                }`}
                                            >
                                                Normal
                                            </button>
                                            <button
                                                onClick={() => { setCombatAdvMode('advantage'); setCombatRollResult(null); }}
                                                className={`py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                                                    combatAdvMode === 'advantage'
                                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                                        : 'bg-white/5 border-white/5 text-slate-600 hover:text-slate-300 hover:border-white/10'
                                                }`}
                                            >
                                                ↑ Adv
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── Roll button ────────────────────────────────────── */}
                                    {selectedAction.damageRoll && !isManualRoll && (
                                        <button
                                            onClick={rollCombatDamage}
                                            className="w-full py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all bg-white/10 border border-white/10 text-slate-200 hover:bg-white/20 hover:border-white/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">casino</span>
                                            Roll {selectedAction.damageRoll}
                                            {combatAdvMode !== 'normal' && (
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${combatAdvMode === 'advantage' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/30 text-red-300'}`}>
                                                    {combatAdvMode === 'advantage' ? 'ADV' : 'DIS'}
                                                </span>
                                            )}
                                        </button>
                                    )}

                                    {/* ── Dice result display ────────────────────────────── */}
                                    <AnimatePresence mode="wait">
                                        {combatRollResult && !isManualRoll && (
                                            <motion.div
                                                key={combatRollResult.total + combatRollResult.notation}
                                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-2"
                                            >
                                                {combatRollResult.type !== 'normal' && (
                                                    <p className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${combatRollResult.type === 'advantage' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {combatRollResult.type === 'advantage' ? '↑ Advantage — Highest Kept' : '↓ Disadvantage — Lowest Kept'}
                                                    </p>
                                                )}
                                                <div className="flex items-start gap-3 flex-wrap">
                                                    {/* Kept dice */}
                                                    <div className="space-y-1">
                                                        {combatRollResult.type !== 'normal' && (
                                                            <p className="text-[7px] font-black text-slate-500 uppercase">Kept</p>
                                                        )}
                                                        <div className="flex gap-1 flex-wrap">
                                                            {combatRollResult.rolls.map((v, i) => (
                                                                <div key={i} className={`min-w-[1.75rem] h-7 px-1.5 rounded-lg border flex items-center justify-center font-black text-sm ${
                                                                    combatRollResult.type === 'advantage' ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                                                                    : combatRollResult.type === 'disadvantage' ? 'border-red-500/50 bg-red-500/15 text-red-200'
                                                                    : 'border-white/20 bg-white/5 text-slate-100'
                                                                }`}>{v}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {/* Dropped dice */}
                                                    {combatRollResult.droppedRolls && combatRollResult.droppedRolls.length > 0 && (
                                                        <>
                                                            <span className="text-slate-700 text-xs self-center pt-4">vs</span>
                                                            <div className="space-y-1 opacity-30">
                                                                <p className="text-[7px] font-black text-slate-600 uppercase">Dropped</p>
                                                                <div className="flex gap-1 flex-wrap">
                                                                    {combatRollResult.droppedRolls.map((v, i) => (
                                                                        <div key={i} className="min-w-[1.75rem] h-7 px-1.5 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center font-black text-sm text-slate-600 line-through">{v}</div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    {combatRollResult.modifier !== 0 && (
                                                        <span className="text-[9px] font-mono text-slate-500">
                                                            {combatRollResult.rolls.reduce((a, b) => a + b, 0)}{combatRollResult.modifier > 0 ? '+' : ''}{combatRollResult.modifier} =
                                                        </span>
                                                    )}
                                                    <span className="text-3xl font-black text-slate-100">{combatRollResult.total}</span>
                                                    <span className="text-[8px] font-black text-slate-600">dmg</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* ── Manual override ────────────────────────────────── */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest">Or enter manually</p>
                                        <button
                                            onClick={() => { setIsManualRoll(!isManualRoll); if (!isManualRoll) setCombatRollResult(null); }}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all text-[8px] font-black uppercase ${isManualRoll ? 'bg-primary text-black border-primary' : 'bg-white/5 text-slate-600 border-white/10 hover:text-slate-300'}`}
                                        >
                                            <span className="material-symbols-outlined text-xs">edit</span>
                                            Manual
                                        </button>
                                    </div>

                                    {isManualRoll && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                            <input
                                                type="number"
                                                value={manualResult}
                                                onChange={e => setManualResult(e.target.value)}
                                                placeholder="Enter damage total..."
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-black text-white focus:border-primary/50 outline-none transition-all"
                                            />
                                        </motion.div>
                                    )}

                                    {/* Target prompt */}
                                    {targetIds.length === 0 && (
                                        <p className="text-[8px] text-slate-600 italic text-center animate-pulse">Select targets from the battle order</p>
                                    )}

                                    {/* Execute */}
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        disabled={targetIds.length === 0 || (isManualRoll && !manualResult)}
                                        onClick={resolveAction}
                                        className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                                            targetIds.length > 0 && (!isManualRoll || manualResult)
                                                ? 'bg-primary text-black primary-glow border-t border-white/20 hover:scale-105 active:scale-95'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        }`}
                                    >
                                        Execute {selectedAction.name} ({targetIds.length} Target{targetIds.length !== 1 ? 's' : ''})
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="obsidian-panel rounded-3xl p-6 border border-white/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">add_circle</span>
                            Master Bestiary
                        </h3>
                        <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {[...monstersData, ...customNpcs].map((m: any) => (
                                <button
                                    key={m.id}
                                    onClick={() => addMonster(m.id)}
                                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-primary/10 transition-all group"
                                >
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-slate-300 uppercase leading-none flex items-center gap-2">
                                            {m.name}
                                            {!monstersData.some(dm => dm.id === m.id) && (
                                                <span className="text-[6px] bg-primary/20 text-primary px-1 rounded">CUSTOM</span>
                                            )}
                                        </p>
                                        <p className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter mt-1">CR {m.cr} · {m.type}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-700 group-hover:text-primary transition-colors text-sm">add</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Combat Log */}
                <div className="obsidian-panel rounded-3xl p-6 border border-white/5 glass-panel h-fit sticky top-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Encounter Log</h3>
                        <button onClick={() => setCombatLog([])} className="text-[8px] font-black text-slate-700 hover:text-slate-500 uppercase">Clear</button>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex flex-col-reverse">
                        <div ref={logEndRef} />
                        {combatLog.length === 0 ? (
                            <p className="text-[10px] text-slate-700 italic text-center py-10">Waiting for battle to unfold...</p>
                        ) : combatLog.map(event => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`text-[10px] leading-relaxed p-2 rounded-lg border-l-2 ${event.type === 'damage' ? 'text-red-300 border-red-500 bg-red-500/5' :
                                    event.type === 'heal' ? 'text-emerald-300 border-emerald-500 bg-emerald-500/5' :
                                        'text-slate-400 border-slate-700 bg-white/5'
                                    }`}
                            >
                                <span className="opacity-40 font-mono text-[8px] mr-2">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                {event.message}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Standalone floating dice roller — always accessible, closed by default */}
            <DiceWidget showHistory />

            {/* Setup Modal Placeholder */}
            <AnimatePresence>
                {isSetupOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="obsidian-panel rounded-3xl p-10 border border-white/10 max-w-lg w-full space-y-8"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Add Combatant</h2>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Manual entry or PC selection</p>
                                </div>
                                <button onClick={() => setIsSetupOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form className="space-y-6" onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const name = formData.get('name') as string;
                                const init = parseInt(formData.get('init') as string);
                                const hp = parseInt(formData.get('hp') as string);
                                if (name && !isNaN(init)) {
                                    setCombatants([...combatants, {
                                        id: `manual-${Date.now()}`,
                                        name,
                                        initiative: init,
                                        hp: hp || 0,
                                        maxHp: hp || 0,
                                        ac: 0,
                                        type: 'Player',
                                        status: [],
                                        actions: [],
                                        speed: 30,
                                        movementRemaining: 30,
                                        side: 'Ally'
                                    }]);
                                    setIsSetupOpen(false);
                                    addLog(`Added ${name} to combat manually.`);
                                }
                            }}>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">Select from Hero Gallery</label>
                                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                            {savedChars.map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const pAbilities = (c.abilities || []).map((aId: string) => {
                                                            const a = abilitiesData.find(ad => ad.id === aId);
                                                            if (!a) return null;
                                                            const parsed = parseActionData(a.description);
                                                            return {
                                                                id: `pc-ability-${a.id}`,
                                                                name: a.name,
                                                                description: a.description,
                                                                damageRoll: parsed.roll,
                                                                average: parsed.avg,
                                                                range: parsed.range,
                                                                type: 'Ability' as const
                                                            };
                                                        }).filter(Boolean) as Action[];

                                                        const pSpells = (c.spells || []).map((sId: string) => {
                                                            const s = spellsData.find(sd => sd.id === sId);
                                                            if (!s) return null;
                                                            const parsed = parseActionData(s.description);
                                                            return {
                                                                id: `pc-spell-${s.id}`,
                                                                name: s.name,
                                                                description: s.description,
                                                                damageRoll: parsed.roll,
                                                                average: parsed.avg,
                                                                range: parsed.range,
                                                                type: 'Spell' as const
                                                            };
                                                        }).filter(Boolean) as Action[];

                                                        setCombatants([...combatants, {
                                                            id: `pc-${c.id}-${Date.now()}`,
                                                            name: c.name,
                                                            initiative: Math.floor(Math.random() * 20) + 1 + Math.floor(((c.stats?.DEX || 10) - 10) / 2),
                                                            hp: c.hp || 10,
                                                            maxHp: c.maxHp || 10,
                                                            ac: c.ac || (10 + Math.floor(((c.stats?.DEX || 10) - 10) / 2)),
                                                            type: 'Player',
                                                            status: [],
                                                            actions: [...pAbilities, ...pSpells],
                                                            imageUrl: c.image || c.portrait,
                                                            speed: 30,
                                                            movementRemaining: 30,
                                                            side: 'Ally'
                                                        }]);
                                                        setIsSetupOpen(false);
                                                        addLog(`${c.name} entered the fray!`);
                                                    }}
                                                    className="w-full text-left p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-primary/10 transition-all flex items-center justify-between"
                                                >
                                                    <span className="text-[10px] font-black text-slate-300 uppercase">{c.name} ({c.class})</span>
                                                    <span className="material-symbols-outlined text-xs text-primary">person_add</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/5 my-4" />
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">Manual Name</label>
                                        <input name="name" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-100 focus:border-primary/50 outline-none" placeholder="e.g. Michael" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">Initiative</label>
                                            <input name="init" type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-100 focus:border-primary/50 outline-none" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">Hit Points</label>
                                            <input name="hp" type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-100 focus:border-primary/50 outline-none" />
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-primary text-black py-4 rounded-xl font-black uppercase text-[11px] tracking-widest primary-glow border-t border-white/20">Join Battle</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
