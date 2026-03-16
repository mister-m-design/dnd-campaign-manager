"use client";

import React, { useState, useEffect } from 'react';
import { DiceEngine } from '@/lib/dice';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import classesData from '@/data/classes.json';
import speciesData from '@/data/species.json';
import loreData from '@/data/lore.json';
import abilitiesData from '@/data/abilities.json';
import featsData from '@/data/feats.json';
import spellsData from '@/data/spells.json';
import equipmentData from '@/data/equipment.json';

type CreationStep = 'class' | 'origin' | 'stats' | 'details' | 'skills' | 'abilities' | 'equipment' | 'spells' | 'review';
type RollingMode = 'step-by-step' | 'quick' | 'manual' | 'direct';

const SKILLS_LIST = [
    "Athletics", "Acrobatics", "Sleight of Hand", "Stealth",
    "Arcana", "History", "Investigation", "Nature", "Religion",
    "Animal Handling", "Insight", "Medicine", "Perception", "Survival",
    "Deception", "Intimidation", "Performance", "Persuasion"
];

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
type Ability = typeof ABILITIES[number];

const STEPS: { id: CreationStep; label: string; icon: string; validate: (char: any) => boolean; summary: (char: any) => string }[] = [
    {
        id: 'class',
        label: 'Heroic Class',
        icon: 'swords',
        validate: (c) => !!c.class,
        summary: (c) => c.class || 'Choosing...'
    },
    {
        id: 'origin',
        label: 'Species & Origin',
        icon: 'fingerprint',
        validate: (c) => !!c.species && !!c.background,
        summary: (c) => c.species ? `${c.species}, ${c.background || '...'}` : 'Choosing...'
    },
    {
        id: 'stats',
        label: 'Ability Scores',
        icon: 'monitoring',
        validate: (c) => Object.values(c.stats).every(v => typeof v === 'number' && v > 0),
        summary: (c) => ABILITIES.map(a => `${a}:${c.stats[a]}`).join(' ')
    },
    {
        id: 'details',
        label: 'Identity',
        icon: 'person_identity',
        validate: (c) => !!c.name && !!c.alignment,
        summary: (c) => c.name || 'Anonymous'
    },
    {
        id: 'skills',
        label: 'Proficiencies',
        icon: 'psychology',
        validate: (c) => (c.skills?.length || 0) >= (classesData.find(cl => cl.name === c.class)?.skillCount || 2),
        summary: (c) => `${c.skills?.length || 0} Skills Selected`
    },
    {
        id: 'abilities',
        label: 'Features & Feats',
        icon: 'grade',
        validate: (c) => true, // Optional
        summary: (c) => `${(c.abilities?.length || 0) + (c.customAbilities?.length || 0)} Traits`
    },
    {
        id: 'equipment',
        label: 'Equipment',
        icon: 'backpack',
        validate: (c) => (c.equipment?.length || 0) > 0,
        summary: (c) => `${c.equipment?.length || 0} Items`
    },
    {
        id: 'spells',
        label: 'Innate Magic',
        icon: 'auto_fix_high',
        validate: (c) => true, // Checked dynamically in the step
        summary: (c) => `${c.spells?.length || 0} Spells`
    },
    {
        id: 'review',
        label: 'Final Review',
        icon: 'verified',
        validate: (c) => false, // Cannot be validated this way
        summary: (c) => 'Ready to Forge'
    }
];

const LoreTooltip = ({ content, children }: { content: string, children: React.ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="relative inline-block group" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl backdrop-blur-xl pointer-events-none"
                    >
                        <div className="text-[11px] leading-relaxed text-slate-300 font-medium italic">{content}</div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'warning' }: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'warning' | 'success' | 'danger';
}) => {
    if (!isOpen) return null;

    const colors = {
        warning: 'text-primary border-primary/20 bg-primary/5',
        success: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
        danger: 'text-rose-500 border-rose-500/20 bg-rose-500/5'
    };

    const icon = {
        warning: 'warning',
        success: 'check_circle',
        danger: 'report'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md obsidian-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden"
            >
                <div className="flex items-start gap-4 mb-6">
                    <div className={`mt-1 size-12 rounded-xl flex-shrink-0 flex items-center justify-center border ${colors[type]}`}>
                        <span className="material-symbols-outlined">{icon[type]}</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">{title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{message}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-grow py-3 rounded-xl bg-white/5 border border-white/5 text-slate-400 font-bold hover:bg-white/10 transition-all uppercase text-[10px] tracking-widest"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-grow py-3 rounded-xl font-black transition-all uppercase text-[10px] tracking-widest ${type === 'danger' ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]' :
                            type === 'success' ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
                                'bg-primary text-black primary-glow'
                            }`}
                    >
                        Confirm
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

interface CharacterCreatorProps {
    initialData?: any;
    isEditing?: boolean;
}

export default function CharacterCreator({ initialData, isEditing }: CharacterCreatorProps) {
    const [step, setStep] = useState<CreationStep>('class');
    const [rollingMode, setRollingMode] = useState<RollingMode | null>(null);
    const [currentRollingAbilityIndex, setCurrentRollingAbilityIndex] = useState(0);
    const [tempRolls, setTempRolls] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [savedCharacters, setSavedCharacters] = usePersistentState<any[]>('mythic_saved_characters', []);

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'warning' | 'success' | 'danger';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning'
    });

    const [character, setCharacter] = usePersistentState(isEditing ? `mythic_edit_${initialData?.id}` : 'mythic_character_draft', initialData || {
        name: '',
        pronouns: '',
        class: '',
        species: '',
        background: '',
        alignment: 'True Neutral',
        stats: {
            STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10
        },
        skills: [] as string[],
        abilities: [] as string[],
        customAbilities: [] as { id: string, name: string, description: string }[],
        equipment: [] as string[],
        spells: [] as string[],
        level: 1,
        appearance: '',
        backstory: '',
        image: '',
    });

    const [statPool, setStatPool] = useState<number[]>([]);
    const [selectedPoolIndex, setSelectedPoolIndex] = useState<number | null>(null);
    const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
    const [customFeatName, setCustomFeatName] = useState('');
    const [customFeatDesc, setCustomFeatDesc] = useState('');
    const [spellLevelFilter, setSpellLevelFilter] = useState<number | 'all'>('all');
    const [expandedSpell, setExpandedSpell] = useState<string | null>(null);

    const nextStep = () => {
        const steps: CreationStep[] = ['class', 'origin', 'stats', 'details', 'skills', 'abilities', 'equipment', 'spells', 'review'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1]);
        }
    };

    const prevStep = () => {
        const steps: CreationStep[] = ['class', 'origin', 'stats', 'details', 'skills', 'abilities', 'equipment', 'spells', 'review'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        }
    };

    const renderSidebar = () => (
        <div className="w-80 bg-slate-900/50 border-r border-white/5 p-6 flex flex-col h-full overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-xl font-black text-slate-100 uppercase tracking-tighter flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">person_add</span>
                    Forge Hero
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Creation Protocol</p>
            </div>

            <nav className="flex-grow space-y-1">
                {STEPS.map((s, idx) => {
                    const isCurrent = step === s.id;
                    const isValid = s.validate(character);
                    const isUpcoming = STEPS.findIndex(st => st.id === step) < idx;

                    // Logic to show red if invalid AND we are past it or at review
                    const showError = !isValid && !isUpcoming && s.id !== 'review' && s.id !== 'abilities' && s.id !== 'spells';

                    return (
                        <button
                            key={s.id}
                            onClick={() => setStep(s.id)}
                            className={`w-full group text-left p-3 rounded-xl transition-all relative ${isCurrent
                                ? 'bg-primary/10 border-l-2 border-primary translate-x-1'
                                : 'hover:bg-white/5 border-l-2 border-transparent'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 size-6 rounded-lg flex items-center justify-center transition-all ${isCurrent ? 'bg-primary text-black' :
                                    showError ? 'bg-rose-500/20 text-rose-500' :
                                        isValid ? 'bg-emerald-500/20 text-emerald-500' :
                                            'bg-white/5 text-slate-500'
                                    }`}>
                                    <span className="material-symbols-outlined text-sm">{s.icon}</span>
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-primary' :
                                            showError ? 'text-rose-500' :
                                                'text-slate-400 group-hover:text-slate-200'
                                            }`}>
                                            {s.label}
                                        </span>
                                        {isValid && !isCurrent && (
                                            <span className="material-symbols-outlined text-emerald-500 text-xs">check</span>
                                        )}
                                        {showError && (
                                            <span className="material-symbols-outlined text-rose-500 text-xs animate-pulse">priority_high</span>
                                        )}
                                    </div>
                                    <div className={`text-[10px] font-medium truncate mt-0.5 ${isCurrent ? 'text-slate-300' : 'text-slate-600'
                                        }`}>
                                        {s.summary(character)}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </nav>

            <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
                        {character.level}
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Character Tier</span>
                        <span className="text-[10px] font-bold text-slate-300">Level {character.level} {character.class || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const rollSingleAbility = () => {
        const rolls = [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
        ];
        setTempRolls(rolls);
        const sorted = [...rolls].sort((a, b) => b - a);
        const total = sorted[0] + sorted[1] + sorted[2];

        const ability = ABILITIES[currentRollingAbilityIndex];
        setCharacter((prev: any) => ({
            ...prev,
            stats: { ...prev.stats, [ability]: total }
        }));

        if (currentRollingAbilityIndex < 5) {
            setTimeout(() => {
                setCurrentRollingAbilityIndex(i => i + 1);
                setTempRolls([]);
            }, 800);
        }
    };

    const rollAllStats = () => {
        const newPool: number[] = [];
        ABILITIES.forEach(() => {
            const rolls = [
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1,
            ];
            const sorted = rolls.sort((a, b) => b - a);
            newPool.push(sorted[0] + sorted[1] + sorted[2]);
        });
        setStatPool(newPool);
        setRollingMode('quick');
    };

    const swapStats = (a: Ability, b: Ability) => {
        const valA = character.stats[a];
        const valB = character.stats[b];
        setCharacter({
            ...character,
            stats: {
                ...character.stats,
                [a]: valB,
                [b]: valA
            }
        });
        setSelectedAbility(null);
    };

    const assignFromPool = (ability: Ability, poolIdx: number) => {
        const score = statPool[poolIdx];
        setCharacter((prev: any) => ({
            ...prev,
            stats: {
                ...prev.stats,
                [ability]: score
            }
        }));

        // Remove from pool as requested
        const newPool = [...statPool];
        newPool.splice(poolIdx, 1);
        setStatPool(newPool);
        setSelectedPoolIndex(null);
    };

    const toggleSkill = (skill: string) => {
        if (character.skills.includes(skill)) {
            setCharacter({ ...character, skills: character.skills.filter((s: string) => s !== skill) });
        } else {
            setCharacter({ ...character, skills: [...character.skills, skill] });
        }
    };

    const toggleAbility = (id: string) => {
        if (character.abilities.includes(id)) {
            setCharacter({ ...character, abilities: character.abilities.filter((a: string) => a !== id) });
        } else {
            setCharacter({ ...character, abilities: [...character.abilities, id] });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCharacter({ ...character, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const router = useRouter();

    const finishCreation = () => {
        if (!character.name) {
            setModalConfig({
                isOpen: true,
                title: 'Identity Required',
                message: 'Your hero needs a name to be forged in the chronicles!',
                type: 'warning',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
            setStep('details');
            return;
        }

        // --- IDENTITY GUARDRAILS ---
        const charId = isEditing
            ? (initialData?.id || (character as any).id)
            : crypto.randomUUID();

        if (isEditing && !charId) {
            setModalConfig({
                isOpen: true,
                title: 'Update Error',
                message: 'Missing entity ID for update. The chronomancy has failed.',
                type: 'danger',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        const finalChar = {
            ...character,
            id: charId,
            updatedAt: new Date().toISOString(),
            status: character.status || 'Active',
            retired: character.retired ?? false
        };

        // 2. Perform Atomic Update using functional state to prevent race conditions
        setSavedCharacters((prev: any[]) => {
            if (isEditing) {
                // UPDATE: Match by specific ID only
                return prev.map(c => c.id === charId ? finalChar : c);
            } else {
                // CREATE: Check for collisions
                if (prev.some(c => c.id === charId)) {
                    setModalConfig({
                        isOpen: true,
                        title: 'Naming Paradox',
                        message: 'An entity with this internal essence already exists.',
                        type: 'danger',
                        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                    });
                    return prev;
                }
                return [...prev, finalChar];
            }
        });

        // 3. Post-save hygiene
        if (isEditing) {
            window.localStorage.removeItem(`mythic_edit_${charId}`);
        } else {
            window.localStorage.removeItem('mythic_character_draft');
        }

        setModalConfig({
            isOpen: true,
            title: isEditing ? 'Evolution Complete' : 'Hero Forged',
            message: isEditing
                ? 'Your hero has been successfully updated in the archives.'
                : 'A new champion is ready! They have been added to your character gallery.',
            type: 'success',
            onConfirm: () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                router.push('/characters');
            }
        });
    };

    const handleCancel = () => {
        setModalConfig({
            isOpen: true,
            title: 'Abandon Forge?',
            message: 'Are you sure you want to exit? Any unsaved changes will be lost to the void.',
            type: 'danger',
            onConfirm: () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                if (!isEditing) {
                    window.localStorage.removeItem('mythic_character_draft');
                }
                router.push('/campaign');
            }
        });
    };

    const handleFinish = () => {
        finishCreation();
    };

    const renderStepContent = () => {
        switch (step) {
            case 'class':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Choose Your Class</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            {classesData.map(c => (
                                <LoreTooltip key={c.name} content={(loreData.classes as any)[c.name]}>
                                    <button
                                        onClick={() => setCharacter({ ...character, class: c.name })}
                                        className={`w-full p-6 rounded-xl border transition-all text-left group ${character.class === c.name
                                            ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_var(--primary-glow)]'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                                            }`}
                                    >
                                        <span className="block font-black uppercase text-lg group-hover:tracking-wider transition-all">{c.name}</span>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Hit Die: {c.hitDie}</span>
                                            <span className="text-[8px] text-primary/50 font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity italic">Lore Available</span>
                                        </div>
                                    </button>
                                </LoreTooltip>
                            ))}
                        </div>
                    </div>
                );
            case 'origin':
                return (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight mb-2">Species & Background</h2>
                            <p className="text-slate-400 text-sm">Define where your hero comes from.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Species</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-slate-600">search</span>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-md pl-7 pr-2 py-1 text-[10px] text-slate-300 focus:border-primary/50 outline-none w-32"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {speciesData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                        <button
                                            key={s.name}
                                            onClick={() => setCharacter({ ...character, species: s.name })}
                                            className={`p-4 rounded-lg border text-xs font-bold uppercase transition-all text-left ${character.species === s.name ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_var(--primary-glow)]' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                                }`}
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Background</label>
                                <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                    {([
                                        { name: 'Acolyte', tip: 'Devoted to a temple. Proficient in Insight & Religion.' },
                                        { name: 'Charlatan', tip: 'Master of deception and false identities. Proficient in Deception & Sleight of Hand.' },
                                        { name: 'Criminal', tip: 'Experienced lawbreaker. Proficient in Deception & Stealth.' },
                                        { name: 'Entertainer', tip: 'Performer and crowd-pleaser. Proficient in Acrobatics & Performance.' },
                                        { name: 'Folk Hero', tip: 'Common-born champion. Proficient in Animal Handling & Survival.' },
                                        { name: 'Gladiator', tip: 'Arena combatant and showman. Proficient in Acrobatics & Performance.' },
                                        { name: 'Guild Artisan', tip: 'Skilled craftsperson. Proficient in Insight & Persuasion.' },
                                        { name: 'Hermit', tip: 'Lived in seclusion and discovered a secret. Proficient in Medicine & Religion.' },
                                        { name: 'Knight', tip: 'Noble warrior with retainers. Proficient in History & Persuasion.' },
                                        { name: 'Noble', tip: 'Born to privilege and power. Proficient in History & Persuasion.' },
                                        { name: 'Outlander', tip: 'Raised in the wilds. Proficient in Athletics & Survival.' },
                                        { name: 'Pirate', tip: 'Sailed the seas as a buccaneer. Proficient in Athletics & Perception.' },
                                        { name: 'Sage', tip: 'Scholar and researcher. Proficient in Arcana & History.' },
                                        { name: 'Sailor', tip: 'Experienced on the open sea. Proficient in Athletics & Perception.' },
                                        { name: 'Soldier', tip: 'Military veteran. Proficient in Athletics & Intimidation.' },
                                        { name: 'Spy', tip: 'Covert intelligence operative. Proficient in Deception & Stealth.' },
                                        { name: 'Urchin', tip: 'Grew up on the streets. Proficient in Sleight of Hand & Stealth.' },
                                        { name: 'Haunted One', tip: 'Touched by darkness and horror. Proficient in two from Arcana, Investigation, Religion, or Survival.' },
                                        { name: 'Far Traveler', tip: 'From a distant land. Proficient in Insight & Perception.' },
                                        { name: 'Courtier', tip: 'Navigates courts and politics. Proficient in Insight & Persuasion.' },
                                        { name: 'Clan Crafter', tip: 'Artisan tied to a dwarven clan. Proficient in History & Insight.' },
                                        { name: 'City Watch', tip: 'Served in a city guard. Proficient in Athletics & Insight.' },
                                        { name: 'Faction Agent', tip: 'Operative for a powerful faction. Proficient in Insight and one Intelligence, Wisdom, or Charisma skill.' },
                                        { name: 'Inheritor', tip: 'Inherited a special item or legacy. Proficient in Survival and one from Arcana, History, or Religion.' },
                                        { name: 'Mercenary Veteran', tip: 'Sellsword for hire. Proficient in Athletics & Persuasion.' },
                                        { name: 'Waterdhavian Noble', tip: 'Aristocrat of Waterdeep. Proficient in History & Persuasion.' },
                                        { name: 'Anthropologist', tip: 'Studied other cultures extensively. Proficient in Insight & Religion.' },
                                        { name: 'Archaeologist', tip: 'Unearths lost civilizations. Proficient in History & Survival.' },
                                    ] as { name: string; tip: string }[]).map(b => (
                                        <button
                                            key={b.name}
                                            onClick={() => setCharacter({ ...character, background: b.name })}
                                            title={b.tip}
                                            className={`p-3 rounded-lg border text-[10px] font-bold uppercase transition-all relative group/bg ${character.background === b.name ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                                }`}
                                        >
                                            {b.name}
                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-[9px] normal-case font-normal text-slate-300 whitespace-normal w-48 text-center opacity-0 group-hover/bg:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl leading-relaxed">
                                                {b.tip}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'stats':
                return (
                    <div className="space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="max-w-md">
                                <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight mb-2">Determine Ability Scores</h2>
                                <div className="bg-primary/5 border-l-2 border-primary/30 p-4 rounded-r-xl mb-4">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Standard 5e Rules</p>
                                    <p className="text-xs text-slate-300 leading-relaxed italic">
                                        Roll four 6-sided dice (4d6) and record the cumulative total of the highest three dice. Repeat this process until you have six numbers.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => { setRollingMode('direct'); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase border ${rollingMode === 'direct' ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                    Direct Edit
                                </button>
                                <button onClick={() => { setRollingMode('step-by-step'); setCurrentRollingAbilityIndex(0); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase border ${rollingMode === 'step-by-step' ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                    Step-by-Step
                                </button>
                                <button onClick={rollAllStats} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase border ${rollingMode === 'quick' ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                    Generate Pool
                                </button>
                                <button onClick={() => { setRollingMode('manual'); setStatPool([0, 0, 0, 0, 0, 0]); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase border ${rollingMode === 'manual' ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                    Manual Pool
                                </button>
                            </div>
                        </div>

                        {/* Stat Pool Area */}
                        {(rollingMode === 'quick' || rollingMode === 'manual') && (
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Scores Reservoir</h4>
                                    <div className="flex items-center gap-4">
                                        <p className="text-[9px] text-slate-600 font-bold uppercase italic">Select a score then tap an ability below to assign</p>
                                        <button
                                            onClick={() => {
                                                const emptyPool = Array(6).fill(0);
                                                setStatPool(emptyPool);
                                                setRollingMode('manual');
                                            }}
                                            className="text-[8px] font-black text-primary border border-primary/20 px-2 py-1 rounded hover:bg-primary/10 transition-all uppercase"
                                        >
                                            Reset Pool
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                    {statPool.map((score, idx) => (
                                        <div key={idx} className="space-y-2">
                                            {rollingMode === 'manual' ? (
                                                <div className="flex flex-col gap-1">
                                                    <input
                                                        type="number"
                                                        value={score || ''}
                                                        placeholder="Total"
                                                        onChange={(e) => {
                                                            const newPool = [...statPool];
                                                            newPool[idx] = parseInt(e.target.value) || 0;
                                                            setStatPool(newPool);
                                                        }}
                                                        className="h-10 bg-slate-900 border border-white/10 rounded-lg text-lg font-black text-slate-100 text-center outline-none focus:border-primary/50 transition-all"
                                                    />
                                                    <div className="flex justify-center gap-1">
                                                        <span className="text-[7px] text-slate-500 font-black uppercase">Stat #{idx + 1}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedPoolIndex(selectedPoolIndex === idx ? null : idx)}
                                                    className={`w-full h-14 rounded-xl border-2 font-black text-xl transition-all shadow-lg flex items-center justify-center ${selectedPoolIndex === idx
                                                        ? 'bg-primary text-black border-primary scale-105'
                                                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30'
                                                        }`}
                                                >
                                                    {score}
                                                </button>
                                            )}
                                            {rollingMode === 'manual' && score > 0 && (
                                                <button
                                                    onClick={() => setSelectedPoolIndex(selectedPoolIndex === idx ? null : idx)}
                                                    className={`w-full py-1 rounded text-[8px] font-black uppercase transition-all ${selectedPoolIndex === idx ? 'bg-primary text-black' : 'bg-white/10 text-slate-400 hover:text-white'}`}
                                                >
                                                    {selectedPoolIndex === idx ? 'Selected' : 'Assign'}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {ABILITIES.map((ability, idx) => {
                                const isTargeted = selectedAbility && selectedAbility !== ability;
                                const isSource = selectedAbility === ability;
                                const mod = Math.floor((character.stats[ability] - 10) / 2);

                                if (rollingMode === 'direct') {
                                    return (
                                        <div key={ability} className="obsidian-panel rounded-xl p-4 text-center border-t border-white/10">
                                            <LoreTooltip content={loreData.stats[ability]}>
                                                <div className="flex items-center justify-center gap-1 mb-2">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{ability}</p>
                                                    <span className="material-symbols-outlined text-[10px] text-slate-700">info</span>
                                                </div>
                                            </LoreTooltip>
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setCharacter({ ...character, stats: { ...character.stats, [ability]: Math.max(1, character.stats[ability] - 1) } })}
                                                    className="size-7 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center text-sm font-black"
                                                >−</button>
                                                <input
                                                    type="number"
                                                    value={character.stats[ability]}
                                                    onChange={(e) => setCharacter({ ...character, stats: { ...character.stats, [ability]: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)) } })}
                                                    className="w-14 h-10 bg-slate-900 border border-white/10 rounded-lg text-2xl font-black text-slate-100 text-center outline-none focus:border-primary/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                    onClick={() => setCharacter({ ...character, stats: { ...character.stats, [ability]: Math.min(30, character.stats[ability] + 1) } })}
                                                    className="size-7 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center text-sm font-black"
                                                >+</button>
                                            </div>
                                            <div className="mt-2 text-xs font-bold text-primary bg-primary/10 py-1 rounded">
                                                {mod >= 0 ? '+' : ''}{mod}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={ability}
                                        onClick={() => {
                                            if (selectedPoolIndex !== null) {
                                                assignFromPool(ability, selectedPoolIndex);
                                            } else if (selectedAbility) {
                                                if (selectedAbility === ability) setSelectedAbility(null);
                                                else swapStats(selectedAbility, ability);
                                            } else {
                                                setSelectedAbility(ability);
                                            }
                                        }}
                                        className={`obsidian-panel rounded-xl p-4 text-center border-t transition-all cursor-pointer group relative ${isSource ? 'border-primary ring-2 ring-primary bg-primary/10' :
                                            isTargeted ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' :
                                                'border-white/10 opacity-80 hover:opacity-100 hover:border-white/30'
                                            }`}
                                    >
                                        <LoreTooltip content={loreData.stats[ability]}>
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-primary transition-colors">{ability}</p>
                                                <span className="material-symbols-outlined text-[10px] text-slate-700">info</span>
                                            </div>
                                        </LoreTooltip>

                                        <p className="text-3xl font-black text-slate-100">{character.stats[ability]}</p>

                                        <div className="mt-2 text-xs font-bold text-primary bg-primary/10 py-1 rounded">
                                            {mod >= 0 ? '+' : ''}{mod}
                                        </div>

                                        {isSource && (
                                            <div className="absolute inset-0 bg-primary/10 flex flex-col items-center justify-center rounded-xl">
                                                <span className="material-symbols-outlined text-primary mb-1">swap_horiz</span>
                                                <span className="text-[7px] font-black text-primary uppercase">Swap With...</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {rollingMode === 'step-by-step' && currentRollingAbilityIndex <= 5 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-6 py-8 border-t border-white/5">
                                <div className="flex gap-4">
                                    {tempRolls.length > 0 ? tempRolls.map((r, i) => (
                                        <div key={i} className="size-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-slate-300">
                                            {r}
                                        </div>
                                    )) : Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="size-12 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-slate-700">
                                            ?
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={rollSingleAbility}
                                    className="bg-primary text-black px-12 py-3 rounded-xl font-black uppercase text-[11px] tracking-widest hover:scale-105 transition-all primary-glow border-t border-white/20"
                                >
                                    {tempRolls.length > 0 ? 'Roll Next Score' : `ROLL FOR ${ABILITIES[currentRollingAbilityIndex]}`}
                                </button>
                            </motion.div>
                        )}
                    </div>
                );
            case 'details':
                return (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Character Details</h2>
                            <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/20 flex items-center gap-6">
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] block">Character Level</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Tier {Math.ceil((character.level || 1) / 5)} Hero</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCharacter({ ...character, level: Math.max(1, (character.level || 1) - 1) })}
                                        className="size-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-500 transition-all text-slate-400"
                                    >
                                        <span className="material-symbols-outlined text-sm">remove</span>
                                    </button>
                                    <div className="text-2xl font-black text-primary w-8 text-center tabular-nums">
                                        {character.level || 1}
                                    </div>
                                    <button
                                        onClick={() => setCharacter({ ...character, level: Math.min(20, (character.level || 1) + 1) })}
                                        className="size-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-500 transition-all text-slate-400"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Character Name</label>
                                <input
                                    type="text"
                                    value={character.name}
                                    onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-slate-100 focus:border-primary/50 outline-none transition-all"
                                    placeholder="e.g. Valerius Moonwhisper"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Pronouns</label>
                                <input
                                    type="text"
                                    value={character.pronouns}
                                    onChange={(e) => setCharacter({ ...character, pronouns: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-slate-100 focus:border-primary/50 outline-none transition-all"
                                    placeholder="e.g. He/Him"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Character Portrait</label>
                                <div className="flex items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden">
                                    <div className="size-24 rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-600 group-hover:text-primary transition-all relative overflow-hidden">
                                        {character.image ? (
                                            <img src={character.image} alt="Portrait Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                                                <span className="text-[8px] font-black uppercase mt-1">Upload</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-grow space-y-2">
                                        <p className="text-xs text-slate-400 font-medium">Select a portrait for your hero. High-quality square images work best.</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => { /* Placeholder for AI generation or gallery */ }} className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-primary/70">Browse Gallery</button>
                                            <span className="text-white/10 text-[10px]">•</span>
                                            <button onClick={() => setCharacter({ ...character, image: '' })} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-400">Remove</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Alignment</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.keys(loreData.alignments).map(a => (
                                        <LoreTooltip key={a} content={(loreData.alignments as any)[a]}>
                                            <button
                                                onClick={() => setCharacter({ ...character, alignment: a })}
                                                className={`w-full p-2 rounded border text-[10px] font-bold uppercase transition-all ${character.alignment === a ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-400'
                                                    }`}
                                            >
                                                {a}
                                            </button>
                                        </LoreTooltip>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'skills':
                const selectedClass = classesData.find(c => c.name === character.class);
                const maxSkills = (selectedClass as any)?.skillCount || 2;
                const skillsRemaining = maxSkills - character.skills.length;

                return (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight mb-2">Skill Proficiencies</h2>
                            <div className="bg-primary/5 border-l-2 border-primary/30 p-5 rounded-r-2xl mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary text-sm">psychology_alt</span>
                                    <h4 className="text-[11px] font-black text-slate-200 uppercase tracking-widest">What are Proficiencies?</h4>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                    Proficiency represents your hero's specialized training. When you use a skill you are proficient in, you add your <strong className="text-primary">+2 Proficiency Bonus</strong> to the roll, making failure far less likely.
                                </p>
                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Selection Limit for {character.class || 'Hero'}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-black ${skillsRemaining === 0 ? 'text-primary' : skillsRemaining < 0 ? 'text-red-500' : 'text-slate-300'}`}>
                                            {character.skills.length} / {maxSkills}
                                        </span>
                                        {skillsRemaining > 0 && <span className="text-[9px] font-bold text-primary animate-pulse uppercase tracking-tighter">Select {skillsRemaining} More</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {SKILLS_LIST.map(skill => (
                                <LoreTooltip key={skill} content={(loreData.skills as any)[skill]}>
                                    <button
                                        onClick={() => toggleSkill(skill)}
                                        disabled={skillsRemaining <= 0 && !character.skills.includes(skill)}
                                        className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all group ${character.skills.includes(skill)
                                            ? 'bg-primary/10 border-primary shadow-[0_0_15px_var(--primary-glow)]'
                                            : skillsRemaining <= 0
                                                ? 'bg-white/5 border-white/5 opacity-40 cursor-not-allowed'
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-black uppercase tracking-tight transition-colors ${character.skills.includes(skill) ? 'text-primary' : 'text-slate-400 group-hover:text-slate-200'}`}>{skill}</span>
                                            <span className="text-[8px] text-slate-600 font-bold uppercase mt-0.5 group-hover:text-slate-500 transition-colors">Lore Available</span>
                                        </div>
                                        {character.skills.includes(skill) && <span className="material-symbols-outlined text-primary text-sm">check_circle</span>}
                                    </button>
                                </LoreTooltip>
                            ))}
                        </div>
                    </div>
                );
            case 'abilities':
                const filteredByClass = abilitiesData.filter(a => a.class === character.class || character.class === '');
                const featsList = featsData.filter(f =>
                    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    f.description.toLowerCase().includes(searchTerm.toLowerCase())
                );
                const finalFiltered = filteredByClass.filter(a =>
                    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    a.description.toLowerCase().includes(searchTerm.toLowerCase())
                );

                return (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight mb-2">Features & Feats</h2>
                                <p className="text-slate-400 text-sm">Select the traits, special powers, and feats that define your hero.</p>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                                <input
                                    type="text"
                                    placeholder="Search features..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2 text-sm text-slate-100 focus:border-primary/50 outline-none w-64 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {/* Class Features */}
                            {finalFiltered.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] pl-1">Class Features</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {finalFiltered.map(ability => (
                                            <button
                                                key={ability.id}
                                                onClick={() => toggleAbility(ability.id)}
                                                className={`p-5 rounded-2xl border text-left transition-all group relative overflow-hidden ${(character.abilities || []).includes(ability.id)
                                                    ? 'bg-primary/10 border-primary shadow-[0_0_20px_var(--primary-glow)]'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">{ability.class} • Level {ability.level}</span>
                                                        <h4 className="font-black text-slate-100 uppercase tracking-tight">{ability.name}</h4>
                                                    </div>
                                                    {(character.abilities || []).includes(ability.id) && (
                                                        <span className="material-symbols-outlined text-primary">check_circle</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 leading-relaxed italic line-clamp-2 group-hover:line-clamp-none transition-all">{ability.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* General Feats */}
                            {featsList.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] pl-1">General Feats</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {featsList.map(feat => (
                                            <button
                                                key={feat.id}
                                                onClick={() => toggleAbility(feat.id)}
                                                className={`p-5 rounded-2xl border text-left transition-all group relative overflow-hidden ${(character.abilities || []).includes(feat.id)
                                                    ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">General Feat</span>
                                                        <h4 className="font-black text-slate-100 uppercase tracking-tight">{feat.name}</h4>
                                                    </div>
                                                    {(character.abilities || []).includes(feat.id) && (
                                                        <span className="material-symbols-outlined text-amber-500">check_circle</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 leading-relaxed italic line-clamp-2 group-hover:line-clamp-none transition-all">{feat.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Custom Feats */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pl-1">
                                    <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Custom Feats & Features</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                                    {/* Create New Custom Feat Card */}
                                    <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                placeholder="Custom Feature Name..."
                                                value={customFeatName}
                                                onChange={(e) => setCustomFeatName(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-rose-500/50 transition-all font-bold"
                                            />
                                            <textarea
                                                placeholder="Effect description..."
                                                value={customFeatDesc}
                                                onChange={(e) => setCustomFeatDesc(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-slate-400 outline-none focus:border-rose-500/50 transition-all h-16 resize-none italic"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (!customFeatName) return;
                                                const newFeat = {
                                                    id: `custom-${Date.now()}`,
                                                    name: customFeatName,
                                                    description: customFeatDesc
                                                };
                                                setCharacter({
                                                    ...character,
                                                    customAbilities: [...(character.customAbilities || []), newFeat]
                                                });
                                                setCustomFeatName('');
                                                setCustomFeatDesc('');
                                            }}
                                            className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span>
                                            Add Custom Feat
                                        </button>
                                    </div>

                                    {/* Existing Custom Feats */}
                                    {(character.customAbilities || []).map((feat: any) => (
                                        <div
                                            key={feat.id}
                                            className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-left transition-all relative overflow-hidden group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">Custom Character Trait</span>
                                                    <h4 className="font-black text-slate-100 uppercase tracking-tight">{feat.name}</h4>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setCharacter({
                                                            ...character,
                                                            customAbilities: character.customAbilities.filter((f: any) => f.id !== feat.id)
                                                        });
                                                    }}
                                                    className="material-symbols-outlined text-rose-500/50 hover:text-rose-500 text-sm transition-colors"
                                                >
                                                    delete
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed italic line-clamp-2 group-hover:line-clamp-none transition-all">{feat.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'equipment':
                const toggleEquipment = (id: string) => {
                    const current = character.equipment || [];
                    if (current.includes(id)) {
                        setCharacter({ ...character, equipment: current.filter((item: string) => item !== id) });
                    } else {
                        setCharacter({ ...character, equipment: [...current, id] });
                    }
                };

                return (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight mb-2">Adventuring Gear</h2>
                                <p className="text-slate-400 text-sm">Select your starting equipment and supplies.</p>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                                <input
                                    type="text"
                                    placeholder="Filter equipment..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2 text-sm text-slate-100 focus:border-primary/50 outline-none w-64 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {['Armor', 'Weapon', 'Focus', 'Gear', 'Tools', 'Consumable'].map(category => {
                                const items = equipmentData.filter(e =>
                                    e.type === category &&
                                    (e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        e.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                                );

                                if (items.length === 0) return null;

                                return (
                                    <div key={category} className="space-y-4">
                                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] pl-1">{category === 'Focus' ? 'Focuses' : `${category}s`}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {items.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => toggleEquipment(item.id)}
                                                    className={`p-5 rounded-2xl border text-left transition-all group relative overflow-hidden ${(character.equipment || []).includes(item.id)
                                                        ? 'bg-primary/10 border-primary shadow-[0_0_20px_var(--primary-glow)]'
                                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <span className="text-[9px] font-black text-primary/50 uppercase tracking-widest block mb-0.5">{item.type}</span>
                                                            <h3 className="font-black text-slate-100 uppercase tracking-tight">{item.name}</h3>
                                                        </div>
                                                        {(character.equipment || []).includes(item.id) && (
                                                            <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 leading-relaxed italic line-clamp-2 group-hover:line-clamp-none transition-all">{item.description}</p>
                                                    <div className="mt-3 flex gap-2">
                                                        {(item as any).ac && <span className="text-[8px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded">AC: {(item as any).ac}</span>}
                                                        {(item as any).damage && <span className="text-[8px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded">DMG: {(item as any).damage}</span>}
                                                        {(item as any).weight && <span className="text-[8px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded">{(item as any).weight}</span>}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case 'spells':
                const martialClasses = ['Barbarian', 'Fighter', 'Monk', 'Rogue'];
                const isCaster = !martialClasses.includes(character.class);

                if (!isCaster) {
                    return (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                            <div className="size-20 rounded-3xl bg-white/5 flex items-center justify-center text-slate-700 animate-pulse">
                                <span className="material-symbols-outlined text-4xl">auto_fix_off</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-300 uppercase tracking-tight">Martial Focus</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">
                                    As a <span className="text-primary font-bold">{character.class}</span>, you focus on physical prowess rather than spellcasting.
                                </p>
                            </div>
                            <button onClick={nextStep} className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/30 pb-1 hover:text-primary/70 transition-all">Skip to Review</button>
                        </div>
                    );
                }

                // Spellcasting progression helper
                const getProgression = (level: number, className: string) => {
                    const isFullCaster = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'].includes(className);
                    const isHalfCaster = ['Paladin', 'Ranger'].includes(className);
                    const isWarlock = className === 'Warlock';

                    let cantrips = 0;
                    let spellsKnown = 0;
                    let maxSpellLevel = Math.ceil(level / 2);

                    if (isFullCaster) {
                        cantrips = level >= 10 ? 5 : (level >= 4 ? 4 : (level >= 1 ? 3 : 2));
                        spellsKnown = level + 3; // Simplified: 5e uses different tables, but Level + Mod is common
                    } else if (isWarlock) {
                        cantrips = level >= 10 ? 4 : (level >= 4 ? 3 : 2);
                        spellsKnown = level + 1;
                    } else if (isHalfCaster) {
                        cantrips = 0;
                        spellsKnown = Math.floor(level / 2) + 2;
                        maxSpellLevel = Math.ceil(level / 4);
                    }

                    return {
                        cantrips: cantrips || 2,
                        spells: spellsKnown || 4,
                        maxSpellLevel: Math.min(maxSpellLevel || 1, 9)
                    };
                };

                const progression = getProgression(character.level, character.class);
                const selectedCantripsCount = (character.spells || []).filter((sId: string) => {
                    const s = spellsData.find((sd: any) => sd.id === sId);
                    return s ? s.level === 0 : false;
                }).length;
                const selectedSpellsCount = (character.spells || []).filter((sId: string) => {
                    const s = spellsData.find((sd: any) => sd.id === sId);
                    return s ? s.level > 0 : false;
                }).length;

                const filteredSpells = spellsData.filter((s: any) => {
                    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesMaxLevel = s.level <= progression.maxSpellLevel;
                    const matchesFilter = spellLevelFilter === 'all' || s.level === spellLevelFilter;
                    return matchesSearch && matchesMaxLevel && matchesFilter;
                });

                const toggleSpell = (spellId: string) => {
                    const currentSpells = character.spells || [];
                    if (currentSpells.includes(spellId)) {
                        setCharacter({ ...character, spells: currentSpells.filter((id: string) => id !== spellId) });
                    } else {
                        setCharacter({ ...character, spells: [...currentSpells, spellId] });
                    }
                };

                return (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight mb-1">Innate Magic</h2>
                                <p className="text-slate-400 text-sm">Select your starting cantrips and 1st-level spells.</p>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                                <input
                                    type="text"
                                    placeholder="Filter spells..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2 text-sm text-slate-100 focus:border-primary/50 outline-none w-64 transition-all"
                                />
                            </div>
                        </div>

                        {/* Level Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            <button
                                onClick={() => setSpellLevelFilter('all')}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${spellLevelFilter === 'all' ? 'bg-primary text-black border-primary' : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'}`}
                            >
                                All Ranks
                            </button>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(l => l <= progression.maxSpellLevel).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setSpellLevelFilter(l)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${spellLevelFilter === l ? 'bg-primary text-black border-primary' : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'}`}
                                >
                                    {l === 0 ? 'Cantrips' : `Rank ${l}`}
                                </button>
                            ))}
                        </div>

                        {/* Selected Spells Summary */}
                        {(character.spells || []).length > 0 && (
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-wrap gap-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest w-full mb-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                                    CHOSEN SPELLS & CANTRIPS
                                </span>
                                <div className="flex flex-wrap gap-2 w-full">
                                    <div className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter ${selectedCantripsCount > progression.cantrips ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                        Cantrips: {selectedCantripsCount} / {progression.cantrips}
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter ${selectedSpellsCount > progression.spells ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                        Spells: {selectedSpellsCount} / {progression.spells}
                                    </div>
                                    <div className="px-3 py-1 rounded-lg border border-primary/20 bg-primary/5 text-[9px] font-black text-primary uppercase tracking-tighter">
                                        Max Rank: Level {progression.maxSpellLevel}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5 w-full">
                                    {character.spells.map((sId: string) => {
                                        const spell = spellsData.find((s: any) => s.id === sId);
                                        return (
                                            <button
                                                key={sId}
                                                onClick={() => toggleSpell(sId)}
                                                className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-[10px] font-bold text-primary hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 transition-all flex items-center gap-1.5 group"
                                            >
                                                {spell?.name || sId}
                                                <span className="material-symbols-outlined text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">close</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredSpells.map((spell: any) => (
                                <div
                                    key={spell.id}
                                    className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${(character.spells || []).includes(spell.id)
                                        ? 'bg-primary/10 border-primary shadow-[0_0_20px_var(--primary-glow)]'
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <button
                                            onClick={() => toggleSpell(spell.id)}
                                            className="flex-grow text-left"
                                        >
                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest block mb-0.5">{spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.school}</span>
                                            <h3 className="font-black text-slate-100 uppercase tracking-tight">{spell.name}</h3>
                                        </button>
                                        <div className="flex items-center gap-2">
                                            {(character.spells || []).includes(spell.id) && (
                                                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                            )}
                                            <button
                                                onClick={() => setExpandedSpell(expandedSpell === spell.id ? null : spell.id)}
                                                className={`material-symbols-outlined text-sm transition-all ${expandedSpell === spell.id ? 'text-primary rotate-180' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                expand_more
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`transition-all duration-300 overflow-hidden ${expandedSpell === spell.id ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-12 opacity-60'}`}>
                                        <p className={`text-[10px] text-slate-400 leading-relaxed italic ${expandedSpell === spell.id ? '' : 'line-clamp-2'}`}>
                                            {spell.description}
                                        </p>
                                        {expandedSpell === spell.id && (
                                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                                <div className="flex gap-4">
                                                    <div className="text-[8px] font-black uppercase text-slate-500">
                                                        <span className="block text-slate-600 mb-0.5">Time</span>
                                                        <span className="text-slate-300">{spell.time}</span>
                                                    </div>
                                                    <div className="text-[8px] font-black uppercase text-slate-500">
                                                        <span className="block text-slate-600 mb-0.5">Range</span>
                                                        <span className="text-slate-300">{spell.range}</span>
                                                    </div>
                                                </div>
                                                {spell.webLink && (
                                                    <a
                                                        href={spell.webLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline"
                                                    >
                                                        Details
                                                        <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'review':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Review Character</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="obsidian-panel rounded-xl p-6 space-y-4 border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="size-16 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-3xl font-black relative overflow-hidden">
                                        {character.image ? (
                                            <Image src={character.image} alt="Portrait" fill className="object-cover" />
                                        ) : (
                                            character.name[0] || '?'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-100">{character.name || 'Unnamed hero'}</h3>
                                        <p className="text-primary text-xs font-bold uppercase tracking-widest">Level {character.level} {character.species} {character.class}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase text-slate-400">
                                    <div className="bg-white/5 p-2 rounded">
                                        <span className="text-slate-600 block mb-1">Background</span>
                                        <span className="text-slate-200">{character.background || 'None'}</span>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded">
                                        <span className="text-slate-600 block mb-1">Alignment</span>
                                        <span className="text-slate-200">{character.alignment}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="obsidian-panel rounded-xl p-6 border border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Ability Scores</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(character.stats).map(([k, v]: [string, any]) => (
                                        <div key={k} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                                            <p className="text-[8px] text-slate-500 font-bold uppercase">{k}</p>
                                            <p className="text-lg font-black text-slate-200">{v}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="obsidian-panel rounded-xl p-6 md:col-span-2 border border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Core Abilities & Features</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(character.abilities || []).map((aId: string) => {
                                        const ability = abilitiesData.find((a: any) => a.id === aId) || featsData.find((f: any) => f.id === aId);
                                        return (
                                            <span key={aId} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-wider">
                                                {ability?.name || aId}
                                            </span>
                                        );
                                    })}
                                    {(character.customAbilities || []).map((feat: any) => (
                                        <span key={feat.id} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] font-black text-rose-500 uppercase tracking-wider">
                                            {feat.name}
                                        </span>
                                    ))}
                                    {(!character.abilities?.length && !character.customAbilities?.length) && (
                                        <p className="text-xs text-slate-600 italic">No features selected yet.</p>
                                    )}
                                </div>
                            </div>
                            <div className="obsidian-panel rounded-xl p-6 border border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Primary Gear</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(character.equipment || []).length > 0 ? (character.equipment || []).map((eId: string) => {
                                        const equipment = equipmentData.find((e: any) => e.id === eId);
                                        return (
                                            <span key={eId} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-300 uppercase tracking-wider">
                                                {equipment?.name || eId}
                                            </span>
                                        );
                                    }) : (
                                        <p className="text-xs text-slate-600 italic">No equipment selected.</p>
                                    )}
                                </div>
                            </div>
                            <div className="obsidian-panel rounded-xl p-6 border border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Known Spells</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(character.spells || []).length > 0 ? (character.spells || []).map((sId: string) => {
                                        const spell = spellsData.find((s: any) => s.id === sId);
                                        return (
                                            <span key={sId} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary uppercase tracking-wider">
                                                {spell?.name || sId}
                                            </span>
                                        );
                                    }) : (
                                        <p className="text-xs text-slate-600 italic">No spells selected.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={finishCreation}
                                className="flex-grow bg-primary text-black py-4 rounded-xl font-black uppercase text-[11px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all primary-glow border-t border-white/20"
                            >
                                Forge Hero
                            </button>
                            {(character as any).id && (
                                <Link
                                    href={`/characters/print/${(character as any).id}`}
                                    target="_blank"
                                    className="bg-white/5 border border-white/10 text-slate-300 px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">print</span>
                                    Print
                                </Link>
                            )}
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-slate-600"><span className="material-symbols-outlined text-3xl">construction</span></div>
                        <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">{step} Step In Progress</h3>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex bg-slate-950 overflow-hidden font-sans antialiased text-slate-100">
            {/* Sidebar */}
            {renderSidebar()}

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col relative h-full">
                {/* Header/Breadcrumbs */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Step {STEPS.findIndex(s => s.id === step) + 1} of 9</span>
                        <span className="text-white/10 text-xs">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{STEPS.find(s => s.id === step)?.label}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Auto-Saving Enabled</span>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="material-symbols-outlined text-slate-500 hover:text-white transition-colors"
                        >
                            close
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-grow overflow-y-auto p-12 custom-scrollbar">
                    <div className="max-w-5xl mx-auto h-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full"
                            >
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                {/* Footer Controls */}
                <footer className="h-20 border-t border-white/5 flex items-center justify-between px-12 bg-slate-950/90 backdrop-blur-md">
                    <button
                        onClick={prevStep}
                        disabled={step === 'class'}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${step === 'class' ? 'opacity-0' : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Previous Phase
                    </button>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleCancel}
                            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
                        >
                            Abandon Forge
                        </button>
                        <button
                            onClick={step === 'review' ? handleFinish : nextStep}
                            className="bg-primary text-black px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all primary-glow flex items-center gap-2"
                        >
                            {step === 'review' ? 'Forge Hero' : 'Next Protocol'}
                            <span className="material-symbols-outlined text-sm">
                                {step === 'review' ? 'verified' : 'arrow_forward'}
                            </span>
                        </button>
                    </div>
                </footer>
            </div>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
