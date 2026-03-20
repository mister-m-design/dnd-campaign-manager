"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Character } from '@/types';
import { useCharacterBuilder } from '@/hooks/useCharacterBuilder';
import { calculateDerivedStats } from '@/lib/rules';
import { ClassAbility } from '@/data/classAbilities';
import { SimpleItem } from '@/data/equipment';

// Steps
import IdentityStep from './steps/IdentityStep';
import ClassStep from './steps/ClassStep';
import StatsStep from './steps/StatsStep';
import ProficiencyStep from './steps/ProficiencyStep';
import FeatureStep from './steps/FeatureStep';
import SpellStep from './steps/SpellStep';
import EquipmentStep from './steps/EquipmentStep';
import ReviewStep from './steps/ReviewStep';

// DM Panel
import DMExpandedPanel from './DMExpandedPanel';

// Top navigation (replaces BuilderSidebar + BuilderFooter)
import BuilderTopNav from './BuilderTopNav';

interface CharacterBuilderProps {
    initialData?: Character;
    isEditing?: boolean;
}

export default function CharacterBuilder({ initialData, isEditing }: CharacterBuilderProps) {
    const router = useRouter();
    const [isDMMode, setIsDMMode] = useState(false);
    const [isDMPanelOpen, setIsDMPanelOpen] = useState(false);

    const {
        step,
        setStep,
        char,
        setChar,
        calculatedChar,
        updateIdentity,
        updateClass,
        updateAbility,
        updateAbilityBonus,
        toggleSkill,
        toggleSpell,
        updateEquipment,
        removeEquipment,
        updateOverride,
        nextStep,
        prevStep,
    } = useCharacterBuilder(initialData);

    // ── DM Mode: add spell override ────────────────────────────────────────────
    const dmAddSpell = (spellId: string, permanent: boolean) => {
        if (permanent) {
            toggleSpell(spellId);
        } else {
            setChar((prev: Character) => ({
                ...prev,
                magic: {
                    ...prev.magic,
                    spells: [...(prev.magic?.spells || []), spellId],
                }
            }));
        }
    };

    // ── DM Mode: add class ability ─────────────────────────────────────────────
    const dmAddAbility = (ability: ClassAbility, permanent: boolean) => {
        const newAction = {
            id: `dm-${ability.id}-${Date.now()}`,
            name: ability.name,
            type: (ability.actionEconomy === 'Bonus Action' ? 'Bonus Action' : ability.actionEconomy === 'Reaction' ? 'Reaction' : 'Action') as any,
            actionType: 'Ability' as const,
            source: permanent ? 'Class' as const : 'Temp' as const,
            description: ability.description,
        };
        setChar((prev: Character) => ({
            ...prev,
            actions: [...(prev.actions || []), newAction],
        }));
    };

    // ── DM Mode: add equipment ─────────────────────────────────────────────────
    const dmAddEquipment = (item: SimpleItem, _permanent: boolean) => {
        updateEquipment(item);
    };

    const handleSave = async () => {
        const charWithLevel = { ...char, level: char.level ?? 1 };
        const finalChar = calculateDerivedStats(charWithLevel);

        // Local Save (legacy backup)
        const characters = JSON.parse(localStorage.getItem('mythic_saved_characters') || '[]');
        let updatedLocals = [...characters];
        if (isEditing) {
            const idx = updatedLocals.findIndex((c: Character) => c.id === finalChar.id);
            if (idx !== -1) updatedLocals[idx] = finalChar;
            else updatedLocals.push(finalChar);
        } else {
            updatedLocals.push(finalChar);
        }
        localStorage.setItem('mythic_saved_characters', JSON.stringify(updatedLocals));

        // Master Sync (API)
        try {
            await fetch('/api/characters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalChar)
            });
        } catch (err) {
            console.error("Master database sync failed:", err);
        }

        router.push('/characters');
    };

    const handleAbort = () => {
        if (confirm("Are you sure you want to abort character creation? All unsaved progress will be lost.")) {
            router.push('/characters');
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 'identity':
                return <IdentityStep char={char} updateIdentity={updateIdentity} />;
            case 'class':
                return <ClassStep char={char} updateClass={updateClass} />;
            case 'stats':
                return <StatsStep char={char} updateAbility={updateAbility} updateAbilityBonus={updateAbilityBonus} />;
            case 'proficiencies':
                return <ProficiencyStep char={char} toggleSkill={toggleSkill} />;
            case 'features':
                return <FeatureStep char={char} />;
            case 'spells':
                return <SpellStep char={char} toggleSpell={toggleSpell} isDMMode={isDMMode} />;
            case 'equipment':
                return <EquipmentStep char={char} updateEquipment={updateEquipment} removeEquipment={removeEquipment} isDMMode={isDMMode} />;
            case 'review':
                return (
                    <ReviewStep
                        char={char}
                        calculatedChar={calculatedChar}
                        updateIdentity={updateIdentity}
                        updateAbility={updateAbility}
                        updateOverride={updateOverride}
                        onSave={handleSave}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex-grow flex flex-col overflow-hidden min-h-[calc(100vh-64px)]" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

            {/* ── TOP NAVIGATION (replaces sidebar + footer) ── */}
            <BuilderTopNav
                currentStep={step}
                setStep={setStep}
                prevStep={prevStep}
                nextStep={nextStep}
                handleSave={handleSave}
                char={char}
                isDMMode={isDMMode}
                setIsDMMode={setIsDMMode}
                isDMPanelOpen={isDMPanelOpen}
                setIsDMPanelOpen={setIsDMPanelOpen}
                onAbort={handleAbort}
            />

            {/* ── CONTENT ROW ── */}
            <div className="flex-grow flex overflow-hidden min-h-0">
                {/* Main scrollable content */}
                <main className="flex-grow overflow-y-auto p-8 md:p-12">
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                {/* ── DM EXPANDED PANEL (right sidebar, slides in) ── */}
                <AnimatePresence>
                    {isDMMode && isDMPanelOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 380, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="shrink-0 border-l border-purple-500/20 bg-[#0A0A0C] overflow-hidden flex flex-col"
                            style={{ minHeight: 0 }}
                        >
                            <div className="flex-1 overflow-y-auto p-4 min-h-0 flex flex-col">
                                <DMExpandedPanel
                                    char={char}
                                    onAddSpell={dmAddSpell}
                                    onAddAbility={dmAddAbility}
                                    onAddEquipment={dmAddEquipment}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
