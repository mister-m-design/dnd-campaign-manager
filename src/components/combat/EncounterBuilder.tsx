"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useSyncedState } from '@/hooks/useSyncedState';
import monstersData from '@/data/monsters.json';
import { RulesEngine } from '@/engines/RulesEngine';
import { CombatantState, Action, CombatSetupConfig, CombatMode, GlobalRollMode, InitiativeMode } from '@/types';
import { generateSafeId } from '@/lib/utils';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';
import { ChevronRight, ChevronLeft, Shield, Swords, Zap, Dices, Users, Skull } from 'lucide-react';

interface EncounterBuilderProps {
    campaignId?: string;
    onStartCombat: (combatants: CombatantState[], config: CombatSetupConfig) => void;
}

// ── COMBAT MODE DEFINITIONS ────────────────────────────────────────────────────
const COMBAT_MODES: Array<{
    id: CombatMode;
    label: string;
    icon: React.ReactNode;
    description: string;
    detail: string;
    color: string;
}> = [
    {
        id: 'DM_TABLE',
        label: 'DM Table Mode',
        icon: <Shield className="w-5 h-5" />,
        description: 'Full manual DM control',
        detail: 'Enemies never act automatically. DM enters all actions, rolls, and movement manually. Ideal for running a real tabletop session where players roll physical dice.',
        color: 'blue',
    },
    {
        id: 'ASSISTED',
        label: 'Assisted Mode',
        icon: <Users className="w-5 h-5" />,
        description: 'Prompted hybrid play',
        detail: 'System suggests legal actions and dice formulas, then prompts before each roll. Enemies wait for DM commands. Good for new DMs learning the system.',
        color: 'amber',
    },
    {
        id: 'AUTO_RESOLUTION',
        label: 'Auto Resolution',
        icon: <Zap className="w-5 h-5" />,
        description: 'Player triggers, system resolves',
        detail: 'Players pick actions; the system auto-rolls attack and damage. Enemies still wait for DM commands. Fast-paced digital play without losing DM oversight.',
        color: 'emerald',
    },
    {
        id: 'FULL_GAME',
        label: 'Full Game Mode',
        icon: <Swords className="w-5 h-5" />,
        description: 'AI-driven tactical combat',
        detail: 'Enemies act on their own turns using the AI decision engine. Full auto-targeting, auto-rolling, and movement. DM override always available. Like a video game.',
        color: 'red',
    },
];

const ROLL_MODES: Array<{ id: GlobalRollMode; label: string; description: string }> = [
    { id: 'Manual', label: 'Manual', description: 'Enter all dice results by hand. Good for physical dice at the table.' },
    { id: 'Assisted', label: 'Assisted', description: 'Prompted before each roll — choose auto-roll or enter manually.' },
    { id: 'Auto', label: 'Auto Roll', description: 'System automatically rolls all dice when actions are taken.' },
];

const INITIATIVE_MODES: Array<{ id: InitiativeMode; label: string; description: string }> = [
    { id: 'Manual', label: 'Manual Entry', description: 'DM enters initiative values for every combatant.' },
    { id: 'Assisted', label: 'Assisted', description: 'System rolls initiative but DM can override each value.' },
    { id: 'Auto', label: 'Auto Roll', description: 'System rolls initiative for all combatants automatically.' },
];

export default function EncounterBuilder({ campaignId, onStartCombat }: EncounterBuilderProps) {
    const [savedCharacters] = useSyncedState<any[]>('/api/characters', 'mythic_saved_characters', []);
    const [campaigns] = useSyncedState<any[]>('/api/campaigns', 'mythic_campaigns', []);
    const [customNpcs] = usePersistentState<any[]>('mythic_custom_npcs', []);

    // ── STEP STATE ──────────────────────────────────────────────────────────
    const [step, setStep] = useState<1 | 2>(1);

    // ── STEP 1: COMBATANT SELECTION ─────────────────────────────────────────
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
    const [selectedMonsters, setSelectedMonsters] = useState<{ id: string; name: string; count: number; data: any }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // ── STEP 2: COMBAT CONFIGURATION ───────────────────────────────────────
    const [combatMode, setCombatMode] = useState<CombatMode>('DM_TABLE');
    const [rollMode, setRollMode] = useState<GlobalRollMode>('Auto');
    const [initiativeMode, setInitiativeMode] = useState<InitiativeMode>('Auto');
    const [manualInitiatives, setManualInitiatives] = useState<Record<string, number>>({});

    // Auto-select from campaign
    React.useEffect(() => {
        if (campaignId && campaigns.length > 0) {
            const currentCampaign = campaigns.find((c: any) => c.id === campaignId);
            if (currentCampaign?.partyIds) setSelectedCharacterIds(currentCampaign.partyIds);
        }
    }, [campaignId, campaigns]);

    const allAvailableMonsters = useMemo(() => [
        ...monstersData.map(m => ({ ...m, source: 'SRD' })),
        ...customNpcs.map(n => ({ ...n, source: 'Custom' })),
    ], [customNpcs]);

    const filteredMonsters = useMemo(() => {
        if (!searchTerm) return [];
        const q = searchTerm.toLowerCase();
        return allAvailableMonsters.filter(m =>
            m.name.toLowerCase().includes(q) || (m.type && m.type.toLowerCase().includes(q))
        ).slice(0, 10);
    }, [allAvailableMonsters, searchTerm]);

    // ── Combatant helpers ───────────────────────────────────────────────────
    const addMonster = (monster: any) => {
        const existing = selectedMonsters.find(m => m.id === monster.id);
        if (existing) {
            setSelectedMonsters(selectedMonsters.map(m => m.id === monster.id ? { ...m, count: m.count + 1 } : m));
        } else {
            setSelectedMonsters([...selectedMonsters, { id: monster.id, name: monster.name, count: 1, data: monster }]);
        }
        setSearchTerm('');
    };

    const removeMonster = (id: string) => setSelectedMonsters(selectedMonsters.filter(m => m.id !== id));
    const updateMonsterCount = (id: string, count: number) => {
        if (count <= 0) { removeMonster(id); return; }
        setSelectedMonsters(selectedMonsters.map(m => m.id === id ? { ...m, count } : m));
    };

    // ── All combatant entries for initiative table ──────────────────────────
    const allCombatantEntries = useMemo(() => {
        const entries: Array<{ key: string; name: string; type: 'ally' | 'enemy' }> = [];
        selectedCharacterIds.forEach(id => {
            const char = savedCharacters.find((c: any) => c.id === id);
            if (char) {
                const name = char.identity?.name || char.name || 'Hero';
                entries.push({ key: `char-${id}`, name, type: 'ally' });
            }
        });
        selectedMonsters.forEach(group => {
            for (let i = 0; i < group.count; i++) {
                const name = group.count > 1 ? `${group.name} ${i + 1}` : group.name;
                entries.push({ key: `monster-${group.id}-${i}`, name, type: 'enemy' });
            }
        });
        return entries;
    }, [selectedCharacterIds, selectedMonsters, savedCharacters]);

    // Init manual initiatives when switching to manual mode or advancing to step 2
    const initManualInitiatives = () => {
        const init: Record<string, number> = {};
        allCombatantEntries.forEach(e => {
            init[e.key] = manualInitiatives[e.key] || 10;
        });
        setManualInitiatives(init);
    };

    const handleAdvanceToStep2 = () => {
        if (initiativeMode === 'Manual') initManualInitiatives();
        setStep(2);
    };

    // ── BUILD COMBATANTS + START COMBAT ───────────────────────────────────
    const handleStart = () => {
        const combatants: CombatantState[] = [];

        // Characters
        selectedCharacterIds.forEach(id => {
            const char = savedCharacters.find((c: any) => c.id === id);
            if (!char) return;

            const resolvedAbilities = char.abilities || char.abilityScores || {
                STR: char.strength || 10,
                DEX: char.dexterity || 10,
                CON: char.constitution || 10,
                INT: char.intelligence || 10,
                WIS: char.wisdom || 10,
                CHA: char.charisma || 10,
            };
            const resolvedLevel = char.progression?.level || char.level || 1;
            const resolvedClass = char.progression?.class || char.class || 'Adventurer';
            const resolvedMaxHP = char.defense?.hitPoints?.max || char.maxHP || char.maxHp || 20;
            const resolvedCurrentHP = char.defense?.hitPoints?.current || char.currentHP || char.currentHp || resolvedMaxHP;
            const resolvedTempHP = char.defense?.hitPoints?.temp || char.tempHP || char.tempHp || 0;
            const resolvedAC = char.defense?.armorClass || char.ac || 10;
            const resolvedSpeed = char.movement?.speed || char.speed || 30;
            const resolvedPortrait = char.identity?.portrait || char.portrait || char.imageUrl || char.image;
            const resolvedName = char.identity?.name || char.name || 'Unnamed Hero';
            const resolvedSpecies = char.identity?.species || char.species || char.race || 'Human';

            const charForInit = { ...char, abilityScores: resolvedAbilities, abilities: resolvedAbilities };
            const pb = char.progression?.proficiencyBonus || RulesEngine.getProficiencyBonus(resolvedLevel);

            // Initiative
            const initKey = `char-${id}`;
            let init: number;
            if (initiativeMode === 'Manual' && manualInitiatives[initKey] !== undefined) {
                init = manualInitiatives[initKey];
            } else {
                init = RulesEngine.rollInitiative(charForInit);
                if (initiativeMode === 'Assisted' && manualInitiatives[initKey] !== undefined) {
                    init = manualInitiatives[initKey]; // allow override
                }
            }

            // Weapons from inventory — support both char.inventory (legacy) and char.resources?.inventory (CharacterBuilder)
            const rawInventory: any[] = Array.isArray(char.inventory)
                ? char.inventory
                : Array.isArray(char.resources?.inventory)
                    ? char.resources.inventory
                    : [];
            // Legacy inventory requires .equipped flag; CharacterBuilder inventory has all selected items treated as equipped
            const isLegacyInventory = Array.isArray(char.inventory);
            const weaponActions: Action[] = rawInventory
                .filter((item: any) => item.type === 'Weapon' && (isLegacyInventory ? item.equipped : true))
                .map((weapon: any) => {
                    const isFinesse = (weapon.properties || []).some((p: string) => p.toLowerCase().includes('finesse'));
                    const isRanged = weapon.range != null || (weapon.properties || []).some((p: string) => p.toLowerCase().includes('ammunition') || p.toLowerCase().includes('ranged'));
                    const strMod = RulesEngine.calculateModifier(resolvedAbilities.STR ?? 10);
                    const dexMod = RulesEngine.calculateModifier(resolvedAbilities.DEX ?? 10);
                    const primaryMod = (isRanged || (isFinesse && dexMod > strMod)) ? dexMod : strMod;
                    // Normalise dice field: SimpleItem uses damageDice, Equipment uses damageDie
                    const diceFace = weapon.damageDice || weapon.damageDie || '1d4';
                    return {
                        id: `weapon-${weapon.id}-${generateSafeId()}`,
                        name: weapon.name,
                        description: weapon.description || `${diceFace} ${weapon.damageType || 'damage'}`,
                        type: 'Action' as const,
                        actionType: 'Attack' as const,
                        attackType: (isRanged ? 'Ranged' : 'Melee') as any,
                        damageDice: diceFace,
                        damageType: weapon.damageType || 'slashing',
                        range: isRanged ? (weapon.range || '80/320') : '5 ft',
                        attackBonus: primaryMod + pb,
                        damageModifier: primaryMod,
                        source: 'Item' as const,
                    };
                });

            // Default weapon fallback — give class-appropriate weapon if no inventory weapons
            if (weaponActions.length === 0) {
                const strMod = RulesEngine.calculateModifier(resolvedAbilities.STR ?? 10);
                const dexMod = RulesEngine.calculateModifier(resolvedAbilities.DEX ?? 10);
                const classWeapons: Record<string, { name: string; dice: string; type: string; range?: string; finesse?: boolean; ranged?: boolean }> = {
                    Barbarian: { name: 'Greataxe', dice: '1d12', type: 'slashing' },
                    Fighter:   { name: 'Longsword', dice: '1d8', type: 'slashing' },
                    Paladin:   { name: 'Longsword', dice: '1d8', type: 'slashing' },
                    Rogue:     { name: 'Shortsword', dice: '1d6', type: 'piercing', finesse: true },
                    Ranger:    { name: 'Longbow', dice: '1d8', type: 'piercing', range: '150/600', ranged: true },
                    Bard:      { name: 'Rapier', dice: '1d8', type: 'piercing', finesse: true },
                    Cleric:    { name: 'Mace', dice: '1d6', type: 'bludgeoning' },
                    Druid:     { name: 'Quarterstaff', dice: '1d6', type: 'bludgeoning' },
                    Monk:      { name: 'Quarterstaff', dice: '1d6', type: 'bludgeoning', finesse: true },
                    Warlock:   { name: 'Dagger', dice: '1d4', type: 'piercing', finesse: true },
                    Sorcerer:  { name: 'Dagger', dice: '1d4', type: 'piercing', finesse: true },
                    Wizard:    { name: 'Quarterstaff', dice: '1d6', type: 'bludgeoning' },
                };
                const defaultWep = classWeapons[resolvedClass] || { name: 'Dagger', dice: '1d4', type: 'piercing', finesse: true };
                const primaryMod = defaultWep.ranged
                    ? dexMod
                    : (defaultWep.finesse && dexMod > strMod ? dexMod : strMod);
                weaponActions.push({
                    id: `weapon-default-${resolvedClass}-${generateSafeId()}`,
                    name: defaultWep.name,
                    description: `${defaultWep.dice} ${defaultWep.type} damage`,
                    type: 'Action' as const,
                    actionType: 'Attack' as const,
                    attackType: (defaultWep.ranged ? 'Ranged' : 'Melee') as any,
                    damageDice: defaultWep.dice,
                    damageType: defaultWep.type,
                    range: defaultWep.ranged ? (defaultWep.range || '150/600') : '5 ft',
                    attackBonus: primaryMod + pb,
                    damageModifier: primaryMod,
                    source: 'Item' as const,
                });
            }

            // Class actions
            const classActions: Action[] = [];
            // ── BARBARIAN ──
            if (resolvedClass === 'Barbarian') {
                classActions.push({ id: 'rage', name: 'Rage', type: 'Bonus Action', actionType: 'Ability', source: 'Class', description: `Enter a rage. Advantage on STR checks/saves, resistance to B/P/S damage, +${resolvedLevel >= 16 ? 4 : resolvedLevel >= 9 ? 3 : 2} melee damage. ${resolvedLevel >= 3 ? `${resolvedLevel >= 17 ? 6 : resolvedLevel >= 12 ? 5 : resolvedLevel >= 6 ? 4 : 3} rages per long rest.` : '2 rages per long rest.'}` });
                classActions.push({ id: 'reckless-attack', name: 'Reckless Attack', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'On your first attack, choose to attack with advantage. If you do, enemies have advantage against you until your next turn.' });
                if (resolvedLevel >= 2) classActions.push({ id: 'danger-sense', name: 'Danger Sense', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'Advantage on DEX saves against effects you can see (traps, spells).' });
                if (resolvedLevel >= 5) classActions.push({ id: 'extra-attack-barb', name: 'Extra Attack', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'Attack twice when you take the Attack action.' });
                if (resolvedLevel >= 7) classActions.push({ id: 'feral-instinct', name: 'Feral Instinct', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'Advantage on initiative. Can enter rage to act normally if surprised.' });
            }

            // ── FIGHTER ──
            if (resolvedClass === 'Fighter') {
                classActions.push({ id: 'second-wind', name: 'Second Wind', type: 'Bonus Action', actionType: 'Ability', source: 'Class', description: `Bonus Action. Regain 1d10 + ${resolvedLevel} HP. Once per Short Rest.` });
                if (resolvedLevel >= 2) classActions.push({ id: 'action-surge', name: 'Action Surge', type: 'Action', actionType: 'Ability', source: 'Class', description: 'Take one additional action this turn. Once per Short Rest (twice at level 17).' });
                if (resolvedLevel >= 5) classActions.push({ id: 'extra-attack-fight', name: 'Extra Attack (×2)', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'Attack twice when you take the Attack action.' });
                if (resolvedLevel >= 11) classActions.push({ id: 'extra-attack-fight3', name: 'Extra Attack (×3)', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'Attack three times when you take the Attack action.' });
                if (resolvedLevel >= 20) classActions.push({ id: 'extra-attack-fight4', name: 'Extra Attack (×4)', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'Attack four times when you take the Attack action.' });
                if (resolvedLevel >= 9) classActions.push({ id: 'indomitable', name: 'Indomitable', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'Reroll a failed saving throw. Must use new result. Once per long rest (additional uses at levels 13 and 17).' });
            }

            // ── ROGUE ──
            if (resolvedClass === 'Rogue') {
                const sneakDice = Math.ceil(resolvedLevel / 2);
                classActions.push({ id: 'sneak-attack', name: `Sneak Attack (${sneakDice}d6)`, type: 'Passive', actionType: 'Ability', source: 'Class', description: `Once per turn, deal extra ${sneakDice}d6 damage if you have advantage or an ally adjacent to the target.` });
                classActions.push({ id: 'cunning-action', name: 'Cunning Action', type: 'Bonus Action', actionType: 'Ability', source: 'Class', description: 'Bonus Action. Dash, Disengage, or Hide.' });
                if (resolvedLevel >= 5) classActions.push({ id: 'uncanny-dodge', name: 'Uncanny Dodge', type: 'Reaction', actionType: 'Ability', source: 'Class', description: 'Reaction: Halve the damage of an attack that hits you from an attacker you can see.' });
                if (resolvedLevel >= 7) classActions.push({ id: 'evasion', name: 'Evasion', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'On DEX save with half damage: success = no damage, failure = half damage.' });
            }

            // ── DRUID ──
            if (resolvedClass === 'Druid' && resolvedLevel >= 2) classActions.push({ id: 'wild-shape', name: 'Wild Shape', type: 'Bonus Action', actionType: 'Ability', source: 'Class', description: 'Bonus Action (2024). Transform into a CR-appropriate Beast. Keep mental stats; replace physical stats.' });

            // ── PALADIN ──
            if (resolvedClass === 'Paladin') {
                classActions.push({ id: 'divine-smite', name: 'Divine Smite', type: 'Action', actionType: 'Ability', source: 'Class', description: 'On hit, expend a spell slot to deal 2d8 radiant damage (+1d8 per slot level above 1st, max 5d8).' });
                classActions.push({ id: 'lay-on-hands', name: 'Lay on Hands', type: 'Action', actionType: 'Ability', source: 'Class', description: `Touch to restore up to ${resolvedLevel * 5} HP total per long rest, or cure one disease/poison for 5 HP.` });
                if (resolvedLevel >= 2) classActions.push({ id: 'divine-sense', name: 'Divine Sense', type: 'Action', actionType: 'Ability', source: 'Class', description: `Detect celestials, fiends, and undead within 60 ft. ${1 + RulesEngine.calculateModifier(resolvedAbilities.CHA)} uses per long rest.` });
                if (resolvedLevel >= 5) classActions.push({ id: 'extra-attack-pal', name: 'Extra Attack', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'Attack twice when you take the Attack action.' });
            }

            // ── MONK ──
            if (resolvedClass === 'Monk') {
                const kiPoints = resolvedLevel;
                const martialDie = resolvedLevel >= 17 ? '1d10' : resolvedLevel >= 11 ? '1d8' : resolvedLevel >= 5 ? '1d6' : '1d4';
                classActions.push({ id: 'flurry', name: `Flurry of Blows (${kiPoints} Ki)`, type: 'Bonus Action', actionType: 'Ability', source: 'Class', description: `Spend 1 Ki. Make two unarmed strikes as a bonus action. Martial Arts die: ${martialDie}.` });
                classActions.push({ id: 'patient-defense', name: 'Patient Defense', type: 'Bonus Action', actionType: 'Ability', source: 'Class', description: 'Spend 1 Ki. Take the Dodge action as a bonus action.' });
                classActions.push({ id: 'step-of-wind', name: 'Step of the Wind', type: 'Bonus Action', actionType: 'Ability', source: 'Class', description: 'Spend 1 Ki. Dash or Disengage as a bonus action. Jump distance doubled.' });
                if (resolvedLevel >= 5) classActions.push({ id: 'stunning-strike', name: 'Stunning Strike', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'After hitting, spend 1 Ki. Target makes CON save (DC 8 + prof + WIS) or is stunned until end of your next turn.' });
            }

            // ── RANGER ──
            if (resolvedClass === 'Ranger') {
                classActions.push({ id: 'hunters-mark', name: "Hunter's Mark", type: 'Bonus Action', actionType: 'Ability', source: 'Class', description: "Bonus Action (1st lvl spell). Mark a creature. Deal +1d6 damage on weapon attacks against it." });
                if (resolvedLevel >= 5) classActions.push({ id: 'extra-attack-rang', name: 'Extra Attack', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'Attack twice when you take the Attack action.' });
            }

            // ── CLERIC ──
            if (resolvedClass === 'Cleric') {
                classActions.push({ id: 'channel-divinity', name: 'Channel Divinity', type: 'Action', actionType: 'Ability', source: 'Class', description: `Use a Channel Divinity option. ${resolvedLevel >= 18 ? 3 : resolvedLevel >= 6 ? 2 : 1} uses per Short Rest.` });
                classActions.push({ id: 'turn-undead', name: 'Turn Undead', type: 'Action', actionType: 'Ability', source: 'Class', description: `Channel Divinity: Each undead within 30 ft that fails a WIS save is turned for 1 minute. Destroyed at CR ${resolvedLevel >= 17 ? 4 : resolvedLevel >= 14 ? 3 : resolvedLevel >= 11 ? 2 : resolvedLevel >= 8 ? 1 : 0.5}.` });
            }

            // ── BARD ──
            if (resolvedClass === 'Bard') {
                const insDie = resolvedLevel < 5 ? 6 : resolvedLevel < 10 ? 8 : resolvedLevel < 15 ? 10 : 12;
                classActions.push({ id: 'bardic-inspiration', name: `Bardic Inspiration (d${insDie})`, type: 'Bonus Action', actionType: 'Ability', source: 'Class', description: `Bonus Action. Give a creature a d${insDie} Bardic Inspiration die. ${RulesEngine.calculateModifier(resolvedAbilities.CHA)} uses per long rest (short rest at level 5+).` });
                if (resolvedLevel >= 2) classActions.push({ id: 'jack-of-all-trades', name: 'Jack of All Trades', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'Add half proficiency bonus to ability checks you are not proficient in.' });
                if (resolvedLevel >= 6) classActions.push({ id: 'countercharm', name: 'Countercharm', type: 'Action', actionType: 'Ability', source: 'Class', description: 'Allies within 30 ft have advantage on saves vs. being frightened or charmed while you perform.' });
            }

            // ── SORCERER ──
            if (resolvedClass === 'Sorcerer') {
                const sorcPoints = resolvedLevel;
                classActions.push({ id: 'metamagic', name: 'Metamagic', type: 'Passive', actionType: 'Ability', source: 'Class', description: `Modify spells using Sorcery Points (${sorcPoints} points). Options: Quickened, Twinned, Extended, etc.` });
                if (resolvedLevel >= 2) classActions.push({ id: 'font-of-magic', name: 'Font of Magic', type: 'Passive', actionType: 'Ability', source: 'Class', description: `${sorcPoints} Sorcery Points. Convert spell slots to/from points.` });
            }

            // ── WARLOCK ──
            if (resolvedClass === 'Warlock') {
                classActions.push({ id: 'eldritch-blast', name: 'Eldritch Blast', type: 'Action', actionType: 'Spell', source: 'Class', damageDice: '1d10', damageType: 'force', attackBonus: RulesEngine.calculateModifier(resolvedAbilities.CHA) + pb, description: `Force cantrip. ${Math.max(1, Math.ceil(resolvedLevel/5)+Math.floor(resolvedLevel/5))} beam(s) of 1d10 force damage each.` });
                if (resolvedLevel >= 2) classActions.push({ id: 'eldritch-invocations', name: 'Eldritch Invocations', type: 'Passive', actionType: 'Ability', source: 'Class', description: 'Ongoing supernatural boons. Examples: Agonizing Blast (+CHA to EB), Devil\'s Sight (darkvision), etc.' });
            }

            // ── WIZARD ──
            if (resolvedClass === 'Wizard') {
                if (resolvedLevel >= 2) classActions.push({ id: 'arcane-recovery', name: 'Arcane Recovery', type: 'Action', actionType: 'Ability', source: 'Class', description: `Short Rest: Recover spell slots with total levels ≤ ${Math.ceil(resolvedLevel / 2)}. Once per long rest.` });
            }

            // Spells
            const spellActions: Action[] = (char.magic?.knownSpells || char.knownSpells || char.spells || []).map((s: any) => ({
                id: `spell-${(s.name || s)}-${generateSafeId()}`,
                name: s.name || s,
                description: s.description || 'Magic spell',
                type: 'Action' as const,
                actionType: 'Spell' as const,
                damageDice: s.damageDie,
                source: 'Class' as const,
            }));

            combatants.push({
                id: char.id,
                sourceCharacterId: char.id,
                instanceId: generateSafeId(),
                name: resolvedName,
                class: resolvedClass,
                level: resolvedLevel,
                maxHP: resolvedMaxHP,
                currentHP: resolvedCurrentHP,
                tempHP: resolvedTempHP,
                abilityScores: resolvedAbilities,
                baseAC: resolvedAC,
                ac: resolvedAC,
                speed: resolvedSpeed,
                actions: [...(char.actions || []), ...(char.combat?.attacks || []), ...weaponActions, ...classActions, ...spellActions],
                resources: {
                    action: true,
                    bonusAction: true,
                    reaction: true,
                    actionUsed: false,
                    bonusActionUsed: false,
                    reactionUsed: false,
                    movementMax: resolvedSpeed,
                    movementSpent: 0,
                    movementRemaining: resolvedSpeed,
                    spellSlots: char.magic?.spellSlots || {},
                },
                initiative: init,
                deathSaves: char.defense?.deathSaves || char.deathSaves || { successes: 0, failures: 0 },
                conditions: char.combat?.conditions || char.conditions || [],
                status: [],
                type: 'Player',
                side: 'Ally',
                inCombat: true,
                rollMode: rollMode,
                isWildShaped: false,
                imageUrl: resolvedPortrait,
                portrait: resolvedPortrait,
                proficiencyBonus: pb,
                skillProficiencies: char.skillsAndSaves?.skillProficiencies || char.skillProficiencies || [],
                species: resolvedSpecies,
                concentration: char.combat?.concentration || null,
            });
        });

        // Monsters
        selectedMonsters.forEach(group => {
            for (let i = 0; i < group.count; i++) {
                const monster = group.data;
                const name = group.count > 1 ? `${monster.name} ${i + 1}` : monster.name;
                const initKey = `monster-${group.id}-${i}`;
                let init: number;
                if (initiativeMode === 'Manual' && manualInitiatives[initKey] !== undefined) {
                    init = manualInitiatives[initKey];
                } else {
                    init = RulesEngine.rollInitiative(monster);
                    if (initiativeMode === 'Assisted' && manualInitiatives[initKey] !== undefined) {
                        init = manualInitiatives[initKey];
                    }
                }

                const mappedActions = (monster.actions || []).map((a: any) => {
                    if (typeof a === 'string') return { id: generateSafeId(), name: a.split(':')[0], description: a, type: 'Action', actionType: 'Attack', source: 'Trait' };
                    return a;
                });

                combatants.push({
                    id: monster.id,
                    instanceId: generateSafeId(),
                    name,
                    type: 'Enemy',
                    side: 'Enemy',
                    inCombat: true,
                    maxHP: monster.hp,
                    currentHP: monster.hp,
                    tempHP: 0,
                    abilityScores: monster.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
                    baseAC: monster.ac,
                    ac: monster.ac,
                    speed: monster.speed || 30,
                    actions: mappedActions,
                    class: monster.type || 'Monster',
                    resources: {
                        action: true,
                        bonusAction: true,
                        reaction: true,
                        actionUsed: false,
                        bonusActionUsed: false,
                        reactionUsed: false,
                        movementMax: monster.speed || 30,
                        movementSpent: 0,
                        movementRemaining: monster.speed || 30,
                    },
                    initiative: init,
                    deathSaves: { successes: 0, failures: 0 },
                    level: Math.max(1, Math.floor(parseFloat(monster.cr) || 1)),
                    conditions: [],
                    status: [],
                    rollMode: rollMode,
                    isWildShaped: false,
                    imageUrl: monster.visualUrl,
                    portrait: monster.visualUrl,
                    proficiencyBonus: RulesEngine.getProficiencyBonus(Math.max(1, Math.floor(parseFloat(monster.cr) || 1))),
                    skillProficiencies: [],
                    species: monster.type || 'Monster',
                    concentration: null,
                });
            }
        });

        combatants.sort((a, b) => b.initiative - a.initiative);
        onStartCombat(combatants, { mode: combatMode, rollMode, initiativeMode, manualInitiatives });
    };

    const isStep1Complete = selectedCharacterIds.length > 0 || selectedMonsters.length > 0;

    // ── RENDER ─────────────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            {/* Title + step indicator */}
            <div className="text-center space-y-3">
                <h1 className="text-4xl font-black text-slate-100 uppercase tracking-tighter">
                    {step === 1 ? 'Forge Encounter' : 'Combat Setup'}
                </h1>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    {step === 1 ? 'Select combatants for this initiative' : 'Configure how combat will be run'}
                </p>
                {/* Step pill */}
                <div className="flex items-center justify-center gap-2">
                    {[1, 2].map(s => (
                        <div key={s} className={`h-1.5 w-12 rounded-full transition-all ${s === step ? 'bg-amber-500' : s < step ? 'bg-amber-500/40' : 'bg-white/10'}`} />
                    ))}
                </div>
            </div>

            {/* ── STEP 1: COMBATANT SELECTION ─────────────────────────────── */}
            {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Heroes */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-amber-500" />
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Heroes</h2>
                        </div>
                        <div className="space-y-2">
                            {savedCharacters.filter((c: any) => !c.retired).map((char: any) => {
                                const isSelected = selectedCharacterIds.includes(char.id);
                                const name = char.identity?.name || char.name || 'Unnamed Hero';
                                const charClass = char.progression?.class || char.class || 'Adventurer';
                                const level = char.progression?.level || char.level || 1;
                                const portrait = char.identity?.portrait || char.visualUrl || char.imageUrl || char.image;
                                return (
                                    <button
                                        key={char.id}
                                        onClick={() => isSelected
                                            ? setSelectedCharacterIds(selectedCharacterIds.filter(id => id !== char.id))
                                            : setSelectedCharacterIds([...selectedCharacterIds, char.id])}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${isSelected
                                            ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                                            : 'bg-white/[0.03] border-white/5 text-slate-400 opacity-60 hover:opacity-100'}`}
                                    >
                                        <div className="size-11 rounded-xl bg-slate-900 border border-white/10 relative overflow-hidden flex-shrink-0">
                                            <ImageWithPlaceholder src={portrait} alt={name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[11px] font-black uppercase text-slate-200">{name}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{charClass} · Lv {level}</p>
                                        </div>
                                        {isSelected && <div className="size-4 rounded-full bg-amber-500 flex-shrink-0" />}
                                    </button>
                                );
                            })}
                            {savedCharacters.filter((c: any) => !c.retired).length === 0 && (
                                <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl opacity-40">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No saved characters</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Monsters */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Skull className="w-4 h-4 text-red-500" />
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enemy Threats</h2>
                        </div>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span>
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-slate-100 placeholder:text-slate-600 focus:border-red-500/40 outline-none transition-all text-[11px]"
                                placeholder="Search monsters…"
                            />
                            <AnimatePresence>
                                {searchTerm && filteredMonsters.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-[#0D0D0F] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                        {filteredMonsters.map((m: any) => (
                                            <button key={m.id} onClick={() => addMonster(m)}
                                                className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 text-left border-b border-white/5 last:border-0">
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-200 uppercase">{m.name}</p>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">CR {m.cr || '??'} · {m.type || 'Monster'}</p>
                                                </div>
                                                <span className="material-symbols-outlined text-red-500 text-[18px]">add</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="space-y-2">
                            {selectedMonsters.map(m => (
                                <div key={m.id} className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-3.5 flex items-center gap-3">
                                    <div className="size-11 rounded-xl bg-slate-900 border border-white/10 relative overflow-hidden flex-shrink-0">
                                        <ImageWithPlaceholder src={m.data.visualUrl} alt={m.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-slate-100 uppercase">{m.name}</p>
                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">CR {m.data.cr} · {m.data.type}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/20 rounded-xl px-2 py-1">
                                        <button onClick={() => updateMonsterCount(m.id, m.count - 1)} className="size-6 flex items-center justify-center text-slate-500 hover:text-white">−</button>
                                        <span className="text-[11px] font-black text-slate-200 min-w-[1rem] text-center">{m.count}</span>
                                        <button onClick={() => updateMonsterCount(m.id, m.count + 1)} className="size-6 flex items-center justify-center text-slate-500 hover:text-white">+</button>
                                    </div>
                                    <button onClick={() => removeMonster(m.id)} className="text-slate-600 hover:text-red-500 transition-all">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            ))}
                            {selectedMonsters.length === 0 && (
                                <div className="py-10 text-center border border-dashed border-white/10 rounded-2xl opacity-40">
                                    <Skull className="w-7 h-7 mx-auto mb-2 text-slate-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No threats added</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 2: COMBAT CONFIG ────────────────────────────────────── */}
            {step === 2 && (
                <div className="space-y-8">
                    {/* Combat Mode */}
                    <section>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3 flex items-center gap-2">
                            <Shield className="w-3 h-3" /> Combat Control Mode
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {COMBAT_MODES.map(mode => (
                                <button key={mode.id} onClick={() => setCombatMode(mode.id)}
                                    className={`p-4 rounded-2xl border text-left transition-all ${combatMode === mode.id
                                        ? `bg-${mode.color}-500/10 border-${mode.color}-500/40`
                                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'}`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={combatMode === mode.id ? `text-${mode.color}-400` : 'text-slate-500'}>{mode.icon}</span>
                                        <span className={`text-[11px] font-black uppercase tracking-wide ${combatMode === mode.id ? 'text-white' : 'text-slate-400'}`}>{mode.label}</span>
                                        {combatMode === mode.id && <div className="ml-auto size-2 rounded-full bg-amber-500" />}
                                    </div>
                                    <p className={`text-[9px] leading-relaxed ${combatMode === mode.id ? 'text-slate-300' : 'text-slate-600'}`}>{mode.detail}</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Roll Mode */}
                    <section>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3 flex items-center gap-2">
                            <Dices className="w-3 h-3" /> Default Roll Style
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {ROLL_MODES.map(rm => (
                                <button key={rm.id} onClick={() => setRollMode(rm.id)}
                                    className={`p-3.5 rounded-2xl border text-left transition-all ${rollMode === rm.id
                                        ? 'bg-amber-500/10 border-amber-500/40'
                                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'}`}
                                >
                                    <p className={`text-[11px] font-black uppercase mb-1 ${rollMode === rm.id ? 'text-amber-300' : 'text-slate-400'}`}>{rm.label}</p>
                                    <p className="text-[9px] text-slate-600 leading-relaxed">{rm.description}</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Initiative Mode */}
                    <section>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3 flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Initiative Entry
                        </h3>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {INITIATIVE_MODES.map(im => (
                                <button key={im.id}
                                    onClick={() => { setInitiativeMode(im.id); if (im.id !== 'Auto') initManualInitiatives(); }}
                                    className={`p-3.5 rounded-2xl border text-left transition-all ${initiativeMode === im.id
                                        ? 'bg-amber-500/10 border-amber-500/40'
                                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'}`}
                                >
                                    <p className={`text-[11px] font-black uppercase mb-1 ${initiativeMode === im.id ? 'text-amber-300' : 'text-slate-400'}`}>{im.label}</p>
                                    <p className="text-[9px] text-slate-600 leading-relaxed">{im.description}</p>
                                </button>
                            ))}
                        </div>

                        {/* Manual initiative entry table */}
                        {initiativeMode !== 'Auto' && allCombatantEntries.length > 0 && (
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Initiative Values</p>
                                    {initiativeMode === 'Assisted' && (
                                        <button onClick={() => {
                                            const rolled: Record<string, number> = {};
                                            allCombatantEntries.forEach(e => { rolled[e.key] = Math.floor(Math.random() * 20) + 1; });
                                            setManualInitiatives(rolled);
                                        }} className="text-[8px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest">
                                            Roll All
                                        </button>
                                    )}
                                </div>
                                {allCombatantEntries.map(entry => (
                                    <div key={entry.key} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <div className={`size-2 rounded-full ${entry.type === 'ally' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            <span className="text-[11px] font-bold text-slate-300">{entry.name}</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={manualInitiatives[entry.key] ?? ''}
                                            onChange={e => setManualInitiatives(prev => ({ ...prev, [entry.key]: parseInt(e.target.value) || 0 }))}
                                            className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-black text-white text-center outline-none focus:border-amber-500/40"
                                            placeholder="—"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* ── FOOTER BUTTONS ────────────────────────────────────────────── */}
            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                {step === 2 ? (
                    <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 text-[10px] font-black uppercase tracking-widest transition-all">
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                ) : <div />}

                {step === 1 ? (
                    <button
                        disabled={!isStep1Complete}
                        onClick={handleAdvanceToStep2}
                        className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all ${isStep1Complete
                            ? 'bg-amber-500 text-black hover:brightness-110 hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(245,158,11,0.3)]'
                            : 'bg-white/5 text-slate-600 border border-white/10 cursor-not-allowed'}`}
                    >
                        Configure Combat <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleStart}
                        className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-[0.2em] hover:brightness-110 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
                    >
                        <Swords className="w-4 h-4" /> Begin Combat
                    </button>
                )}
            </div>
        </div>
    );
}
