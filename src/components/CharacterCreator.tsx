"use client";

import React, { useState } from 'react';
import { DiceEngine } from '@/lib/dice';
import { motion, AnimatePresence } from 'framer-motion';

type CreationStep = 'class' | 'origin' | 'stats' | 'details' | 'skills' | 'equipment' | 'spells' | 'review';

const SKILLS_LIST = [
    "Athletics", "Acrobatics", "Sleight of Hand", "Stealth",
    "Arcana", "History", "Investigation", "Nature", "Religion",
    "Animal Handling", "Insight", "Medicine", "Perception", "Survival",
    "Deception", "Intimidation", "Performance", "Persuasion"
];

export default function CharacterCreator() {
    const [step, setStep] = useState<CreationStep>('class');
    const [character, setCharacter] = useState({
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
        equipment: [] as string[],
        spells: [] as string[],
        appearance: '',
        backstory: '',
    });

    const nextStep = () => {
        const steps: CreationStep[] = ['class', 'origin', 'stats', 'details', 'skills', 'equipment', 'spells', 'review'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1]);
        }
    };

    const prevStep = () => {
        const steps: CreationStep[] = ['class', 'origin', 'stats', 'details', 'skills', 'equipment', 'spells', 'review'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        }
    };

    const rollStats = () => {
        const newStats = {
            STR: DiceEngine.roll('4d6').total,
            DEX: DiceEngine.roll('4d6').total,
            CON: DiceEngine.roll('4d6').total,
            INT: DiceEngine.roll('4d6').total,
            WIS: DiceEngine.roll('4d6').total,
            CHA: DiceEngine.roll('4d6').total,
        };
        setCharacter({ ...character, stats: newStats });
    };

    const toggleSkill = (skill: string) => {
        if (character.skills.includes(skill)) {
            setCharacter({ ...character, skills: character.skills.filter(s => s !== skill) });
        } else {
            setCharacter({ ...character, skills: [...character.skills, skill] });
        }
    };

    const renderCurrentStep = () => {
        switch (step) {
            case 'class':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Choose Your Class</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            {['Paladin', 'Wizard', 'Rogue', 'Fighter', 'Cleric', 'Bard'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCharacter({ ...character, class: c })}
                                    className={`p-6 rounded-xl border transition-all text-left group ${character.class === c
                                            ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(251,191,36,0.1)]'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                                        }`}
                                >
                                    <span className="block font-black uppercase text-lg group-hover:tracking-wider transition-all">{c}</span>
                                    <span className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">Core Class</span>
                                </button>
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
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Species</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Human', 'Elf', 'Dwarf', 'Dragonborn', 'Tiefling', 'Halfling'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setCharacter({ ...character, species: s })}
                                            className={`p-4 rounded-lg border text-xs font-bold uppercase transition-all ${character.species === s ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Background</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Acolyte', 'Soldier', 'Criminal', 'Sage', 'Noble', 'Folk Hero'].map(b => (
                                        <button
                                            key={b}
                                            onClick={() => setCharacter({ ...character, background: b })}
                                            className={`p-4 rounded-lg border text-xs font-bold uppercase transition-all ${character.background === b ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                                }`}
                                        >
                                            {b}
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
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight mb-2">Ability Scores</h2>
                                <p className="text-slate-400 text-sm">Physical and mental attributes.</p>
                            </div>
                            <button onClick={rollStats} className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-lg text-xs font-black transition-all primary-glow">
                                <span className="material-symbols-outlined text-sm">casino</span> ROLL 4d6
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {(Object.entries(character.stats) as [keyof typeof character.stats, number][]).map(([key, val]) => (
                                <div key={key} className="obsidian-panel rounded-xl p-4 text-center border-t border-white/10 transition-all">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">{key}</p>
                                    <p className="text-3xl font-black text-slate-100">{val}</p>
                                    <div className="mt-2 text-xs font-bold text-primary bg-primary/10 py-1 rounded">
                                        {Math.floor((val - 10) / 2) >= 0 ? '+' : ''}{Math.floor((val - 10) / 2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'details':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Character Details</h2>
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
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Alignment</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'].map(a => (
                                        <button
                                            key={a}
                                            onClick={() => setCharacter({ ...character, alignment: a })}
                                            className={`p-2 rounded border text-[10px] font-bold uppercase transition-all ${character.alignment === a ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-400'
                                                }`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'skills':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Skill Proficiencies</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {SKILLS_LIST.map(skill => (
                                <button
                                    key={skill}
                                    onClick={() => toggleSkill(skill)}
                                    className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${character.skills.includes(skill) ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(251,191,36,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <span className={`text-xs font-bold uppercase ${character.skills.includes(skill) ? 'text-primary' : 'text-slate-400'}`}>{skill}</span>
                                    {character.skills.includes(skill) && <span className="material-symbols-outlined text-primary text-sm">check_circle</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'review':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Review Character</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="obsidian-panel rounded-xl p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-black">{character.name[0]}</div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-100">{character.name || 'Unnamed hero'}</h3>
                                        <p className="text-primary text-xs font-bold uppercase tracking-widest">Level 1 {character.species} {character.class}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase">
                                    <div><span className="text-slate-500">Backround:</span> <span className="text-slate-200">{character.background}</span></div>
                                    <div><span className="text-slate-500">Alignment:</span> <span className="text-slate-200">{character.alignment}</span></div>
                                </div>
                            </div>
                            <div className="obsidian-panel rounded-xl p-6">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Final Stats</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(character.stats).map(([k, v]) => (
                                        <div key={k} className="bg-white/5 rounded p-2 text-center">
                                            <p className="text-[8px] text-slate-500 font-bold">{k}</p>
                                            <p className="text-lg font-black text-slate-200">{v}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
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
        <div className="max-w-4xl mx-auto p-8">
            {/* Progress Stepper */}
            <div className="flex justify-between mb-12 border-b border-white/10 pb-4 overflow-x-auto gap-4 custom-scrollbar">
                {['Class', 'Origin', 'Stats', 'Details', 'Skills', 'Equipment', 'Spells', 'Review'].map((s) => (
                    <div key={s} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all flex-shrink-0 ${step.toLowerCase() === s.toLowerCase() ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-500'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest">{s}</span>
                    </div>
                ))}
            </div>

            {/* Wizard Content Area */}
            <div className="obsidian-panel rounded-2xl p-8 border border-white/5 relative overflow-hidden min-h-[500px] flex flex-col">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-grow"
                    >
                        {renderCurrentStep()}
                    </motion.div>
                </AnimatePresence>

                {/* Global Navigation Controls */}
                <div className="flex justify-between mt-12 pt-8 border-t border-white/5">
                    <button onClick={prevStep} disabled={step === 'class'} className="px-6 py-2 rounded-lg bg-white/5 text-slate-400 font-bold hover:bg-white/10 disabled:opacity-30 transition-all uppercase text-[10px] tracking-widest">
                        PRECEDING STEP
                    </button>
                    <button onClick={nextStep} disabled={step === 'review'} className="px-8 py-2 rounded-lg bg-primary text-background-dark font-black hover:scale-105 active:scale-95 transition-all primary-glow uppercase text-[10px] tracking-widest">
                        PROCEED
                    </button>
                </div>
            </div>
        </div>
    );
}
