
"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Character, AbilityScores } from '@/types';
import { calculateDerivedStats } from '@/lib/rules';

// ─── D&D 5E CLASS DATA ──────────────────────────────────────────────────────

const CLASS_HIT_DICE: Record<string, number> = {
    Barbarian: 12, Fighter: 10, Paladin: 10, Ranger: 10,
    Bard: 8, Cleric: 8, Druid: 8, Monk: 8, Rogue: 8, Warlock: 8,
    Sorcerer: 6, Wizard: 6,
};

// Spell slots table: [level][slotLevel] = count (full caster)
const FULL_CASTER_SLOTS: Record<number, Record<number, number>> = {
    1:  { 1: 2 },
    2:  { 1: 3 },
    3:  { 1: 4, 2: 2 },
    4:  { 1: 4, 2: 3 },
    5:  { 1: 4, 2: 3, 3: 2 },
    6:  { 1: 4, 2: 3, 3: 3 },
    7:  { 1: 4, 2: 3, 3: 3, 4: 1 },
    8:  { 1: 4, 2: 3, 3: 3, 4: 2 },
    9:  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
    10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
    18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
    19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
    20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
};

const HALF_CASTER_SLOTS: Record<number, Record<number, number>> = {
    1: {}, 2: { 1: 2 }, 3: { 1: 3 }, 4: { 1: 3 }, 5: { 1: 4, 2: 2 },
    6: { 1: 4, 2: 2 }, 7: { 1: 4, 2: 3 }, 8: { 1: 4, 2: 3 },
    9: { 1: 4, 2: 3, 3: 2 }, 10: { 1: 4, 2: 3, 3: 2 },
    11: { 1: 4, 2: 3, 3: 3 }, 12: { 1: 4, 2: 3, 3: 3 },
    13: { 1: 4, 2: 3, 3: 3, 4: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 1 },
    15: { 1: 4, 2: 3, 3: 3, 4: 2 }, 16: { 1: 4, 2: 3, 3: 3, 4: 2 },
    17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
    19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
};

const FULL_CASTERS = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'];
const HALF_CASTERS = ['Paladin', 'Ranger'];
const WARLOCK_SLOTS: Record<number, { count: number; level: number }> = {
    1: { count: 1, level: 1 }, 2: { count: 2, level: 1 }, 3: { count: 2, level: 2 },
    4: { count: 2, level: 2 }, 5: { count: 2, level: 3 }, 6: { count: 2, level: 3 },
    7: { count: 2, level: 4 }, 8: { count: 2, level: 4 }, 9: { count: 2, level: 5 },
    10: { count: 2, level: 5 }, 11: { count: 3, level: 5 }, 12: { count: 3, level: 5 },
    13: { count: 3, level: 5 }, 14: { count: 3, level: 5 }, 15: { count: 3, level: 5 },
    16: { count: 3, level: 5 }, 17: { count: 4, level: 5 }, 18: { count: 4, level: 5 },
    19: { count: 4, level: 5 }, 20: { count: 4, level: 5 },
};

// ASI/Feat levels per class
const ASI_LEVELS: Record<string, number[]> = {
    Fighter:   [4, 6, 8, 12, 14, 16, 19],
    Rogue:     [4, 8, 10, 12, 16, 18],
    default:   [4, 8, 12, 16, 19],
};

function getAsiLevels(cls: string): number[] {
    return ASI_LEVELS[cls] || ASI_LEVELS.default;
}

// Simplified class features per level
const CLASS_FEATURES: Record<string, Record<number, string[]>> = {
    Barbarian: {
        1: ['Rage (2/rest)', 'Unarmored Defense'],
        2: ['Reckless Attack', 'Danger Sense'],
        3: ['Primal Path', '+1 Rage/rest'],
        4: ['ASI/Feat'],
        5: ['Extra Attack', 'Fast Movement'],
        6: ['Path Feature', '+1 Rage/rest'],
        7: ['Feral Instinct'],
        8: ['ASI/Feat'],
        9: ['Brutal Critical (+1 die)'],
        10: ['Path Feature'],
        11: ['Relentless Rage'],
        12: ['ASI/Feat', '+1 Rage/rest'],
    },
    Bard: {
        1: ['Bardic Inspiration (d6)', 'Spellcasting'],
        2: ['Jack of All Trades', 'Song of Rest (d6)', '+2 spells'],
        3: ['Bard College', 'Expertise', '+2 spells'],
        4: ['ASI/Feat', '+2 spells'],
        5: ['Bardic Inspiration (d8)', 'Font of Inspiration', '+2 spells'],
        6: ['Countercharm', 'College Feature', '+2 spells'],
        7: ['+2 spells'],
        8: ['ASI/Feat', '+2 spells'],
        9: ['Song of Rest (d8)', '+2 spells'],
        10: ['Bardic Inspiration (d10)', 'Expertise', 'Magical Secrets (2)', '+2 spells'],
    },
    Cleric: {
        1: ['Spellcasting', 'Divine Domain', 'Domain Spells'],
        2: ['Channel Divinity (1/rest)', 'Domain Feature'],
        3: ['Domain Spells (level 2)'],
        4: ['ASI/Feat'],
        5: ['Destroy Undead (CR ½)', 'Domain Spells (level 3)'],
        6: ['Channel Divinity (2/rest)', 'Domain Feature'],
        7: ['Domain Spells (level 4)'],
        8: ['ASI/Feat', 'Destroy Undead (CR 1)', 'Domain Feature'],
        9: ['Domain Spells (level 5)'],
        10: ['Divine Intervention'],
    },
    Druid: {
        1: ['Druidic', 'Spellcasting'],
        2: ['Wild Shape (CR ¼)', 'Druid Circle'],
        3: ['Circle Spells', 'Circle Feature'],
        4: ['ASI/Feat', 'Wild Shape (CR ½)'],
        5: [],
        6: ['Circle Feature'],
        7: [],
        8: ['ASI/Feat', 'Wild Shape (CR 1)'],
        9: [],
        10: ['Circle Feature'],
    },
    Fighter: {
        1: ['Fighting Style', 'Second Wind'],
        2: ['Action Surge (1/rest)'],
        3: ['Martial Archetype', 'Archetype Feature'],
        4: ['ASI/Feat'],
        5: ['Extra Attack'],
        6: ['ASI/Feat'],
        7: ['Archetype Feature'],
        8: ['ASI/Feat'],
        9: ['Indomitable (1/rest)'],
        10: ['Archetype Feature'],
        11: ['Extra Attack (2)'],
        12: ['ASI/Feat'],
    },
    Monk: {
        1: ['Unarmored Defense', 'Martial Arts (d4)'],
        2: ['Ki (2 points)', 'Unarmored Movement (+10ft)', 'Step of the Wind', 'Patient Defense', 'Flurry of Blows'],
        3: ['Monastic Tradition', 'Deflect Missiles'],
        4: ['ASI/Feat', 'Slow Fall'],
        5: ['Extra Attack', 'Stunning Strike', 'Martial Arts (d6)'],
        6: ['Ki-Empowered Strikes', 'Tradition Feature'],
        7: ['Evasion', 'Stillness of Mind'],
        8: ['ASI/Feat'],
        9: ['Unarmored Movement (+15ft)'],
        10: ['Purity of Body'],
    },
    Paladin: {
        1: ['Divine Sense', 'Lay on Hands (5×level HP)'],
        2: ['Fighting Style', 'Spellcasting', 'Divine Smite'],
        3: ['Sacred Oath', 'Divine Health', 'Oath Spells', 'Channel Divinity'],
        4: ['ASI/Feat'],
        5: ['Extra Attack', 'Oath Feature'],
        6: ['Aura of Protection'],
        7: ['Oath Feature'],
        8: ['ASI/Feat'],
        9: [],
        10: ['Aura of Courage'],
    },
    Ranger: {
        1: ['Favored Enemy', 'Natural Explorer'],
        2: ['Fighting Style', 'Spellcasting'],
        3: ['Ranger Archetype', 'Primeval Awareness'],
        4: ['ASI/Feat'],
        5: ['Extra Attack'],
        6: ['Favored Enemy (2)', 'Natural Explorer (2)'],
        7: ['Archetype Feature'],
        8: ['ASI/Feat', 'Land\'s Stride'],
        9: [],
        10: ['Natural Explorer (3)', 'Hide in Plain Sight'],
    },
    Rogue: {
        1: ['Expertise (2 skills)', 'Sneak Attack (1d6)', 'Thieves\' Cant'],
        2: ['Cunning Action'],
        3: ['Roguish Archetype', 'Sneak Attack (2d6)'],
        4: ['ASI/Feat'],
        5: ['Sneak Attack (3d6)', 'Uncanny Dodge'],
        6: ['Expertise (2 more)'],
        7: ['Sneak Attack (4d6)', 'Evasion'],
        8: ['ASI/Feat'],
        9: ['Sneak Attack (5d6)', 'Archetype Feature'],
        10: ['ASI/Feat', 'Sneak Attack (6d6)'],
    },
    Sorcerer: {
        1: ['Spellcasting', 'Sorcerous Origin', 'Origin Feature'],
        2: ['Font of Magic (2 sorcery pts)', '+2 spells'],
        3: ['Metamagic (2)', '+2 spells'],
        4: ['ASI/Feat', '+2 spells'],
        5: ['+2 spells'],
        6: ['Origin Feature', '+2 spells'],
        7: ['+2 spells'],
        8: ['ASI/Feat', '+2 spells'],
        9: ['+2 spells'],
        10: ['Metamagic (3)', '+2 spells'],
    },
    Warlock: {
        1: ['Otherworldly Patron', 'Pact Magic', 'Expanded Spell List'],
        2: ['Eldritch Invocations (2)', '+1 invocation'],
        3: ['Pact Boon', '+1 invocation'],
        4: ['ASI/Feat', '+1 invocation'],
        5: ['+1 invocation'],
        6: ['Patron Feature', '+1 invocation'],
        7: ['+1 invocation'],
        8: ['ASI/Feat', '+1 invocation'],
        9: ['+1 invocation'],
        10: ['Patron Feature', 'Eldritch Invocations (5)'],
    },
    Wizard: {
        1: ['Spellcasting', 'Arcane Recovery', 'Spellbook (6 spells)'],
        2: ['Arcane Tradition', 'Tradition Feature', '+2 spells'],
        3: ['+2 spells'],
        4: ['ASI/Feat', '+2 spells'],
        5: ['+2 spells'],
        6: ['Tradition Feature', '+2 spells'],
        7: ['+2 spells'],
        8: ['ASI/Feat', '+2 spells'],
        9: ['+2 spells'],
        10: ['Tradition Feature', '+2 spells'],
    },
};

function getClassFeatures(cls: string, level: number): string[] {
    const classData = CLASS_FEATURES[cls] || {};
    return classData[level] || [];
}

function getSpellSlotsForLevel(cls: string, level: number): Record<number, number> | null {
    if (FULL_CASTERS.includes(cls)) return FULL_CASTER_SLOTS[level] || null;
    if (HALF_CASTERS.includes(cls)) return HALF_CASTER_SLOTS[level] || null;
    if (cls === 'Warlock') {
        const ws = WARLOCK_SLOTS[level];
        if (!ws) return null;
        return { [ws.level]: ws.count };
    }
    return null;
}

function getProficiencyBonus(level: number): number {
    return 2 + Math.floor((level - 1) / 4);
}

const ABILITY_NAMES = { STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution', INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma' };
const ABILITY_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as (keyof AbilityScores)[];

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface LevelUpManagerProps {
    character: Character;
    onComplete: (updatedChar: Character) => void;
    onCancel: () => void;
}

type Step = 'hp' | 'features' | 'asi' | 'spells' | 'summary';

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export const LevelUpManager: React.FC<LevelUpManagerProps> = ({ character, onComplete, onCancel }) => {
    const className = character.class || 'Fighter';
    const currentLevel = character.level ?? 1;
    const nextLevel = currentLevel + 1;

    // Hit die
    const hitDieSize = CLASS_HIT_DICE[className] || 8;
    const conMod = Math.floor(((character.abilityScores?.CON ?? 10) - 10) / 2);
    const avgHP = Math.floor(hitDieSize / 2) + 1;

    // Steps to show
    const isAsiLevel = getAsiLevels(className).includes(nextLevel);
    const newSlots = getSpellSlotsForLevel(className, nextLevel);
    const hasSpellSlotChange = !!newSlots && Object.keys(newSlots).length > 0;
    const newFeatures = getClassFeatures(className, nextLevel);

    // Determine steps
    const steps: Step[] = ['hp'];
    if (newFeatures.length > 0) steps.push('features');
    if (isAsiLevel) steps.push('asi');
    if (hasSpellSlotChange) steps.push('spells');
    steps.push('summary');

    const [stepIdx, setStepIdx] = useState(0);
    const currentStep = steps[stepIdx];

    // HP state
    const [rolledHP, setRolledHP] = useState<number | null>(null);
    const [useAvg, setUseAvg] = useState(false);
    const [rolling, setRolling] = useState(false);

    // ASI state
    const [asiChoice, setAsiChoice] = useState<'asi' | 'feat'>('asi');
    const [asi1Stat, setAsi1Stat] = useState<keyof AbilityScores>('STR');
    const [asi2Stat, setAsi2Stat] = useState<keyof AbilityScores>('STR');
    const [featName, setFeatName] = useState('');
    const [featDesc, setFeatDesc] = useState('');

    const hpGain = ((useAvg || rolledHP === null) ? avgHP : rolledHP) + conMod;
    const effectiveHpGain = Math.max(1, hpGain); // min 1 HP per level

    const rollHp = () => {
        setRolling(true);
        // Animate 3 quick rolls then land on final
        let count = 0;
        const interval = setInterval(() => {
            setRolledHP(Math.floor(Math.random() * hitDieSize) + 1);
            count++;
            if (count >= 8) {
                clearInterval(interval);
                setRolling(false);
            }
        }, 80);
    };

    const handleComplete = useCallback(() => {
        // Build updated ability scores if ASI
        let newAbilityScores = { ...character.abilityScores };
        if (isAsiLevel && asiChoice === 'asi') {
            newAbilityScores = {
                ...newAbilityScores,
                [asi1Stat]: Math.min(20, (newAbilityScores[asi1Stat] || 10) + 1),
                [asi2Stat]: Math.min(20, (newAbilityScores[asi2Stat] || 10) + 1),
            };
        }

        // Build new spell slots
        let newMagic = character.magic;
        if (hasSpellSlotChange && newSlots) {
            const existingSlots = character.magic?.spellSlots || {};
            const mergedSlots: Record<number, { current: number; max: number }> = { ...existingSlots };
            Object.entries(newSlots).forEach(([lvl, count]) => {
                const level = parseInt(lvl);
                const existing = existingSlots[level];
                const diff = count - (existing?.max || 0);
                mergedSlots[level] = { current: (existing?.current || 0) + Math.max(0, diff), max: count };
            });
            newMagic = { ...character.magic, spellSlots: mergedSlots } as any;
        }

        // Build feats (stored in features[])
        let newFeatures = character.features || [];
        if (isAsiLevel && asiChoice === 'feat' && featName.trim()) {
            newFeatures = [...newFeatures, { name: featName.trim(), description: featDesc.trim(), type: 'Feat', source: 'LevelUp' }];
        }

        const newProfBonus = getProficiencyBonus(nextLevel);

        const updatedChar: Character = {
            ...character,
            level: nextLevel,
            maxHP: (character.maxHP || 0) + effectiveHpGain,
            abilityScores: newAbilityScores,
            proficiencyBonus: newProfBonus,
            magic: newMagic,
            features: newFeatures,
            progression: {
                ...(character.progression || {}),
                level: nextLevel,
                proficiencyBonus: newProfBonus,
            },
            defense: {
                ...(character.defense || {}),
                hitPoints: {
                    max: ((character.defense?.hitPoints?.max) || character.maxHP || 0) + effectiveHpGain,
                    current: ((character.defense?.hitPoints?.current) || character.maxHP || 0) + effectiveHpGain,
                    temp: character.defense?.hitPoints?.temp || 0,
                },
                hitDice: {
                    max: (character.defense?.hitDice?.max || currentLevel) + 1,
                    current: (character.defense?.hitDice?.current || currentLevel) + 1,
                    dieType: `d${hitDieSize}`,
                },
            },
        };

        onComplete(calculateDerivedStats(updatedChar));
    }, [character, nextLevel, effectiveHpGain, isAsiLevel, asiChoice, asi1Stat, asi2Stat, featName, featDesc, hasSpellSlotChange, newSlots]);

    const next = () => {
        if (stepIdx < steps.length - 1) setStepIdx(s => s + 1);
        else handleComplete();
    };
    const prev = () => setStepIdx(s => Math.max(0, s - 1));

    const CLASS_COLOR: Record<string, string> = {
        Barbarian: '#ef4444', Fighter: '#f97316', Paladin: '#fbbf24',
        Ranger: '#22c55e', Bard: '#a78bfa', Cleric: '#facc15',
        Druid: '#86efac', Monk: '#38bdf8', Rogue: '#94a3b8',
        Warlock: '#c084fc', Sorcerer: '#f87171', Wizard: '#60a5fa',
    };
    const classColor = CLASS_COLOR[className] || '#fbbf24';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
                style={{ background: '#0D0F14', border: '1px solid rgba(255,255,255,0.08)' }}
            >
                {/* Header */}
                <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="size-10 rounded-xl flex items-center justify-center text-black font-black text-lg" style={{ background: classColor }}>
                            {nextLevel}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                                Level Up
                            </h2>
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: classColor }}>
                                {character.name} · {className} {nextLevel}
                            </p>
                        </div>
                    </div>
                    {/* Step indicators */}
                    <div className="flex items-center gap-1.5 mt-4">
                        {steps.map((s, i) => (
                            <div key={s} className={`h-1.5 rounded-full flex-1 transition-all ${i === stepIdx ? 'opacity-100' : i < stepIdx ? 'opacity-60' : 'opacity-20'}`}
                                style={{ background: i <= stepIdx ? classColor : '#334155' }} />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-6 min-h-[280px]">
                    <AnimatePresence mode="wait">
                        {/* ── STEP: HP ── */}
                        {currentStep === 'hp' && (
                            <motion.div key="hp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                <div>
                                    <h3 className="text-base font-black text-white uppercase tracking-tight mb-1">Hit Points</h3>
                                    <p className="text-xs text-slate-500">Roll your hit die or take the average</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={rollHp}
                                        disabled={rolling}
                                        className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                                        style={{ background: `${classColor}20`, border: `1px solid ${classColor}40`, color: classColor }}
                                    >
                                        {rolling ? (
                                            <span className="text-3xl font-black">{rolledHP}</span>
                                        ) : rolledHP !== null ? (
                                            <span><span className="text-3xl">{rolledHP}</span><br/><span className="text-[9px]">d{hitDieSize} — click to reroll</span></span>
                                        ) : (
                                            <span><span className="material-symbols-outlined text-2xl block">casino</span>Roll d{hitDieSize}</span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => { setUseAvg(true); setRolledHP(null); }}
                                        className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${useAvg ? 'border-2' : 'border opacity-60 hover:opacity-80'}`}
                                        style={{ background: useAvg ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${useAvg ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`, color: 'white' }}
                                    >
                                        <span className="text-3xl">{avgHP}</span>
                                        <br/><span className="text-[9px] opacity-60">Take Average</span>
                                    </button>
                                </div>
                                <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">HP Gain</span>
                                        <span className="font-black text-white">
                                            {useAvg || rolledHP !== null ? (
                                                <>+{Math.max(1, (useAvg ? avgHP : rolledHP!) + conMod)}
                                                <span className="text-xs text-slate-600 ml-1">({useAvg ? avgHP : rolledHP} {conMod >= 0 ? '+' : ''}{conMod} CON)</span>
                                                </>
                                            ) : '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">New Max HP</span>
                                        <span className="font-black" style={{ color: classColor }}>
                                            {useAvg || rolledHP !== null ? (character.maxHP || 0) + effectiveHpGain : '—'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP: FEATURES ── */}
                        {currentStep === 'features' && (
                            <motion.div key="features" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <h3 className="text-base font-black text-white uppercase tracking-tight mb-1">New Features</h3>
                                    <p className="text-xs text-slate-500">{className} level {nextLevel} unlocks:</p>
                                </div>
                                <div className="space-y-2">
                                    {newFeatures.map((feat, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${classColor}10`, border: `1px solid ${classColor}25` }}>
                                            <span className="material-symbols-outlined text-sm" style={{ color: classColor }}>auto_awesome</span>
                                            <span className="text-sm font-bold text-slate-200">{feat}</span>
                                        </div>
                                    ))}
                                </div>
                                {getProficiencyBonus(nextLevel) > getProficiencyBonus(currentLevel) && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                                        <span className="material-symbols-outlined text-sm text-amber-400">trending_up</span>
                                        <span className="text-sm font-bold text-amber-300">Proficiency Bonus increased to +{getProficiencyBonus(nextLevel)}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── STEP: ASI ── */}
                        {currentStep === 'asi' && (
                            <motion.div key="asi" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <h3 className="text-base font-black text-white uppercase tracking-tight mb-1">ASI / Feat</h3>
                                    <p className="text-xs text-slate-500">Choose to improve two ability scores or gain a feat</p>
                                </div>
                                {/* Toggle */}
                                <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    {(['asi', 'feat'] as const).map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setAsiChoice(opt)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${asiChoice === opt ? 'text-black' : 'text-slate-500 hover:text-slate-300'}`}
                                            style={{ background: asiChoice === opt ? classColor : 'transparent' }}
                                        >
                                            {opt === 'asi' ? '↑ Ability Score' : '✦ Feat'}
                                        </button>
                                    ))}
                                </div>

                                {asiChoice === 'asi' ? (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-500">Increase two ability scores by +1 each (max 20)</p>
                                        {[{label: 'First +1', val: asi1Stat, set: setAsi1Stat}, {label: 'Second +1', val: asi2Stat, set: setAsi2Stat}].map(item => (
                                            <div key={item.label} className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-slate-500 w-20">{item.label}</span>
                                                <div className="flex-1 grid grid-cols-6 gap-1">
                                                    {ABILITY_KEYS.map(key => {
                                                        const current = character.abilityScores?.[key] || 10;
                                                        const maxed = current >= 20;
                                                        return (
                                                            <button
                                                                key={key}
                                                                disabled={maxed}
                                                                onClick={() => item.set(key)}
                                                                className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${item.val === key ? 'text-black' : maxed ? 'text-slate-700 opacity-40' : 'text-slate-400 hover:text-white'}`}
                                                                style={{ background: item.val === key ? classColor : 'rgba(255,255,255,0.05)', border: `1px solid ${item.val === key ? classColor + '60' : 'rgba(255,255,255,0.05)'}` }}
                                                            >
                                                                <div>{key}</div>
                                                                <div className="opacity-70">{current}{maxed ? '!' : ''}</div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={featName}
                                            onChange={e => setFeatName(e.target.value)}
                                            placeholder="Feat name (e.g. War Caster)"
                                            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                                        />
                                        <textarea
                                            value={featDesc}
                                            onChange={e => setFeatDesc(e.target.value)}
                                            placeholder="Description (optional)"
                                            rows={3}
                                            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 resize-none"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── STEP: SPELLS ── */}
                        {currentStep === 'spells' && newSlots && (
                            <motion.div key="spells" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <h3 className="text-base font-black text-white uppercase tracking-tight mb-1">Spell Slots</h3>
                                    <p className="text-xs text-slate-500">Your spell slots at level {nextLevel}</p>
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(newSlots).map(([level, count]) => {
                                        const prev = character.magic?.spellSlots?.[parseInt(level)]?.max || 0;
                                        const gained = count - prev;
                                        const SLOT_COLORS = ['#94a3b8','#60a5fa','#34d399','#fbbf24','#f97316','#a78bfa','#f472b6','#fb923c','#ef4444','#c084fc'];
                                        const slotColor = SLOT_COLORS[parseInt(level)] || '#fbbf24';
                                        return (
                                            <div key={level} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div className="size-8 rounded-lg flex items-center justify-center text-xs font-black text-black" style={{ background: slotColor }}>
                                                    {level}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-black text-white">Level {level} Slots</p>
                                                    <div className="flex gap-1 mt-1">
                                                        {Array.from({ length: count }).map((_, i) => (
                                                            <div key={i} className="size-3 rounded-sm" style={{ background: slotColor, opacity: i < (prev) ? 0.4 : 1 }} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black" style={{ color: slotColor }}>{count}</span>
                                                    {gained > 0 && <span className="text-xs text-emerald-400 block">+{gained} new</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {className === 'Warlock' && (
                                    <p className="text-xs text-slate-600 italic">Warlock spell slots recharge on a Short Rest.</p>
                                )}
                            </motion.div>
                        )}

                        {/* ── STEP: SUMMARY ── */}
                        {currentStep === 'summary' && (
                            <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                                <div>
                                    <h3 className="text-base font-black text-white uppercase tracking-tight mb-1">Level {nextLevel} Summary</h3>
                                    <p className="text-xs text-slate-500">Confirm your choices</p>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        <span className="text-slate-400">Hit Points</span>
                                        <span className="font-black text-emerald-400">+{effectiveHpGain} HP → {(character.maxHP || 0) + effectiveHpGain} max</span>
                                    </div>
                                    {isAsiLevel && asiChoice === 'asi' && (
                                        <div className="flex justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                            <span className="text-slate-400">ASI</span>
                                            <span className="font-black text-amber-400">+1 {asi1Stat}{asi1Stat !== asi2Stat ? `, +1 ${asi2Stat}` : ' (×2)'}</span>
                                        </div>
                                    )}
                                    {isAsiLevel && asiChoice === 'feat' && featName && (
                                        <div className="flex justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                            <span className="text-slate-400">Feat</span>
                                            <span className="font-black text-purple-400">{featName}</span>
                                        </div>
                                    )}
                                    {getProficiencyBonus(nextLevel) > getProficiencyBonus(currentLevel) && (
                                        <div className="flex justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                            <span className="text-slate-400">Proficiency</span>
                                            <span className="font-black text-cyan-400">+{getProficiencyBonus(nextLevel)}</span>
                                        </div>
                                    )}
                                    {newFeatures.length > 0 && (
                                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                            <span className="text-slate-400 text-xs font-black uppercase tracking-widest block mb-1">New Features</span>
                                            {newFeatures.map((f, i) => <p key={i} className="text-xs font-bold" style={{ color: classColor }}>• {f}</p>)}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8 flex gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                    <button
                        onClick={stepIdx === 0 ? onCancel : prev}
                        className="px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        {stepIdx === 0 ? 'Cancel' : '← Back'}
                    </button>
                    <button
                        onClick={next}
                        disabled={currentStep === 'hp' && rolledHP === null && !useAvg}
                        className="flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-black transition-all disabled:opacity-30 active:scale-95"
                        style={{ background: classColor, boxShadow: `0 8px 20px ${classColor}40` }}
                    >
                        {stepIdx === steps.length - 1 ? `✦ Claim Level ${nextLevel}` : 'Continue →'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
