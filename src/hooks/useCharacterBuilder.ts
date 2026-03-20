import { useState, useMemo } from 'react';
import { Character, Ability } from '@/types';
import { CLASS_REGISTRY, calculateDerivedStats } from '@/lib/rules';
import { generateSafeId } from '@/lib/utils';

export type BuilderStep = 'identity' | 'class' | 'stats' | 'proficiencies' | 'features' | 'spells' | 'equipment' | 'review';

export const STEPS: { id: BuilderStep; label: string; icon: string }[] = [
    { id: 'identity', label: 'Identity', icon: 'person' },
    { id: 'class', label: 'Class', icon: 'swords' },
    { id: 'stats', label: 'Abilities', icon: 'monitoring' },
    { id: 'proficiencies', label: 'Skills', icon: 'psychology' },
    { id: 'features', label: 'Features', icon: 'auto_fix_high' },
    { id: 'spells', label: 'Spells', icon: 'auto_fix_normal' },
    { id: 'equipment', label: 'Equipment', icon: 'backpack' },
    { id: 'review', label: 'Review & Edit', icon: 'edit_note' },
];

export const INITIAL_CHARACTER: Character = {
    id: generateSafeId(),
    name: '',
    species: 'Human',
    class: 'Fighter',
    level: 1,
    abilityScores: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    abilityBonuses: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
    baseAC: 10,
    ac: 10,
    maxHP: 10,
    speed: 30,
    proficiencyBonus: 2,
    actions: [],
    skillProficiencies: [],
    background: 'Acolyte',
    alignment: 'Neutral',
    buildMode: 'Rules Guided',
    overrides: {},
    magic: {
        spells: [],
        cantrips: [],
        preparedSpells: [],
        knownSpells: [],
        spellSlots: {},
        ritualCasting: false,
    },
    resources: {
        inventory: []
    }
};

export function useCharacterBuilder(initialData?: Character) {
    const [step, setStep] = useState<BuilderStep>('identity');
    
    // Remap Prisma flat fields → Character shape (handles both API-loaded and localStorage data)
    const prismaAbilities = initialData ? {
        STR: (initialData as any).strength ?? (initialData as any).str,
        DEX: (initialData as any).dexterity ?? (initialData as any).dex,
        CON: (initialData as any).constitution ?? (initialData as any).con,
        INT: (initialData as any).intelligence ?? (initialData as any).int,
        WIS: (initialData as any).wisdom ?? (initialData as any).wis,
        CHA: (initialData as any).charisma ?? (initialData as any).cha,
    } : {};

    const normalizedInitial = initialData ? ({
        ...INITIAL_CHARACTER,
        ...initialData,
        // Preserve level explicitly — never allow it to fall back to 1
        level: (initialData.level && initialData.level > 0) ? initialData.level : ((initialData as any).progression?.level || 1),
        abilityScores: {
            ...INITIAL_CHARACTER.abilityScores,
            // Filter out undefined values from prismaAbilities
            ...Object.fromEntries(Object.entries(prismaAbilities).filter(([, v]) => v != null && (v as number) > 0)),
            ...(initialData.abilityScores || (initialData as any).abilities || {})
        },
        abilityBonuses: {
            ...INITIAL_CHARACTER.abilityBonuses,
            ...(initialData.abilityBonuses || {})
        },
    } as Character) : INITIAL_CHARACTER;

    const [char, setChar] = useState<Character>(normalizedInitial);

    const calculatedChar = useMemo(() => calculateDerivedStats(char), [char]);

    const updateIdentity = (field: keyof Character, value: any) => {
        setChar(prev => {
            const next = { ...prev, [field]: value };
            // When level changes via identity step, recalculate HP + proficiency bonus
            if (field === 'level') {
                const level = (value as number) || 1;
                const classDef = CLASS_REGISTRY[prev.class];
                const hitDie = classDef?.hitDie ?? 8;
                const conMod = Math.floor((prev.abilityScores.CON - 10) / 2);
                const avgIncrease = Math.floor(hitDie / 2) + 1;
                const scaledHP = level <= 1
                    ? hitDie + conMod
                    : (hitDie + conMod) + (level - 1) * (avgIncrease + conMod);
                next.maxHP = Math.max(1, scaledHP);
                next.proficiencyBonus = Math.floor((level - 1) / 4) + 2;
            }
            return next;
        });
    };

    const updateClass = (className: string) => {
        const classDef = CLASS_REGISTRY[className];
        setChar(prev => {
            const level = prev.level || 1;
            const hitDie = classDef?.hitDie ?? 8;
            const conMod = Math.floor((prev.abilityScores.CON - 10) / 2);
            // Level-scaled HP: level 1 = hitDie + conMod, each extra level = floor(hitDie/2)+1 + conMod
            const avgIncrease = Math.floor(hitDie / 2) + 1;
            const scaledHP = level <= 1
                ? hitDie + conMod
                : (hitDie + conMod) + (level - 1) * (avgIncrease + conMod);
            const profBonus = Math.floor((level - 1) / 4) + 2;
            return {
                ...prev,
                class: className,
                maxHP: Math.max(1, scaledHP),
                proficiencyBonus: profBonus,
                actions: (classDef as any).startingActions || []
            };
        });
    };

    const updateAbility = (ability: Ability, value: number) => {
        setChar(prev => ({
            ...prev,
            abilityScores: { ...prev.abilityScores, [ability]: value }
        }));
    };

    const updateAbilityBonus = (ability: Ability, value: number) => {
        setChar(prev => ({
            ...prev,
            abilityBonuses: { ...(prev.abilityBonuses || INITIAL_CHARACTER.abilityBonuses), [ability]: value }
        } as Character));
    };

    const updateLevel = (level: number) => {
        setChar(prev => {
            const classDef = CLASS_REGISTRY[prev.class];
            const hitDie = classDef?.hitDie ?? 8;
            const conMod = Math.floor((prev.abilityScores.CON - 10) / 2);
            const avgIncrease = Math.floor(hitDie / 2) + 1;
            const scaledHP = level <= 1
                ? hitDie + conMod
                : (hitDie + conMod) + (level - 1) * (avgIncrease + conMod);
            const profBonus = Math.floor((level - 1) / 4) + 2;
            return {
                ...prev,
                level,
                maxHP: Math.max(1, scaledHP),
                proficiencyBonus: profBonus,
            };
        });
    };

    const toggleSkill = (skill: string) => {
        setChar(prev => ({
            ...prev,
            skillProficiencies: prev.skillProficiencies.includes(skill)
                ? prev.skillProficiencies.filter(s => s !== skill)
                : [...prev.skillProficiencies, skill]
        }));
    };

    const updateOverride = (field: keyof NonNullable<Character['overrides']>, value: number | undefined) => {
        setChar(prev => ({
            ...prev,
            overrides: {
                ...prev.overrides,
                [field]: value
            }
        }));
    };

    const toggleSpell = (spellId: string) => {
        setChar(prev => {
            const currentSpells = prev.magic?.spells || [];
            const nextSpells = currentSpells.includes(spellId)
                ? currentSpells.filter(id => id !== spellId)
                : [...currentSpells, spellId];
            
            return {
                ...prev,
                magic: {
                    ...prev.magic,
                    spells: nextSpells
                }
            };
        });
    };

    const updateEquipment = (item: any) => {
        setChar(prev => {
            const inventory = prev.resources?.inventory || [];
            // Weapons can stack (characters can carry multiple weapons, just can't attack with all at once)
            // Only deduplicate unique-slot items: Armor, Shield, Offhand
            const UNIQUE_SLOT_TYPES = ['Armor', 'Shield'];
            let filtered: any[];
            if (UNIQUE_SLOT_TYPES.includes(item.type)) {
                // Replace existing item of same type (only one armor set, one shield)
                filtered = inventory.filter((i: any) => i.type !== item.type);
            } else {
                // Allow multiple weapons and other gear — check by id to prevent duplicate adds
                filtered = inventory.filter((i: any) => i.id !== item.id);
            }
            return {
                ...prev,
                resources: {
                    ...prev.resources,
                    inventory: [...filtered, item]
                }
            };
        });
    };

    const removeEquipment = (itemId: string) => {
        setChar(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                inventory: (prev.resources?.inventory || []).filter((i: any) => i.id !== itemId)
            }
        }));
    };

    const nextStep = () => {
        const idx = STEPS.findIndex(s => s.id === step);
        if (idx < STEPS.length - 1) setStep(STEPS[idx+1].id);
    };

    const prevStep = () => {
        const idx = STEPS.findIndex(s => s.id === step);
        if (idx > 0) setStep(STEPS[idx-1].id);
    };

    return {
        step,
        setStep,
        char,
        setChar,
        calculatedChar,
        updateIdentity,
        updateClass,
        updateAbility,
        updateAbilityBonus,
        updateLevel,
        toggleSkill,
        toggleSpell,
        updateEquipment,
        removeEquipment,
        updateOverride,
        nextStep,
        prevStep,
        STEPS
    };
}
