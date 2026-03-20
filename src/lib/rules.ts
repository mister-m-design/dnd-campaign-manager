
import { Ability, AbilityScores, AbilityModifiers, Equipment, Character, Resource, Action } from '../types';

export const ABILITIES_LIST: Ability[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export interface ClassRegistryEntry {
    hitDie: number;
    primaryAbilities: Ability[];
    saveProficiencies: Ability[];
    spellcasting?: {
        ability: Ability;
        progression: 'Full' | 'Half' | 'Pact' | 'Third';
    };
}

export const CLASS_REGISTRY: Record<string, ClassRegistryEntry> = {
    'Barbarian': { hitDie: 12, primaryAbilities: ['STR', 'CON'], saveProficiencies: ['STR', 'CON'] },
    'Bard': { hitDie: 8, primaryAbilities: ['CHA'], saveProficiencies: ['DEX', 'CHA'], spellcasting: { ability: 'CHA', progression: 'Full' } },
    'Cleric': { hitDie: 8, primaryAbilities: ['WIS'], saveProficiencies: ['WIS', 'CHA'], spellcasting: { ability: 'WIS', progression: 'Full' } },
    'Druid': { hitDie: 8, primaryAbilities: ['WIS'], saveProficiencies: ['INT', 'WIS'], spellcasting: { ability: 'WIS', progression: 'Full' } },
    'Fighter': { hitDie: 10, primaryAbilities: ['STR', 'DEX'], saveProficiencies: ['STR', 'CON'] },
    'Monk': { hitDie: 8, primaryAbilities: ['DEX', 'WIS'], saveProficiencies: ['STR', 'DEX'] },
    'Paladin': { hitDie: 10, primaryAbilities: ['STR', 'CHA'], saveProficiencies: ['WIS', 'CHA'], spellcasting: { ability: 'CHA', progression: 'Half' } },
    'Ranger': { hitDie: 10, primaryAbilities: ['DEX', 'WIS'], saveProficiencies: ['STR', 'DEX'], spellcasting: { ability: 'WIS', progression: 'Half' } },
    'Rogue': { hitDie: 8, primaryAbilities: ['DEX'], saveProficiencies: ['DEX', 'INT'] },
    'Sorcerer': { hitDie: 6, primaryAbilities: ['CHA'], saveProficiencies: ['CON', 'CHA'], spellcasting: { ability: 'CHA', progression: 'Full' } },
    'Warlock': { hitDie: 8, primaryAbilities: ['CHA'], saveProficiencies: ['WIS', 'CHA'], spellcasting: { ability: 'CHA', progression: 'Pact' } },
    'Wizard': { hitDie: 6, primaryAbilities: ['INT'], saveProficiencies: ['INT', 'WIS'], spellcasting: { ability: 'INT', progression: 'Full' } },
};

export const calculateModifier = (score: number): number => Math.floor((score - 10) / 2);

export const calculateAllModifiers = (scores?: AbilityScores): AbilityModifiers => {
    const s = scores || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
    return {
        STR: calculateModifier(s.STR),
        DEX: calculateModifier(s.DEX),
        CON: calculateModifier(s.CON),
        INT: calculateModifier(s.INT),
        WIS: calculateModifier(s.WIS),
        CHA: calculateModifier(s.CHA),
    };
};

export const calculateProficiencyBonus = (level: number = 1): number => Math.floor((level - 1) / 4) + 2;

export const calculateAC = (character: Character, allEquipment?: Equipment[]): { value: number; explanation: string } => {
    const abilities = character.abilities || character.abilityScores;
    const modifiers = calculateAllModifiers(abilities);
    const armor = allEquipment?.find(e => e.id === character.combat?.equippedArmorId);
    
    let baseACValue = 10 + modifiers.DEX;
    let baseExplanation = `10 (Unarmored) + ${modifiers.DEX} (DEX)`;
    
    const isDraconic = character.progression?.subclass === 'Draconic Bloodline';
    const className = character.progression?.class || character.class;

    if (armor && armor.type === 'Armor') {
        const acBase = armor.acBase || 10;
        if (acBase >= 16) { 
            baseACValue = acBase;
            baseExplanation = `${armor.name} (${acBase})`;
        } else if (armor.dexMax !== undefined) { 
            const dexBonus = Math.min(modifiers.DEX, armor.dexMax);
            baseACValue = acBase + dexBonus;
            baseExplanation = `${armor.name} (${acBase}) + ${dexBonus} (DEX, max ${armor.dexMax})`;
        } else { 
            baseACValue = acBase + modifiers.DEX;
            baseExplanation = `${armor.name} (${acBase}) + ${modifiers.DEX} (DEX)`;
        }
    } else {
        const unarmoredOptions: { value: number; label: string }[] = [
            { value: 10 + modifiers.DEX, label: `10 (Base) + ${modifiers.DEX} (DEX)` }
        ];

        if (isDraconic) {
            unarmoredOptions.push({ value: 13 + modifiers.DEX, label: `Draconic Resilience (13) + ${modifiers.DEX} (DEX)` });
        }
        if (className === 'Barbarian') {
            unarmoredOptions.push({ value: 10 + modifiers.DEX + modifiers.CON, label: `Unarmored Defense: 10 + ${modifiers.DEX} (DEX) + ${modifiers.CON} (CON)` });
        }
        if (className === 'Monk') {
            unarmoredOptions.push({ value: 10 + modifiers.DEX + modifiers.WIS, label: `Unarmored Defense: 10 + ${modifiers.DEX} (DEX) + ${modifiers.WIS} (WIS)` });
        }
        const best = unarmoredOptions.reduce((prev, curr) => curr.value > prev.value ? curr : prev);
        baseACValue = best.value;
        baseExplanation = best.label;
    }

    let totalAC = baseACValue;
    let finalExplanation = baseExplanation;

    if (character.combat?.shieldEquipped) {
        totalAC += 2;
        finalExplanation += ` + 2 (Shield)`;
    }

    const finalAC = character.overrides?.armorClass ?? totalAC;
    const isOverridden = character.overrides?.armorClass !== undefined;

    return { 
        value: finalAC, 
        explanation: isOverridden ? `Manual Override (${finalAC}) [Calculated: ${totalAC}]` : finalExplanation 
    };
};

export const calculateHP = (character: Character, mode: 'fixed' | 'roll' = 'fixed', rollValue?: number): { max: number; explanation: string } => {
    const className = character.progression?.class || character.class;
    const classDef = CLASS_REGISTRY[className];
    const hitDie = classDef?.hitDie || 8;
    const abilities = character.abilities || character.abilityScores || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
    const conMod = calculateModifier(abilities.CON || 10);
    const level = character.progression?.level || character.level || 1;

    const level1HP = hitDie + conMod;
    const avgIncrease = Math.floor(hitDie / 2) + 1;

    const totalMax = character.overrides?.maxHP ?? (mode === 'fixed' ? level1HP + (level - 1) * (avgIncrease + conMod) : (character.defense?.hitPoints?.max || character.maxHP || 10) + (rollValue || avgIncrease) + conMod);
    const isOverridden = character.overrides?.maxHP !== undefined;

    if (level <= 1) {
        const base = hitDie + conMod;
        const final = character.overrides?.maxHP ?? base;
        return { 
            max: final, 
            explanation: isOverridden ? `Manual Override (${final}) [Calculated: ${base}]` : `${hitDie} (Hit Die) + ${conMod} (CON)` 
        };
    }
    
    if (mode === 'fixed') {
        const calcTotal = level1HP + (level - 1) * (avgIncrease + conMod);
        return {
            max: totalMax,
            explanation: isOverridden ? `Manual Override (${totalMax}) [Calculated: ${calcTotal}]` : `Lvl 1: ${hitDie}+${conMod} | Lvl 2-${level}: ${level-1} x (${avgIncrease}+${conMod})`
        };
    } else {
        const increase = (rollValue || avgIncrease) + conMod;
        const currentMax = character.defense?.hitPoints?.max || character.maxHP || 10;
        return {
            max: totalMax,
            explanation: isOverridden ? `Manual Override (${totalMax}) [Calculated: ${currentMax + increase}]` : `Previous Max (${currentMax}) + Roll (${rollValue || avgIncrease}) + ${conMod} (CON)`
        };
    }
};

export const calculateDerivedStats = (char: Character, allEquipment?: Equipment[]): Character => {
    const level = char.progression?.level || char.level || 1;
    const pb = calculateProficiencyBonus(level);
    const abilities = char.abilities || char.abilityScores;
    const modifiers = calculateAllModifiers(abilities);
    const acResult = calculateAC(char, allEquipment);
    const hpResult = calculateHP(char);
    
    const className = char.progression?.class || char.class;
    const classDef = CLASS_REGISTRY[className];
    let spellAttackBonus = 0;
    let spellSaveDC = 8 + pb;
    
    if (classDef?.spellcasting) {
        const abilityKey = classDef.spellcasting.ability;
        const abilityMod = modifiers[abilityKey];
        spellAttackBonus = pb + abilityMod;
        spellSaveDC = 8 + pb + abilityMod;
    }

    const skillProfs = char.skillsAndSaves?.skillProficiencies || char.skillProficiencies || [];
    const passivePerception = 10 + modifiers.WIS + (skillProfs.includes('Perception') ? pb : 0);

    const finalInitiative = char.overrides?.initiative ?? modifiers.DEX;
    const finalProficiency = char.overrides?.proficiencyBonus ?? pb;
    const finalSpellSaveDC = char.overrides?.spellSaveDC ?? spellSaveDC;
    const finalSpellAttackBonus = char.overrides?.spellAttackBonus ?? spellAttackBonus;
    const finalSpeed = char.overrides?.speed ?? (char.speed || 30);

    return {
        ...char,
        speed: finalSpeed,
        proficiencyBonus: finalProficiency,
        progression: { 
            ...(char.progression || { level }), 
            proficiencyBonus: finalProficiency 
        },
        derived: {
            abilityModifiers: modifiers,
            initiativeBonus: finalInitiative,
            passivePerception,
            spellAttackBonus: finalSpellAttackBonus,
            spellSaveDC: finalSpellSaveDC,
        },
        defense: {
            ...(char.defense || { 
                armorClass: char.ac, 
                armorFormulaSource: '', 
                hitPoints: { current: char.maxHP, max: char.maxHP, temp: 0 },
                hitDice: { current: level, max: level, dieType: 'd8' },
                deathSaves: { successes: 0, failures: 0 }
            }),
            armorClass: acResult.value,
            armorFormulaSource: acResult.explanation,
            hitPoints: { 
                ...(char.defense?.hitPoints || { current: char.maxHP, max: char.maxHP, temp: 0 }), 
                max: hpResult.max,
                current: char.overrides?.currentHP ?? (char.defense?.hitPoints?.current || hpResult.max),
                temp: char.overrides?.tempHP ?? (char.defense?.hitPoints?.temp || 0)
            }
        }
    };
};

export const calculateWildShapeTempHP = (level: number, isMoonDruid: boolean): number => {
    if (isMoonDruid) {
        return level * 3;
    }
    return level;
};

export function getMaxSpellLevel(className: string, level: number): number {
    const fullCasters = ['Wizard', 'Druid', 'Cleric', 'Bard', 'Sorcerer'];
    const halfCasters = ['Paladin', 'Ranger'];
    const thirdCasters = ['Arcane Trickster', 'Eldritch Knight']; // Expanded for future

    if (fullCasters.includes(className)) {
        if (level >= 17) return 9;
        if (level >= 15) return 8;
        if (level >= 13) return 7;
        if (level >= 11) return 6;
        if (level >= 9) return 5;
        if (level >= 7) return 4;
        if (level >= 5) return 3;
        if (level >= 3) return 2;
        return 1;
    }
    
    if (halfCasters.includes(className)) {
        if (level >= 17) return 5;
        if (level >= 13) return 4;
        if (level >= 9) return 3;
        if (level >= 5) return 2;
        if (level >= 2) return 1;
        return 0;
    }

    if (className === 'Warlock') { // Pact Magic logic
        if (level >= 9) return 5;
        if (level >= 7) return 4;
        if (level >= 5) return 3;
        if (level >= 3) return 2;
        return 1;
    }

    return 0;
}

export function calculateSpellSlots(className: string, level: number): Record<number, { current: number; max: number }> {
    const slots: Record<number, { current: number; max: number }> = {};
    
    // Simple mock logic for standard casters
    const fullCasters = ['Wizard', 'Druid', 'Cleric', 'Bard', 'Sorcerer'];
    const halfCasters = ['Paladin', 'Ranger'];
    
    if (fullCasters.includes(className)) {
        if (level >= 1) slots[1] = { current: 2, max: 2 };
        if (level >= 2) slots[1] = { current: 3, max: 3 };
        if (level >= 3) { slots[1] = { current: 4, max: 4 }; slots[2] = { current: 2, max: 2 }; }
    } else if (halfCasters.includes(className)) {
        if (level >= 2) slots[1] = { current: 2, max: 2 };
        if (level >= 3) slots[1] = { current: 3, max: 3 };
    } else if (className === 'Warlock') {
        if (level === 1) slots[1] = { current: 1, max: 1 };
        if (level >= 2) slots[1] = { current: 2, max: 2 };
    }
    
    return slots;
}
