
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';
import { LEVEL_2_DRUID, GOBLIN } from '@/data/phase1-defaults';
import { EQUIPMENT_LIST } from '@/data/equipment';
import { RulesEngine } from '@/engines/RulesEngine';
import { DecisionEngine } from '@/engines/DecisionEngine';
import type { HomebrewMonster } from '@/types/homebrew';
import EncounterBuilder from './combat/EncounterBuilder';
import { WildshapeModal } from './combat/WildshapeModal';
import CombatActionModal, { ActionResolution } from './combat/CombatActionModal';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';
import { CharacterDetailView } from './combat/CharacterDetailView';
import { Battlemat } from './combat/Battlemat';
import { STD_ACTIONS, getCondColor } from '../utils/combatUtils';
import { 
  CombatantState, LogEntry, Action, CombatMode, 
  CombatSetupConfig, ConditionType 
} from '../types';
import { Plus, X, Swords, ChevronRight, Target, Shield, Heart, Zap, RotateCcw, Dices, Skull, Eye, EyeOff, BookOpen, Activity, FlaskConical, Layout, Footprints, Sparkles, Map as MapIcon, Notebook, ShieldCheck, Magnet, Settings, Sidebar, Book, Grid3X3, Upload, Link, Check, ImageOff, Sun, Bug, PlusCircle, Search, Ban, User, ChevronLeft, ChevronDown, Minus } from 'lucide-react';
import { useHomebrew } from '@/hooks/useHomebrew';
import CombatLibraryPanel from './combat/CombatLibraryPanel';
import BattleStatePanel from './combat/BattleStatePanel';
import CombatantCard from './combat/CombatantCard';
import CombatActions from './combat/CombatActions';
import InitiativePanel from './combat/InitiativePanel';
import { FloatingToolbar } from './combat/FloatingToolbar';
import { FloatingJournal } from './combat/FloatingJournal';
import { DMAddElementModal } from './DMAddElementModal';
import { useDice } from '@/contexts/DiceContext';
import type { BattleSnapshot } from '@/hooks/useBattleState';



/** 
 * Computes the visual (x,y) coordinates for a combatant.
 * If the combatant has a fixed .position (from grid interaction), use that.
 * Otherwise, use the "Formation" logic for Ally/Enemy sides.
 */
const getEffectivePosition = (c: CombatantState, allCombatants: CombatantState[]) => {
    if (c.position) return c.position;
    const sideList = c.side === 'Ally'
        ? allCombatants.filter(cb => cb.side === 'Ally')
        : allCombatants.filter(cb => cb.side === 'Enemy');
    const sideIdx = sideList.findIndex(cb => cb.instanceId === c.instanceId);
    if (sideIdx === -1) return { x: 0, y: 0 };
    const row = sideIdx % 4;
    const col = Math.floor(sideIdx / 4);
    const xOffset = c.side === 'Ally' ? -350 : 350;
    const defaultX = xOffset + (c.side === 'Ally' ? -col * 120 : col * 120);
    const defaultY = (row - 1.5) * 150;
    return { x: defaultX, y: defaultY };
}



export default function CombatTracker() {
    // 1. STATE & PERSISTENCE
    const [combatants, setCombatants] = usePersistentState<CombatantState[]>('mythic_v1_combatants', [LEVEL_2_DRUID, GOBLIN]);
    const [activeId, setActiveId] = usePersistentState<string | null>('mythic_v1_active_id', null);
    const [round, setRound] = usePersistentState('mythic_v1_round', 1);
    const [log, setLog] = usePersistentState<LogEntry[]>('mythic_v1_log', []);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isBuilding, setIsBuilding] = useState(false);
    const [isSetupPhase, setIsSetupPhase] = useState(false); // post-initiative pre-combat positioning phase
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [battlemapBg, setBattlemapBg] = usePersistentState<string | null>('mythic_v1_battlemap_bg', 'https://images.unsplash.com/photo-1542641728-6ca359b085f4?q=80&w=2000&auto=format&fit=crop');
    const [bgOpacity, setBgOpacity] = usePersistentState('mythic_v1_bg_opacity', 0.15);
    // ── GRID CONTROLS ─────────────────────────────────────────────────────────
    const [gridVisible, setGridVisible] = usePersistentState('mythic_v1_grid_visible', true);
    const [gridOpacity, setGridOpacity] = usePersistentState('mythic_v1_grid_opacity', 0.35);
    const [gridThickness, setGridThickness] = usePersistentState('mythic_v1_grid_thickness', 1);
    const [gridColor, setGridColor] = usePersistentState<'light' | 'dark' | 'accent'>('mythic_v1_grid_color', 'light');
    const [gridScale, setGridScale] = usePersistentState('mythic_v1_grid_scale', 10); // ft per square
    const [snapToGrid, setSnapToGrid] = usePersistentState('mythic_v1_snap', true);
    const [isShaking, setIsShaking] = useState(false);
    const [turnFlash, setTurnFlash] = useState(false);
    const [isWildshapeOpen, setIsWildshapeOpen] = useState(false);
    const [wildshapeTargetId, setWildshapeTargetId] = useState<string | null>(null);
    const [targetId, setTargetId] = useState<string | null>(null);      // Combat targeting
    const [isDMPanelOpen, setIsDMPanelOpen] = useState(false);           // DM control panel
    const [showJournalLog, setShowJournalLog] = useState(false);         // Journal collapsible
    const [activeMobileTab, setActiveMobileTab] = useState<'initiative' | 'map' | 'journal' | 'stats'>('map');
    const [dmHpInput, setDmHpInput] = useState('');                      // DM direct HP entry
    const [dmAcInput, setDmAcInput] = useState('');                      // DM direct AC entry
    const [dmTempHpInput, setDmTempHpInput] = useState('');             // DM temp HP entry
    const [isDMMode, setIsDMMode] = usePersistentState('mythic_v1_dm_mode', false); // Persistent God Mode
    const [rightPanelOpen, setRightPanelOpen] = usePersistentState('mythic_v1_right_panel_open', true);
    const [combatStarted, setCombatStarted] = usePersistentState('mythic_v1_combat_started', false);
    // ── UI TOGGLES ───────────────────────────────────────────────────────────
    const [showTacticalView, setShowTacticalView] = usePersistentState('mythic_v1_show_tactical', false);
    const [showInitiativeList, setShowInitiativeList] = usePersistentState('mythic_v1_show_initiative', true);
    // ── COMBAT MODE SYSTEM ───────────────────────────────────────────────────
    const [combatMode, setCombatMode] = usePersistentState<CombatMode>('mythic_v1_combat_mode', 'DM_TABLE');
    const [globalRollMode, setGlobalRollMode] = usePersistentState<'Manual' | 'Assisted' | 'Auto'>('mythic_v1_roll_mode', 'Auto');
    const [showModePanel, setShowModePanel] = useState(false);
    // ── INITIATIVE EDITING ────────────────────────────────────────────────────
    const [initiativeEditId, setInitiativeEditId] = useState<string | null>(null);
    const [initiativeEditValue, setInitiativeEditValue] = useState('');
    // ── DM NOTES ─────────────────────────────────────────────────────────────
    const [dmNotesInput, setDmNotesInput] = useState('');
    // ── VICTORY / DEFEAT DETECTION ────────────────────────────────────────────
    const [showVictory, setShowVictory] = useState<'victory' | 'defeat' | null>(null);
    const { 
        isDiceOpen, setIsDiceOpen, 
        dicePreloadFormula, setDicePreloadFormula, 
        diceContextLabel, setDiceContextLabel, 
        confirmedRoll, setConfirmedRoll,
        lastFreeRoll, setLastFreeRoll 
    } = useDice();
    // ── TERRAIN & OBSTACLES ──────────────────────────────────────────────────
    const [obstacles, setObstacles] = usePersistentState<string[]>('mythic_v1_obstacles', ['-2,0', '-2,1', '-2,2', '5,3', '5,4', '6,3', '6,4']);
    const [difficultTerrain, setDifficultTerrain] = usePersistentState<string[]>('mythic_v1_diff_terrain', ['2,-2', '3,-2', '2,-1', '3,-1', '-5,-4', '-4,-4', '-5,-3', '-4,-3']);

    const obstacleSet = React.useMemo(() => new Set(obstacles), [obstacles]);
    const difficultTerrainSet = React.useMemo(() => new Set(difficultTerrain), [difficultTerrain]);
    const [paintMode, setPaintMode] = useState<'none' | 'obstacle' | 'diff_terrain'>('none');

    // ── AUTO-OPEN DM PANEL ───────────────────────────────────────────────────
    useEffect(() => {
        if (isDMMode) {
            setIsDMPanelOpen(true);
            setShowTacticalView(true);
        }
    }, [isDMMode, setIsDMPanelOpen, setShowTacticalView]);

    // ── COMBAT STATE MACHINE ─────────────────────────────────────────────────
    // Phase controls what inputs are legal. Only DM_TABLE mode bypasses these.
    type CombatPhase = 'awaiting_input' | 'move_preview';
    const [combatPhase, setCombatPhase] = useState<CombatPhase>('awaiting_input');
    const [movePreviewDest, setMovePreviewDest] = useState<{ x: number; y: number } | null>(null);
    const [rangeError, setRangeError] = useState<string | null>(null);
    const [resetToast, setResetToast] = useState(false);
    const [isDMAddModalOpen, setIsDMAddModalOpen] = useState(false);
    const [sidebarsVisible, setSidebarsVisible] = usePersistentState('mythic_v1_sidebars_visible', true);
    const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; x: number; y: number }[]>([]);

    const QUICKSPAWN_MONSTERS = [
        { id: 'goblin', name: 'Goblin', hp: 7, ac: 15, speed: 30, species: 'Goblinoid', class: 'Scout', portrait: null, actions: [{ id: 'atk-scimitar', name: 'Scimitar', description: 'Melee +4, 1d6+2 slashing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 4, damageDice: '1d6', damageModifier: 2, damageType: 'slashing', range: '5ft', source: 'Item' as const }] },
        { id: 'kobold', name: 'Kobold', hp: 5, ac: 12, speed: 30, species: 'Humanoid', class: 'Scout', portrait: null, actions: [{ id: 'atk-dagger-k', name: 'Dagger', description: 'Melee +4, 1d4+2 piercing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 4, damageDice: '1d4', damageModifier: 2, damageType: 'piercing', range: '5ft', source: 'Item' as const }] },
        { id: 'bandit', name: 'Bandit', hp: 11, ac: 12, speed: 30, species: 'Human', class: 'Bandit', portrait: null, actions: [{ id: 'atk-scimitar-b', name: 'Scimitar', description: 'Melee +3, 1d6+1 slashing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 3, damageDice: '1d6', damageModifier: 1, damageType: 'slashing', range: '5ft', source: 'Item' as const }] },
        { id: 'skeleton', name: 'Skeleton', hp: 13, ac: 13, speed: 30, species: 'Undead', class: 'Warrior', portrait: null, actions: [{ id: 'atk-shortsword', name: 'Shortsword', description: 'Melee +4, 1d6+2 piercing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 4, damageDice: '1d6', damageModifier: 2, damageType: 'piercing', range: '5ft', source: 'Item' as const }] },
        { id: 'zombie', name: 'Zombie', hp: 22, ac: 8, speed: 20, species: 'Undead', class: 'Warrior', portrait: null, actions: [{ id: 'atk-slam', name: 'Slam', description: 'Melee +3, 1d6+1 bludgeoning', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 3, damageDice: '1d6', damageModifier: 1, damageType: 'bludgeoning', range: '5ft', source: 'Item' as const }] },
        { id: 'orc', name: 'Orc', hp: 15, ac: 13, speed: 30, species: 'Orc', class: 'Warrior', portrait: null, actions: [{ id: 'atk-greataxe', name: 'Greataxe', description: 'Melee +5, 1d12+3 slashing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 5, damageDice: '1d12', damageModifier: 3, damageType: 'slashing', range: '5ft', source: 'Item' as const }] },
        { id: 'wolf', name: 'Wolf', hp: 11, ac: 13, speed: 40, species: 'Beast', class: 'Beast', portrait: null, actions: [{ id: 'atk-bite-w', name: 'Bite', description: 'Melee +4, 2d4+2 piercing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 4, damageDice: '2d4', damageModifier: 2, damageType: 'piercing', range: '5ft', source: 'Item' as const }] },
        { id: 'ogre', name: 'Ogre', hp: 59, ac: 11, speed: 40, species: 'Giant', class: 'Warrior', portrait: null, actions: [{ id: 'atk-greatclub', name: 'Greatclub', description: 'Melee +6, 2d8+4 bludgeoning', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 6, damageDice: '2d8', damageModifier: 4, damageType: 'bludgeoning', range: '5ft', source: 'Item' as const }] },
        // ── MULTIATTACK CREATURES: individual attacks listed separately ──
        {
            id: 'troll', name: 'Troll', hp: 84, ac: 15, speed: 30, species: 'Giant', class: 'Warrior', portrait: null,
            actions: [
                { id: 'troll-multiattack', name: 'Multiattack', type: 'Passive' as const, actionType: 'Ability' as const, source: 'Item' as const, description: 'Makes 1 Bite attack and 2 Claw attacks.' },
                { id: 'troll-bite', name: 'Bite', description: 'Melee +7, 1d6+4 piercing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 7, damageDice: '1d6', damageModifier: 4, damageType: 'piercing', range: '5ft', source: 'Item' as const },
                { id: 'troll-claw', name: 'Claw', description: 'Melee +7, 2d6+4 slashing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 7, damageDice: '2d6', damageModifier: 4, damageType: 'slashing', range: '5ft', source: 'Item' as const },
            ],
        },
        {
            id: 'brown-bear', name: 'Brown Bear', hp: 34, ac: 11, speed: 40, species: 'Beast', class: 'Beast', portrait: null,
            actions: [
                { id: 'bear-multiattack', name: 'Multiattack', type: 'Passive' as const, actionType: 'Ability' as const, source: 'Item' as const, description: 'Makes 1 Bite attack and 1 Claw attack.' },
                { id: 'bear-bite', name: 'Bite', description: 'Melee +5, 1d8+4 piercing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 5, damageDice: '1d8', damageModifier: 4, damageType: 'piercing', range: '5ft', source: 'Item' as const },
                { id: 'bear-claw', name: 'Claw', description: 'Melee +5, 2d6+4 slashing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 5, damageDice: '2d6', damageModifier: 4, damageType: 'slashing', range: '5ft', source: 'Item' as const },
            ],
        },
        {
            id: 'owlbear', name: 'Owlbear', hp: 59, ac: 13, speed: 40, species: 'Monstrosity', class: 'Beast', portrait: null,
            actions: [
                { id: 'owlbear-multiattack', name: 'Multiattack', type: 'Passive' as const, actionType: 'Ability' as const, source: 'Item' as const, description: 'Makes 1 Beak attack and 1 Claws attack.' },
                { id: 'owlbear-beak', name: 'Beak', description: 'Melee +7, 1d10+5 piercing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 7, damageDice: '1d10', damageModifier: 5, damageType: 'piercing', range: '5ft', source: 'Item' as const },
                { id: 'owlbear-claws', name: 'Claws', description: 'Melee +7, 2d8+5 slashing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 7, damageDice: '2d8', damageModifier: 5, damageType: 'slashing', range: '5ft', source: 'Item' as const },
            ],
        },
        { id: 'dire-wolf', name: 'Dire Wolf', hp: 37, ac: 14, speed: 50, species: 'Beast', class: 'Beast', portrait: null, actions: [{ id: 'atk-bite-dw', name: 'Bite', description: 'Melee +5, 2d6+3 piercing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 5, damageDice: '2d6', damageModifier: 3, damageType: 'piercing', range: '5ft', source: 'Item' as const }] },
        {
            id: 'manticore', name: 'Manticore', hp: 68, ac: 14, speed: 30, species: 'Monstrosity', class: 'Beast', portrait: null,
            actions: [
                { id: 'mant-multiattack', name: 'Multiattack', type: 'Passive' as const, actionType: 'Ability' as const, source: 'Item' as const, description: 'Makes 3 attacks: 1 Bite and 2 Claw, or 3 Tail Spike attacks.' },
                { id: 'mant-bite', name: 'Bite', description: 'Melee +5, 1d8+3 piercing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 5, damageDice: '1d8', damageModifier: 3, damageType: 'piercing', range: '5ft', source: 'Item' as const },
                { id: 'mant-claw', name: 'Claw', description: 'Melee +5, 1d6+3 slashing', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: 5, damageDice: '1d6', damageModifier: 3, damageType: 'slashing', range: '5ft', source: 'Item' as const },
                { id: 'mant-tail', name: 'Tail Spike', description: 'Ranged +5, 1d8+3 piercing, range 100/200', type: 'Action' as const, actionType: 'Attack' as const, attackType: 'Ranged' as const, attackBonus: 5, damageDice: '1d8', damageModifier: 3, damageType: 'piercing', range: '100/200', source: 'Item' as const },
            ],
        },
    ];

    const BEASTS = [
        { name: 'Brown Bear', hp: 34, ac: 11, visualUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?q=80&w=400&auto=format&fit=crop' },
        { name: 'Dire Wolf', hp: 37, ac: 14, visualUrl: 'https://images.unsplash.com/photo-1590422411916-f63aa8306dfc?q=80&w=400&auto=format&fit=crop' },
        { name: 'Giant Spider', hp: 26, ac: 14, visualUrl: 'https://images.unsplash.com/photo-1536704382439-da99b6400077?q=80&w=400&auto=format&fit=crop' },
        { name: 'Wolf', hp: 11, ac: 13, visualUrl: 'https://images.unsplash.com/photo-1557344229-30df2f360706?q=80&w=400&auto=format&fit=crop' }
    ];

    // Homebrew store (read-only in combat)
    const { monsters: homebrewMonsters, spells: homebrewSpells } = useHomebrew();
    // Custom bestiary entries from NPCManager
    const [bestiaryNpcs] = usePersistentState<any[]>('mythic_custom_npcs', []);

    // Auto-show builder if empty
    useEffect(() => {
        if (combatants.length === 0) {
            setIsBuilding(true);
        }
    }, [combatants.length]);

    // ── VICTORY / DEFEAT AUTO-DETECTION ──────────────────────────────────────
    useEffect(() => {
        if (combatants.length === 0 || showVictory) return;
        const enemies = combatants.filter(c => c.side === 'Enemy');
        const allies = combatants.filter(c => c.side === 'Ally');
        if (enemies.length === 0) return; // No enemies yet, encounter not started
        const allEnemiesDown = enemies.every(c => c.currentHP <= 0 || c.status?.includes('Dead'));
        const allAlliesDown = allies.length > 0 && allies.every(c => c.currentHP <= 0 || c.status?.includes('Dead'));
        if (allEnemiesDown) {
            addLog('All enemies have been defeated! Victory!', 'system');
            setShowVictory('victory');
        } else if (allAlliesDown) {
            addLog('All party members are down. Defeat.', 'system');
            setShowVictory('defeat');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [combatants.map(c => `${c.instanceId}:${c.currentHP}:${c.status?.join(',')}`).join('|')]);

    const startCombat = (newCombatants: CombatantState[], config?: CombatSetupConfig) => {
        // Apply combat mode config
        if (config) {
            setCombatMode(config.mode);
            setGlobalRollMode(config.rollMode);
        }
        setLog([]); // Clear log for new encounter
        setRound(1); // Reset round

        // Assign fresh grid positions matching Battlemat's exact layout formula.
        // Always reassign so tokens never start at stale positions from a previous session.
        const allies = newCombatants.filter(c => c.side === 'Ally');
        const enemies = newCombatants.filter(c => c.side === 'Enemy');
        const withPositions = newCombatants.map(c => {
            return { ...c, position: getEffectivePosition(c, newCombatants) };
        });
        setCombatants(withPositions);
        if (newCombatants.length > 0) {
            // Enter SetupPhase instead of immediately starting turns.
            // DM positions forces, edits levels, then presses "Start Combat".
            setActiveId(null);        // No active turn yet
            setSelectedId(null);
            setIsBuilding(false);
            setIsSetupPhase(true);    // Show setup overlay
            addLog(`Initiative set! ${newCombatants.length} combatants ready. DM: position forces then Start Combat.`, 'system');
        }
    };

    /** Called when DM clicks "START COMBAT" in setup phase — begins turn order. */
    const beginTurns = () => {
        const sorted = [...combatants]
            .filter(c => c.inCombat)
            .sort((a, b) => {
                if (b.initiative !== a.initiative) return b.initiative - a.initiative;
                return a.name.localeCompare(b.name);
            });
        if (sorted.length === 0) return;
        const firstId = sorted[0].instanceId;
        setActiveId(firstId);
        setSelectedId(firstId);
        setIsSetupPhase(false);
        const modeLabel = combatMode ? ` [${combatMode.replace('_', ' ')}]` : '';
        addLog(`⚔️ COMBAT BEGINS! Turn 1 — ${sorted[0].name}${modeLabel}`, 'system');
    };

    const resetCombat = () => {
        setCombatants([]);
        setActiveId(null);
        setRound(1);
        setLog([]);
        setIsBuilding(true);
        setIsSetupPhase(false);
        setCombatPhase('awaiting_input');
        setMovePreviewDest(null);
        // Show a brief auto-dismissing toast
        setResetToast(true);
        setTimeout(() => setResetToast(false), 2000);
    };

    // ── COMBAT ACTION MODAL (replaces old ManualDiceRoller) ──────────────────
    const [combatActionModal, setCombatActionModal] = useState<{
        isOpen: boolean;
        attacker?: CombatantState;
        action?: Action;
        initialTarget?: CombatantState | null;
    }>({ isOpen: false });

    // ── MULTIATTACK QUEUE ─────────────────────────────────────────────────────
    const [multiattackQueue, setMultiattackQueue] = useState<{
        attacker: CombatantState;
        action: Action;
        remaining: number;
        total: number;
    } | null>(null);

    // ── DM TEMP LOADOUT ───────────────────────────────────────────────────────
    const [showTempLoadout, setShowTempLoadout] = useState(false);
    const [tempActionName, setTempActionName] = useState('');
    const [tempActionDice, setTempActionDice] = useState('1d6');
    const [tempActionBonus, setTempActionBonus] = useState('0');
    const [tempActionType, setTempActionType] = useState('slashing');

    // ── AOE PREVIEW (aim mode on battlemap) ───────────────────────────────────
    const [aoePreview, setAoePreview] = useState<{
        attacker: CombatantState;
        action: Action;
    } | null>(null);

    // ── VICTORY / END COMBAT ──────────────────────────────────────────────────
    const [victoryPending, setVictoryPending] = useState(false);

    // ── LIBRARY PANEL ─────────────────────────────────────────────────────────
    const [showLibrary, setShowLibrary] = useState(false);

    // ── BATTLE STATE PANEL ────────────────────────────────────────────────────
    const [showBattleState, setShowBattleState] = useState(false);

    // ── SPAWN MONSTER PANEL ───────────────────────────────────────────────────
    const [showSpawnPanel, setShowSpawnPanel] = useState(false);
    const [spawnSearch, setSpawnSearch] = useState('');
    const [noteInput, setNoteInput] = useState('');
    const [customSpawnName, setCustomSpawnName] = useState('');
    const [customSpawnHp, setCustomSpawnHp] = useState('');
    const [customSpawnAc, setCustomSpawnAc] = useState('');

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploadingFor, setUploadingFor] = useState<string | null>(null);

    // 2. DERIVED STATE
    const sortedCombatants = useMemo(() => {
        return [...combatants]
            .filter(c => c.inCombat)
            .sort((a, b) => {
                if (b.initiative !== a.initiative) return b.initiative - a.initiative;
                return a.name.localeCompare(b.name);
            });
    }, [combatants]);

    const activeCombatant = useMemo(() => 
        sortedCombatants.find(c => c.instanceId === activeId) || sortedCombatants[0]
    , [sortedCombatants, activeId]);

    const selectedCombatant = useMemo(() => 
        selectedId ? sortedCombatants.find(c => c.instanceId === selectedId) : null
    , [sortedCombatants, selectedId]);

    // Initialize Active ID
    useEffect(() => {
        if (!activeId && sortedCombatants.length > 0) {
            setActiveId(sortedCombatants[0].instanceId);
            setSelectedId(sortedCombatants[0].instanceId);
        }
    }, [sortedCombatants, activeId]);

    // Sync DM notes input when selected combatant changes
    useEffect(() => {
        const target = selectedId ? sortedCombatants.find(c => c.instanceId === selectedId) : null;
        setDmNotesInput(target?.dmNotes || '');
    }, [selectedId]);

    // AI Automation — only fires in FULL_GAME mode. All other modes require DM to command enemy turns.
    useEffect(() => {
        if (!activeId || isBuilding || isSetupPhase) return;
        const currentCombatant = combatants.find(c => c.instanceId === activeId);

        if (currentCombatant && currentCombatant.side === 'Enemy' && currentCombatant.currentHP > 0) {
            // Check for incapacitating conditions (always skip, regardless of mode)
            if (currentCombatant.conditions.includes('Incapacitated')) {
                addLog(`${currentCombatant.name} is incapacitated and skips their turn.`, 'system');
                setTimeout(endTurn, 1000);
                return;
            }

            // NON-FULL_GAME modes: DM controls enemy turns manually
            if (!isDMMode && combatMode !== 'FULL_GAME') {
                addLog(`⚔ ${currentCombatant.name}'s turn — select an action in the character panel or click End Turn.`, 'system');
                setSelectedId(currentCombatant.instanceId); // auto-show enemy sheet so DM can act
                return;
            }

            // FULL_GAME: enemy AI takes its turn automatically
            const timer = setTimeout(() => {
                const nextAction = DecisionEngine.getNextMove(currentCombatant, {
                    combatants,
                    activeCombatantId: activeId,
                    round,
                    log,
                    isDMMode: true
                });

                if (nextAction.type === 'attack' && nextAction.action) {
                    const target = combatants.find(c => c.instanceId === nextAction.targetId);
                    if (target) handleAction(currentCombatant, nextAction.action, target);
                    else endTurn();
                } else if (nextAction.type === 'move' && nextAction.position) {
                    setCombatants(prev => prev.map(c =>
                        c.instanceId === currentCombatant.instanceId
                            ? { ...c, position: nextAction.position, resources: { ...c.resources, movementSpent: c.resources.movementSpent + 10 } }
                            : c
                    ));
                    setTimeout(() => {
                        const afterMove = DecisionEngine.getNextMove(
                            { ...currentCombatant, position: nextAction.position },
                            { combatants, activeCombatantId: activeId, round, log, isDMMode: true }
                        );
                        if (afterMove.type === 'attack' && afterMove.action) {
                            const t = combatants.find(c => c.instanceId === afterMove.targetId);
                            if (t) handleAction(currentCombatant, afterMove.action, t);
                            else endTurn();
                        } else {
                            endTurn();
                        }
                    }, 500);
                } else {
                    endTurn();
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [activeId, isBuilding, combatMode, isDMMode]);

    // 3. HANDLERS
    const updateCombatant = (instanceId: string, updates: Partial<CombatantState>) => {
        setCombatants(prev => prev.map(c => c.instanceId === instanceId ? { ...c, ...updates } : c));
    };

    const addLog = (message: string, type: 'combat' | 'system' | 'narrative' | 'movement' | 'notes' = 'combat') => {
        setLog(prev => [{
            id: generateSafeId(),
            message,
            type,
            timestamp: Date.now()
        }, ...prev].slice(0, 50));
    };

    const generateSafeId = () => Math.random().toString(36).substring(2, 9);

    // Escape key: cancel AoE aim mode (placed after aoePreview and addLog are defined)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && aoePreview) {
                setAoePreview(null);
                addLog('AoE placement cancelled.', 'system');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [aoePreview]);

    // ── RANGE UTILITY ────────────────────────────────────────────────────────
    /** Parse action range string → normal range in feet. "5ft"→5, "60ft"→60, "100/200"→100, "Touch"→5 */
    const parseRangeFt = (rangeStr?: string): number => {
        if (!rangeStr) return 5;
        const s = rangeStr.toLowerCase().trim();
        if (s === 'self') return 0;
        if (s === 'touch') return 5;
        if (s === 'unlimited' || s === 'any') return Infinity;
        // "100/200" — take normal range (first number)
        const slashMatch = s.match(/^(\d+)/);
        if (slashMatch) return parseInt(slashMatch[1], 10);
        // "60ft", "60 ft", "60feet"
        const ftMatch = s.match(/(\d+)/);
        if (ftMatch) return parseInt(ftMatch[1], 10);
        return 5;
    };

    /** Pixels per foot on the battlemat (50px = 1 square = gridScale ft) */
    const GRID_PX = 50;
    const PX_PER_FT = GRID_PX / gridScale;

    /** Distance in feet between two combatants' positions. Returns null if positions unknown. */
    const getDistanceFt = (a: CombatantState, b: CombatantState): number | null => {
        if (!a.position || !b.position) return null;
        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        return Math.round(Math.sqrt(dx * dx + dy * dy) / PX_PER_FT);
    };

    // ── MOVE PHASE HELPERS ───────────────────────────────────────────────────
    // isDMMode: true for any non-FULL_GAME mode (DM_TABLE, MANUAL, ASSISTED, AUTO_RESOLUTION)
    // or during setup phase. Only FULL_GAME (full AI) restricts free token movement.
    // ── OLD DERIVED DM MODE (REMOVED) ────────────────────────────────────────
    // const isDMMode = combatMode !== 'FULL_GAME' || isSetupPhase; 

    const enterMovePreview = () => {
        if (!activeCombatant) return;
        const remaining = activeCombatant.resources?.movementRemaining ?? 0;
        if (remaining <= 0 && !isDMMode && combatMode === 'FULL_GAME') {
            setRangeError('No movement remaining this turn.');
            setTimeout(() => setRangeError(null), 3000);
            return;
        }
        setCombatPhase('move_preview');
        setMovePreviewDest(null);
    };

    const cancelMovePreview = () => {
        setCombatPhase('awaiting_input');
        setMovePreviewDest(null);
    };

    const confirmMove = () => {
        if (!movePreviewDest || !activeCombatant) return;
        updatePosition(activeCombatant.instanceId, movePreviewDest);
        addLog(`${activeCombatant.name} moves.`, 'combat');
        setCombatPhase('awaiting_input');
        setMovePreviewDest(null);
    };

    const handleAction = async (attacker: CombatantState, action: Action, targetOverride?: CombatantState) => {
        const fId = Math.random().toString(36);
        setFloatingTexts(prev => [...prev, { 
            id: fId, 
            text: action.name, 
            x: (attacker.position?.x || 0) + 600, 
            y: (attacker.position?.y || 0) + 400 
        }]);
        setTimeout(() => setFloatingTexts(prev => prev.filter(f => f.id !== fId)), 2000);

        // Wild Shape: bypass combat modal entirely
        if (action.name === 'Wild Shape') {
            setWildshapeTargetId(attacker.instanceId);
            setIsWildshapeOpen(true);
            consumeResources(attacker, action);
            return;
        }

        // Non-targeted utility actions (no damage / no attack roll needed)
        if (action.actionType === 'Ability' && !action.damageDice && !action.saveDC && !action.isHealing) {
            addLog(`${attacker.name} uses ${action.name}.`, 'combat');
            consumeResources(attacker, action);
            if (attacker.side === 'Enemy') setTimeout(endTurn, 1000);
            return;
        }

        // AoE Spell: enter aim mode on battlemap so player can choose placement
        if (action.aoeShape && action.aoeSize && action.actionType !== 'Attack') {
            setAoePreview({ attacker, action });
            setViewMode('battlemap');
            addLog(`${attacker.name} aims ${action.name} — click the map to choose the target point.`, 'system');
            return;
        }

        // 1. Resolve initial target (may be overridden inside modal)
        const preTarget = targetOverride
            || (targetId ? sortedCombatants.find(c => c.instanceId === targetId) : null)
            || null;

        // ── RANGE VALIDATION (hard block — range must pass before roll modal opens) ──
        // Only validate when we have both positions AND a confirmed target.
        // If no target yet the modal will let the player pick one (validated there too).
        if (preTarget && !isDMMode && combatMode === 'FULL_GAME' && action.actionType === 'Attack') {
            const actionRangeFt = parseRangeFt(action.range);
            const distanceFt = getDistanceFt(attacker, preTarget);
            if (distanceFt !== null && actionRangeFt !== Infinity && distanceFt > actionRangeFt) {
                const isMelee = actionRangeFt <= 10;
                const msg = isMelee
                    ? `${preTarget.name} is ${distanceFt} ft away — melee reach is ${actionRangeFt} ft. Move closer first.`
                    : `${preTarget.name} is ${distanceFt} ft away — ${action.name} range is ${actionRangeFt} ft.`;
                setRangeError(msg);
                setTimeout(() => setRangeError(null), 4000);
                addLog(`⚠ Out of range: ${msg}`, 'system');
                return; // HARD BLOCK — do not open roll modal
            }
        }

        // 2. Set up multiattack queue if applicable
        if (action.multiattack && action.multiattack > 1) {
            setMultiattackQueue({ attacker, action, remaining: action.multiattack, total: action.multiattack });
            addLog(`${attacker.name} begins ${action.multiattack}-attack sequence with ${action.name}.`, 'system');
        } else {
            setMultiattackQueue(null);
        }

        // 3. Open the stepped CombatActionModal for all attack / spell / heal flows
        setCombatActionModal({
            isOpen: true,
            attacker,
            action,
            initialTarget: preTarget,
        });
    };

    // Called when CombatActionModal resolves a full action
    const handleActionResolution = (res: ActionResolution) => {
        setCombatActionModal({ isOpen: false });

        addLog(res.log, 'combat');

        if (res.damage !== undefined && res.damage > 0 && res.target) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 300);
            applyDamage(res.target, res.damage);
        }

        if (res.healing !== undefined && res.healing > 0 && res.target) {
            applyHealing(res.target.instanceId, res.healing);
        }

        // ── Concentration auto-set ─────────────────────────────────────────
        if (res.action.requiresConcentration && res.attacker) {
            const wasConcentrating = combatants.find(c => c.instanceId === res.attacker.instanceId)?.concentration;
            if (wasConcentrating) {
                addLog(`${res.attacker.name} breaks concentration on ${wasConcentrating} → now concentrating on ${res.action.name}.`, 'system');
            } else {
                addLog(`${res.attacker.name} is concentrating on ${res.action.name}.`, 'system');
            }
            setCombatants(prev => prev.map(c => {
                if (c.instanceId !== res.attacker.instanceId) return c;
                return {
                    ...c,
                    concentration: res.action.name,
                    conditions: [...c.conditions.filter(cd => cd !== ('Concentrating' as any)), 'Concentrating' as any],
                };
            }));
        }

        if (res.attacker) {
            consumeResources(res.attacker, res.action);
        }

        // ── Multiattack: if more attacks remain, reopen modal without consuming action again ──
        if (multiattackQueue && multiattackQueue.remaining > 1) {
            const next = { ...multiattackQueue, remaining: multiattackQueue.remaining - 1 };
            setMultiattackQueue(next);
            const attackNum = next.total - next.remaining + 1;
            addLog(`⚔ Attack ${attackNum}/${next.total}…`, 'system');
            setTimeout(() => {
                const fresh = combatants.find(c => c.instanceId === next.attacker.instanceId) || next.attacker;
                setCombatActionModal({ isOpen: true, attacker: fresh, action: next.action, initialTarget: res.target ?? null });
            }, 400);
            return; // Don't trigger endTurn yet
        } else if (multiattackQueue) {
            setMultiattackQueue(null);
        }

        if (res.attacker?.side === 'Enemy') {
            setTimeout(endTurn, 1000);
        }

        // ── Victory detection ──────────────────────────────────────────────
        setTimeout(() => {
            const enemies = combatants.filter(c => c.side === 'Enemy' && c.inCombat);
            const allEnemiesDead = enemies.length > 0 && enemies.every(c => c.currentHP <= 0);
            if (allEnemiesDead) {
                setVictoryPending(true);
            }
        }, 600);
    };

    const handleAddMonster = (monster: any) => {
        const newInstanceId = `summon-${monster.id || 'creature'}-${Math.random().toString(36).substring(2, 7)}`;
        
        const normalizedActions: Action[] = (monster.actions || []).map((a: any, idx: number) => {
            if (typeof a === 'string') {
                const parts = a.split('.');
                const name = parts[0].trim();
                const desc = parts.slice(1).join('.').trim() || a;
                return {
                    id: `act-${newInstanceId}-${idx}`,
                    name,
                    description: desc,
                    type: 'Action',
                    actionType: 'Ability',
                    source: 'Monster'
                } as Action;
            }
            return {
                ...a,
                id: a.id || `act-${newInstanceId}-${idx}`,
                source: 'Monster'
            } as Action;
        });

        const newMonster: CombatantState = {
            instanceId: newInstanceId,
            id: monster.id || 'custom-monster',
            name: monster.name,
            class: monster.class || monster.type || 'Creature',
            level: monster.cr || 1,
            side: 'Enemy',
            currentHP: monster.hp || 10,
            maxHP: monster.hp || 10,
            tempHP: 0,
            ac: monster.ac || 10,
            baseAC: monster.ac || 10,
            initiative: 0,
            derived: {
                initiativeBonus: Math.floor(((monster.stats?.DEX || 10) - 10) / 2),
                passivePerception: 10 + Math.floor(((monster.stats?.WIS || 10) - 10) / 2),
                spellAttackBonus: 0,
                spellSaveDC: 10,
                abilityModifiers: {
                    STR: Math.floor(((monster.stats?.STR || 10) - 10) / 2),
                    DEX: Math.floor(((monster.stats?.DEX || 10) - 10) / 2),
                    CON: Math.floor(((monster.stats?.CON || 10) - 10) / 2),
                    INT: Math.floor(((monster.stats?.INT || 10) - 10) / 2),
                    WIS: Math.floor(((monster.stats?.WIS || 10) - 10) / 2),
                    CHA: Math.floor(((monster.stats?.CHA || 10) - 10) / 2),
                }
            },
            proficiencyBonus: 2,
            skillProficiencies: [],
            isWildShaped: false,
            abilityScores: monster.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
            speed: monster.speed || 30,
            species: monster.type || 'Monster',
            conditions: [],
            status: [],
            inCombat: true,
            rollMode: 'Auto',
            deathSaves: { successes: 0, failures: 0 },
            resources: {
                action: true,
                bonusAction: true,
                reaction: true,
                movementMax: monster.speed || 30,
                movementSpent: 0,
                movementRemaining: monster.speed || 30,
                actionUsed: false,
                bonusActionUsed: false,
                reactionUsed: false
            },
            position: { x: 50 * 5, y: 50 * 5 },
            actions: normalizedActions,
            imageUrl: monster.visualUrl || null,
            notes: `CR ${monster.cr || '?'}`,
            concentration: null,
            identity: { id: newInstanceId, name: monster.name, species: monster.type || 'Monster', background: '', alignment: '', appearance: '', personality: '', portrait: monster.visualUrl || '' },
            progression: { level: monster.cr || 1, proficiencyBonus: 2 },
            abilities: monster.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
            defense: { hitPoints: { current: monster.hp || 10, max: monster.hp || 10, temp: 0 }, armorClass: monster.ac || 10, deathSaves: { successes: 0, failures: 0 }, hitDice: { current: 1, max: 1, dieType: 'd8' }, armorFormulaSource: 'Natural' },
            movement: { speed: monster.speed || 30 },
            combat: { attacks: [], weaponProficiencies: [], armorProficiencies: [], shieldEquipped: false, equippedWeapons: [], conditions: [], concentration: null, resources: { action: true, bonusAction: true, reaction: true, movementSpent: 0, movementRemaining: monster.speed || 30 } },
            skillsAndSaves: { saves: [], skillProficiencies: [], expertise: [] },
            magic: { cantrips: [], preparedSpells: [], knownSpells: [], spellSlots: {}, ritualCasting: false },
            featureCategories: { classFeatures: [], subclassFeatures: [], feats: [], racialTraits: [], backgroundFeatures: [] },
            features: [],
            equipment: [],
            transformation: { activeFormType: 'Normal' },
            metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        };

        setCombatants(prev => [...prev, newMonster]);
        addLog(`DM summons ${monster.name} to the battlefield!`, 'system');
        setIsDMAddModalOpen(false);
    };

    const handleReplaceActions = (monster: any) => {
        if (!selectedId) return;
        
        const targetCombatant = combatants.find(c => c.instanceId === selectedId);
        if (!targetCombatant) return;

        const normalizedActions: Action[] = (monster.actions || []).map((a: any, idx: number) => {
            if (typeof a === 'string') {
                const parts = a.split('.');
                const name = parts[0].trim();
                const desc = parts.slice(1).join('.').trim() || a;
                return {
                    id: `rep-${selectedId}-${idx}`,
                    name,
                    description: desc,
                    type: 'Action',
                    actionType: 'Ability',
                    source: 'Monster'
                } as Action;
            }
            return {
                ...a,
                id: a.id || `rep-${selectedId}-${idx}`,
                source: 'Monster'
            } as Action;
        });

        updateCombatant(selectedId, { actions: normalizedActions });
        addLog(`Replaced ${targetCombatant.name}'s actions with ${monster.name}'s traits.`, 'system');
        setIsDMAddModalOpen(false);
    };

    const handleWildShapeSelect = (beastName: string) => {
        if (!wildshapeTargetId) return;

        setCombatants(prev => prev.map(c => {
            if (c.instanceId !== wildshapeTargetId) return c;

            // Look up the real beast data from QUICKSPAWN_MONSTERS (has proper Bite/Claw/Ability actions)
            const templateBeast = QUICKSPAWN_MONSTERS.find((t: any) => t.name === beastName);
            const uiBeast = BEASTS.find(b => b.name === beastName);

            const beastData = templateBeast
                ? {
                    name: templateBeast.name,
                    ac: templateBeast.ac,
                    hp: templateBeast.hp,
                    visualUrl: uiBeast?.visualUrl || '',
                    actions: templateBeast.actions,
                }
                : {
                    // Fallback for beasts not in ENEMY_TEMPLATES (use UI data + generic bite)
                    name: beastName,
                    ac: uiBeast?.ac || 11,
                    hp: uiBeast?.hp || 10,
                    visualUrl: uiBeast?.visualUrl || '',
                    actions: [
                        {
                            id: `atk-${beastName.toLowerCase().replace(/\s+/g, '-')}`,
                            name: 'Bite',
                            description: `Melee attack.`,
                            type: 'Action' as const,
                            actionType: 'Attack' as const,
                            attackBonus: 4,
                            damageDice: '1d8',
                            damageModifier: 2,
                            damageType: 'piercing',
                            range: '5ft',
                            source: 'Item' as const
                        }
                    ]
                };

            const transformed = RulesEngine.resolveWildShape(c, beastData as any);
            addLog(`${c.name} shifts into a ${beastName}!`, 'narrative');
            return transformed;
        }));

        setIsWildshapeOpen(false);
        setWildshapeTargetId(null);
    };

    const revertWildShape = (id: string) => {
        setCombatants(prev => prev.map(c => {
            if (c.instanceId !== id) return c;
            const reverted = RulesEngine.revertWildShape(c);
            addLog(`${c.name} reverts to their natural form.`, 'narrative');
            return reverted;
        }));
    };

    const updatePosition = (id: string, pos: { x: number, y: number }, cost?: number) => {
        setCombatants(prev => prev.map(c => {
            if (c.instanceId !== id) return c;
            
            // If No Change, Skip
            if (c.position?.x === pos.x && c.position?.y === pos.y) return c;

            // DM Mode or Free Movement check — all non-FULL_GAME modes allow free placement
            if (isDMMode || isSetupPhase) {
                return { ...c, position: pos };
            }

            // Standard Combat Movement Enforcement
            const finalCost = cost !== undefined ? cost : (() => {
                const oldPos = c.position || { x: 0, y: 0 };
                const dx = pos.x - oldPos.x;
                const dy = pos.y - oldPos.y;
                const pxPerFt = 50 / gridScale;
                const distance = Math.sqrt(dx * dx + dy * dy) / pxPerFt;
                return Math.round(distance / 5) * 5;
            })();

            const remaining = c.resources.movementRemaining ?? Math.max(0, (c.resources.movementMax ?? 30) - (c.resources.movementSpent ?? 0));

            if (finalCost > remaining) return c;

            return { 
                ...c, 
                position: pos,
                resources: {
                    ...c.resources,
                    movementSpent: (c.resources.movementSpent || 0) + finalCost,
                    movementRemaining: remaining - finalCost
                }
            };
        }));
    };

    const applyDamage = (target: CombatantState, amount: number) => {
        setCombatants(prev => prev.map(c => {
            if (c.instanceId !== target.instanceId) return c;
            let newHP = c.currentHP;
            let newTempHP = c.tempHP;
            let remainingDmg = amount;

            if (newTempHP > 0) {
                const absorbed = Math.min(newTempHP, remainingDmg);
                newTempHP -= absorbed;
                remainingDmg -= absorbed;
            }
            newHP = Math.max(0, newHP - remainingDmg);
            
            const updated = { ...c, currentHP: newHP, tempHP: newTempHP };
            
            if (newHP <= 0 && c.currentHP > 0) {
                if (updated.side === 'Enemy') {
                    addLog(`${c.name} has been defeated!`, 'combat');
                } else {
                    addLog(`${c.name} has fallen unconscious!`, 'combat');
                }
            }
            
            if (updated.isWildShaped && updated.currentHP <= 0) {
                addLog(`${c.name}'s beast form was reduced to 0 HP and they revert!`, 'combat');
                return RulesEngine.revertWildShape(updated);
            }
            
            return updated;
        }));

        // CHECK VICTORY
        setTimeout(() => {
            setCombatants(prev => {
                const enemiesInCombat = prev.filter(c => c.side === 'Enemy' && c.inCombat && c.currentHP > 0);
                if (enemiesInCombat.length === 0 && prev.filter(c => c.side === 'Enemy' && c.inCombat).length > 0) {
                    addLog('VICTORY! All enemies have been defeated.', 'system');
                }
                return prev;
            });
        }, 500);
    };

    const consumeResources = (attacker: CombatantState, action: Action) => {
        setCombatants(prev => prev.map(c => {
            if (c.instanceId !== attacker.instanceId) return c;

            // Deduct spell slot if this is a levelled spell
            let newSpellSlots = { ...(c.resources.spellSlots || {}) };
            if ((action.actionType === 'Spell' || action.type === 'Spell') && action.spellLevel && action.spellLevel > 0) {
                const lvl = action.spellLevel;
                const slot = newSpellSlots[lvl];
                if (slot && slot.current > 0) {
                    newSpellSlots = { ...newSpellSlots, [lvl]: { ...slot, current: slot.current - 1 } };
                    // Try to consume the lowest available slot if the exact level is depleted
                } else {
                    // Find the next available slot level >= spellLevel
                    const fallbackLvl = Object.keys(newSpellSlots)
                        .map(Number)
                        .sort((a, b) => a - b)
                        .find(l => l >= lvl && newSpellSlots[l]?.current > 0);
                    if (fallbackLvl !== undefined) {
                        const fallbackSlot = newSpellSlots[fallbackLvl];
                        newSpellSlots = { ...newSpellSlots, [fallbackLvl]: { ...fallbackSlot, current: fallbackSlot.current - 1 } };
                    }
                }
            }

            // Deduct Wild Shape charge if applicable
            const wsCur = c.resources.wildShapeCharges?.current ?? 0;
            const wsMax = c.resources.wildShapeCharges?.max ?? 0;
            const newWildShape = { current: (action.name === 'Wild Shape' && wsCur > 0) ? wsCur - 1 : wsCur, max: wsMax };

            return {
                ...c,
                resources: {
                    ...c.resources,
                    actionUsed: action.type === 'Action' ? true : c.resources.actionUsed,
                    bonusActionUsed: action.type === 'Bonus Action' ? true : c.resources.bonusActionUsed,
                    spellSlots: newSpellSlots,
                    wildShapeCharges: newWildShape,
                }
            };
        }));
    };

    const toggleRollMode = (id: string) => {
        setCombatants(prev => prev.map(c =>
            c.instanceId === id ? { ...c, rollMode: c.rollMode === 'Auto' ? 'Manual' : 'Auto' } : c
        ));
    };

    // DEATH SAVE — 2024 rules: roll d20, 10+ = success, 1 = 2 failures, 20 = regain 1 HP
    const handleDeathSave = (combatantId: string, manualRoll?: number) => {
        const combatant = combatants.find(c => c.instanceId === combatantId);
        if (!combatant || combatant.currentHP > 0) return;

        const result = RulesEngine.resolveDeathSave(combatant, manualRoll);
        addLog(result.log, 'combat');

        setCombatants(prev => prev.map(c => {
            if (c.instanceId !== combatantId) return c;
            if (result.isDead) {
                addLog(`${c.name} has died.`, 'combat');
                return { ...c, deathSaves: { successes: result.isStable ? 3 : c.deathSaves.successes, failures: 3 }, status: [...c.status, 'Dead'] };
            }
            if (result.isStable) {
                addLog(`${c.name} is now stable.`, 'combat');
                return { ...c, currentHP: result.total === 20 ? 1 : 0, deathSaves: { successes: 3, failures: c.deathSaves.failures }, status: [...c.status.filter(s => s !== 'Unconscious'), 'Stable'] };
            }
            const newSuccesses = result.success ? c.deathSaves.successes + 1 : c.deathSaves.successes;
            const newFailures = result.total === 1 ? c.deathSaves.failures + 2 : (!result.success ? c.deathSaves.failures + 1 : c.deathSaves.failures);
            return { ...c, deathSaves: { successes: Math.min(3, newSuccesses), failures: Math.min(3, newFailures) } };
        }));
    };

    const handleDash = (combatantId: string) => {
        setCombatants(prev => prev.map(c => {
            if (c.instanceId !== combatantId) return c;
            if (c.resources?.actionUsed) {
                addLog(`${c.name} cannot Dash: Action already used.`, 'system');
                return c;
            }
            addLog(`${c.name} uses Dash! Movement pool increased.`, 'combat');
            return {
                ...c,
                resources: {
                    ...c.resources,
                    actionUsed: true,
                    movementRemaining: (c.resources?.movementRemaining || 0) + (c.resources?.movementMax || 30)
                }
            };
        }));
    };

    const endTurn = () => {
        if (!combatStarted) return;
        setTargetId(null);
        const sortedList = [...sortedCombatants];
        if (sortedList.length === 0) return;

        const currentIndex = sortedList.findIndex(c => c.instanceId === activeId);
        let nextIndex = (currentIndex + 1) % sortedList.length;
        
        // Skip dead monsters automatically
        let searchCount = 0;
        while (
            sortedList[nextIndex].side === 'Enemy' && 
            sortedList[nextIndex].currentHP <= 0 && 
            searchCount < sortedList.length
        ) {
            nextIndex = (nextIndex + 1) % sortedList.length;
            searchCount++;
        }
        
        // Check for round increment
        let newRound = round;
        if (nextIndex <= currentIndex || currentIndex === -1) {
            newRound = round + 1;
            setRound(newRound);
            addLog(`--- Round ${newRound} Begins ---`, 'system');
        }

        const next = sortedList[nextIndex];
        setActiveId(next.instanceId);
        setSelectedId(next.instanceId);
        addLog(`${next.name}'s turn started.`, 'system');
        
        setTurnFlash(true);
        setTimeout(() => setTurnFlash(false), 600);

        setCombatants(prev => prev.map(c =>
            c.instanceId === next.instanceId ? {
                ...c,
                resources: {
                    ...c.resources,
                    actionUsed: false,
                    bonusActionUsed: false,
                    reactionUsed: false,
                    movementSpent: 0,
                    movementRemaining: c.resources.movementMax || 30
                }
            } : c
        ));
    };

    const longRest = () => {
        setCombatants(prev => prev.map(c => ({
            ...c,
            currentHP: c.maxHP,
            tempHP: 0,
            resources: {
                ...c.resources,
                actionUsed: false,
                bonusActionUsed: false,
                reactionUsed: false,
                movementSpent: 0,
                spellSlots: Object.fromEntries(
                    Object.entries(c.resources.spellSlots || {}).map(([lvl, s]) => [lvl, { ...s, current: s.max }])
                )
            }
        })));
        addLog(`The party takes a Long Rest. All resources restored.`, 'narrative');
    };

    const useSpellSlot = (level: number) => {
        if (!activeId) return;
        setCombatants(prev => prev.map(c => {
            if (c.instanceId !== activeId) return c;
            const spellSlots = c.resources.spellSlots || {};
            const currentSlots = spellSlots[level];
            if (!currentSlots || currentSlots.current <= 0) return c;
            
            addLog(`${c.name} casts a Level ${level} spell.`, 'combat');
            return {
                ...c,
                resources: {
                    ...c.resources,
                    spellSlots: {
                        ...(c.resources.spellSlots || {}),
                        [level]: { ...currentSlots, current: currentSlots.current - 1 }
                    }
                }
            };
        }));
    };

    const updatePortrait = (id: string) => {
        setUploadingFor(id);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && uploadingFor) {
            const MAX_SIZE = 320; // resize to max 320×320 to keep payload small for server sync
            const img = new window.Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                let w = img.naturalWidth, h = img.naturalHeight;
                if (w > MAX_SIZE || h > MAX_SIZE) {
                    if (w > h) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE; }
                    else { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, w, h);
                    const base64 = canvas.toDataURL('image/jpeg', 0.82);
                    URL.revokeObjectURL(objectUrl);
                    const name = combatants.find(c => c.instanceId === uploadingFor)?.name;
                    setCombatants(prev => prev.map(c =>
                        c.instanceId === uploadingFor ? { ...c, portrait: base64 } : c
                    ));
                    setUploadingFor(null);
                    addLog(`Portrait updated for ${name}.`, 'system');
                } else {
                    // Canvas not available: fall back to raw base64
                    URL.revokeObjectURL(objectUrl);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
                        const name = combatants.find(c => c.instanceId === uploadingFor)?.name;
                        setCombatants(prev => prev.map(c =>
                            c.instanceId === uploadingFor ? { ...c, portrait: base64 } : c
                        ));
                        setUploadingFor(null);
                        addLog(`Portrait updated for ${name}.`, 'system');
                    };
                    reader.readAsDataURL(file);
                }
            };
            img.onerror = () => { URL.revokeObjectURL(objectUrl); setUploadingFor(null); };
            img.src = objectUrl;
        }
    };

    // DM PANEL — direct HP/AC/TempHP set for selected combatant
    const dmApplyHP = (instanceId: string) => {
        const val = parseInt(dmHpInput);
        if (isNaN(val)) return;
        updateCombatant(instanceId, { currentHP: Math.max(0, Math.min(val, combatants.find(c => c.instanceId === instanceId)?.maxHP || 999)) });
        addLog(`[DM] Set ${combatants.find(c => c.instanceId === instanceId)?.name}'s HP to ${val}.`, 'system');
        setDmHpInput('');
    };
    const dmApplyAC = (instanceId: string) => {
        const val = parseInt(dmAcInput);
        if (isNaN(val)) return;
        updateCombatant(instanceId, { ac: val, baseAC: val });
        addLog(`[DM] Set ${combatants.find(c => c.instanceId === instanceId)?.name}'s AC to ${val}.`, 'system');
        setDmAcInput('');
    };
    const dmApplyTempHP = (instanceId: string) => {
        const val = parseInt(dmTempHpInput);
        if (isNaN(val)) return;
        updateCombatant(instanceId, { tempHP: Math.max(0, val) });
        addLog(`[DM] Set ${combatants.find(c => c.instanceId === instanceId)?.name}'s Temp HP to ${val}.`, 'system');
        setDmTempHpInput('');
    };
    /** DM: change a combatant's level and recalculate dependent stats. */
    const dmChangeLevel = (instanceId: string, newLevel: number) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        const clamped = Math.max(1, Math.min(20, newLevel));
        // D&D 5e proficiency bonus by level
        const profByLevel = [0, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6];
        const newProf = profByLevel[clamped] ?? 2;
        // Scale maxHP proportionally to the level change
        const oldLevel = Math.max(1, c.level);
        const scaledMax = Math.max(1, Math.round(c.maxHP * clamped / oldLevel));
        // Keep HP ratio; clamp to new max
        const hpRatio = c.maxHP > 0 ? c.currentHP / c.maxHP : 1;
        const scaledCurrent = Math.max(1, Math.min(scaledMax, Math.round(scaledMax * hpRatio)));
        updateCombatant(instanceId, {
            level: clamped,
            proficiencyBonus: newProf,
            maxHP: scaledMax,
            currentHP: scaledCurrent,
        });
        addLog(`[DM] ${c.name} level → ${clamped} (Prof +${newProf}, HP ${scaledCurrent}/${scaledMax}).`, 'system');
    };

    const dmAdjustHP = (instanceId: string, delta: number) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        const newHP = Math.max(0, Math.min(c.maxHP, c.currentHP + delta));
        updateCombatant(instanceId, { currentHP: newHP });
        addLog(`[DM] ${delta > 0 ? 'Healed' : 'Damaged'} ${c.name} for ${Math.abs(delta)} → ${newHP} HP.`, 'system');
    };
    const dmToggleCondition = (instanceId: string, condition: string) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        const has = c.conditions.includes(condition as any);
        updateCombatant(instanceId, {
            conditions: has ? c.conditions.filter(cd => cd !== condition) : [...c.conditions, condition as any]
        });
    };
    const dmKillInstantly = (instanceId: string) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        updateCombatant(instanceId, { currentHP: 0, status: [...c.status, 'Dead'] });
        addLog(`[DM] ${c.name} was instantly killed.`, 'system');
    };
    const dmRevive = (instanceId: string) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        updateCombatant(instanceId, { currentHP: 1, status: c.status.filter(s => s !== 'Dead' && s !== 'Stable'), deathSaves: { successes: 0, failures: 0 } });
        addLog(`[DM] ${c.name} was revived with 1 HP.`, 'system');
    };

    // ── INITIATIVE EDITING ────────────────────────────────────────────────────
    const handleInitiativeEdit = (instanceId: string, newInit: number) => {
        updateCombatant(instanceId, { initiative: newInit });
        setInitiativeEditId(null);
        addLog(`[DM] Initiative for ${combatants.find(c => c.instanceId === instanceId)?.name} set to ${newInit}.`, 'system');
    };

    // ── HIDDEN / VISIBILITY TOGGLES ───────────────────────────────────────────
    const dmToggleHidden = (instanceId: string) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        const nowHidden = !c.hidden;
        // Hidden combatants also gain the Hidden condition for RulesEngine advantage/disadvantage
        const updatedConditions = nowHidden
            ? [...c.conditions.filter(cd => cd !== 'Hidden'), 'Hidden' as any]
            : c.conditions.filter(cd => cd !== 'Hidden');
        updateCombatant(instanceId, { hidden: nowHidden, conditions: updatedConditions });
        addLog(`[DM] ${c.name} is ${nowHidden ? 'now hidden' : 'no longer hidden'}.`, 'system');
    };

    const dmTogglePartialHidden = (instanceId: string) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        updateCombatant(instanceId, { partialHidden: !c.partialHidden });
        addLog(`[DM] ${c.name} is ${!c.partialHidden ? 'partially hidden (cover)' : 'fully visible'}.`, 'system');
    };

    // ── CONCENTRATION ─────────────────────────────────────────────────────────
    const dmSetConcentration = (instanceId: string, spellName: string | null) => {
        updateCombatant(instanceId, { concentration: spellName });
        const c = combatants.find(c => c.instanceId === instanceId);
        if (spellName) {
            // Add Concentrating condition
            updateCombatant(instanceId, {
                concentration: spellName,
                conditions: [...(c?.conditions || []).filter(cd => cd !== 'Concentrating'), 'Concentrating' as any]
            });
            addLog(`${c?.name} is concentrating on ${spellName}.`, 'combat');
        } else {
            updateCombatant(instanceId, {
                concentration: null,
                conditions: (c?.conditions || []).filter(cd => cd !== 'Concentrating')
            });
            addLog(`${c?.name}'s concentration was broken.`, 'combat');
        }
    };

    // ── ADVANTAGE / DISADVANTAGE TOGGLES ──────────────────────────────────────
    const dmToggleAdvantage = (instanceId: string) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        const has = c.conditions.includes('Advantage' as any);
        updateCombatant(instanceId, {
            conditions: has
                ? c.conditions.filter(cd => cd !== 'Advantage' as any)
                : [...c.conditions.filter(cd => cd !== 'Disadvantage' as any), 'Advantage' as any]
        });
    };

    const dmToggleDisadvantage = (instanceId: string) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        const has = c.conditions.includes('Disadvantage' as any);
        updateCombatant(instanceId, {
            conditions: has
                ? c.conditions.filter(cd => cd !== 'Disadvantage' as any)
                : [...c.conditions.filter(cd => cd !== 'Advantage' as any), 'Disadvantage' as any]
        });
    };

    // ── DM NOTES ──────────────────────────────────────────────────────────────
    const dmSaveNotes = (instanceId: string, notes: string) => {
        updateCombatant(instanceId, { dmNotes: notes });
    };

    // ── MOVEMENT ADJUSTMENT ───────────────────────────────────────────────────
    const dmSpendMovement = (instanceId: string, feet: number) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        const newSpent = Math.max(0, Math.min(c.resources.movementMax, c.resources.movementSpent + feet));
        updateCombatant(instanceId, {
            resources: { ...c.resources, movementSpent: newSpent, movementRemaining: c.resources.movementMax - newSpent }
        });
    };

    // ── HEAL / DAMAGE QUICK HELPERS ───────────────────────────────────────────
    const applyHealing = (instanceId: string, amount: number) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        const newHP = Math.min(c.maxHP, c.currentHP + amount);
        updateCombatant(instanceId, { currentHP: newHP });
        addLog(`${c.name} was healed for ${amount} HP → ${newHP}/${c.maxHP}.`, 'combat');
    };

    // ── DM TEMP LOADOUT ACTIONS ───────────────────────────────────────────────
    const grantTempAction = (instanceId: string, action: Action) => {
        updateCombatant(instanceId, {
            tempActions: [...(combatants.find(c => c.instanceId === instanceId)?.tempActions ?? []), action]
        });
        addLog(`DM granted temporary action "${action.name}" to ${combatants.find(c => c.instanceId === instanceId)?.name}.`, 'system');
    };

    const revokeTempAction = (instanceId: string, actionId: string) => {
        const c = combatants.find(c => c.instanceId === instanceId);
        if (!c) return;
        updateCombatant(instanceId, { tempActions: (c.tempActions ?? []).filter(a => a.id !== actionId) });
    };

    // ── SPAWN MONSTER ─────────────────────────────────────────────────────────
    const spawnMonster = (preset: typeof QUICKSPAWN_MONSTERS[0] | null, customName?: string, customHp?: number, customAc?: number, hbMonster?: HomebrewMonster) => {
        const name = hbMonster ? hbMonster.name : preset ? preset.name : (customName?.trim() || 'Unknown Enemy');
        const hp = hbMonster ? hbMonster.hp : preset ? preset.hp : (customHp || 10);
        const ac = hbMonster ? hbMonster.ac : preset ? preset.ac : (customAc || 10);
        const speed = hbMonster ? hbMonster.speed : (preset?.speed || 30);
        const abilityScores = hbMonster ? hbMonster.abilityScores : { STR: 10, DEX: 12, CON: 10, INT: 8, WIS: 10, CHA: 8 };
        const actions = hbMonster ? hbMonster.actions : (preset?.actions || []);
        const initRoll = Math.floor(Math.random() * 20) + 1;
        const uid = `spawn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        // Spawn enemies on the right side of the map (positive X), allies on left
        const existingEnemies = combatants.filter(c => c.side === 'Enemy').length;
        const spawnRow = existingEnemies % 4;
        const spawnCol = Math.floor(existingEnemies / 4);
        const spread = { x: 350 + spawnCol * 100 + (Math.random() * 40 - 20), y: (spawnRow - 1.5) * 150 + (Math.random() * 40 - 20) };
        const newCombatant: CombatantState = {
            id: uid,
            instanceId: uid,
            name,
            species: hbMonster?.type || preset?.species || 'Unknown',
            class: hbMonster?.type || preset?.class || 'Warrior',
            level: 1,
            abilityScores,
            baseAC: ac,
            maxHP: hp,
            currentHP: hp,
            tempHP: 0,
            speed,
            proficiencyBonus: 2,
            initiative: initRoll,
            isWildShaped: false,
            rollMode: 'Auto',
            ac,
            status: [],
            resources: {
                action: true, actionUsed: false, bonusAction: true, bonusActionUsed: false,
                reaction: true, reactionUsed: false,
                movementMax: speed, movementSpent: 0, movementRemaining: speed,
                wildShapeCharges: { current: 0, max: 0 }, spellSlots: {}
            },
            skillProficiencies: [],
            actions,
            conditions: [],
            concentration: null,
            deathSaves: { successes: 0, failures: 0 },
            inCombat: true,
            side: 'Enemy',
            portrait: preset?.portrait || null,
            position: spread,
        };
        setCombatants(prev => [...prev, newCombatant]);
        const tag = hbMonster ? '[HB] ' : '[DM] ';
        addLog(`${tag}Spawned ${name} (Init: ${initRoll}, HP: ${hp}, AC: ${ac}).`, 'system');
        setShowSpawnPanel(false);
        setCustomSpawnName(''); setCustomSpawnHp(''); setCustomSpawnAc(''); setSpawnSearch('');
    };

    // ── SPAWN FROM BESTIARY (NPCManager entries) ──────────────────────────────
    const spawnFromBestiary = (npc: any) => {
        const initRoll = Math.floor(Math.random() * 20) + 1;
        const uid = `bestiary-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const existingEnemies = combatants.filter(c => c.side === 'Enemy').length;
        const spawnRow = existingEnemies % 4;
        const spawnCol = Math.floor(existingEnemies / 4);
        const spread = { x: 350 + spawnCol * 100 + (Math.random() * 40 - 20), y: (spawnRow - 1.5) * 150 + (Math.random() * 40 - 20) };
        // Map NPC stats dict → abilityScores
        const raw = npc.stats || {};
        const abilityScores = {
            STR: raw.STR ?? raw.str ?? raw.Strength ?? 10,
            DEX: raw.DEX ?? raw.dex ?? raw.Dexterity ?? 10,
            CON: raw.CON ?? raw.con ?? raw.Constitution ?? 10,
            INT: raw.INT ?? raw.int ?? raw.Intelligence ?? 10,
            WIS: raw.WIS ?? raw.wis ?? raw.Wisdom ?? 10,
            CHA: raw.CHA ?? raw.cha ?? raw.Charisma ?? 10,
        };
        // Parse actions: string[] → Action[]
        const actions: Action[] = (npc.actions || []).map((a: any, i: number): Action => {
            if (typeof a === 'object' && a.id) return a as Action;
            const str = String(a);
            const actionName = str.split(':')[0]?.trim() || `Attack ${i+1}`;
            // Detect "Multiattack" — treat as a Passive description, not an Attack
            if (actionName.toLowerCase() === 'multiattack' || str.toLowerCase().startsWith('multiattack')) {
                return {
                    id: `bst-${i}-multiattack`,
                    name: 'Multiattack',
                    description: str.includes(':') ? str.split(':').slice(1).join(':').trim() : str,
                    type: 'Passive',
                    actionType: 'Ability',
                    source: 'Item',
                } as Action;
            }
            // Try to extract attack bonus: "Melee +5" or "+5 to hit"
            const bonusMatch = str.match(/\+(\d+)/);
            const attackBonus = bonusMatch ? parseInt(bonusMatch[1]) : 3;
            // Try to extract damage dice: "1d6+2" or "2d8+3"
            const diceMatch = str.match(/(\d+d\d+)/);
            const damageDice = diceMatch ? diceMatch[1] : '1d6';
            const damageMatch = str.match(/\d+d\d+\+(\d+)/);
            const damageModifier = damageMatch ? parseInt(damageMatch[1]) : 0;
            const damageTypes = ['slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning', 'necrotic', 'radiant', 'poison', 'psychic', 'acid', 'thunder', 'force'];
            const damageType = damageTypes.find(dt => str.toLowerCase().includes(dt)) || 'slashing';
            const isRanged = str.toLowerCase().includes('ranged') || str.toLowerCase().includes('range');
            return {
                id: `bst-${i}`,
                name: actionName,
                description: str,
                type: 'Action',
                actionType: 'Attack',
                attackType: isRanged ? 'Ranged' : 'Melee',
                attackBonus,
                damageDice,
                damageModifier,
                damageType,
                range: isRanged ? '60ft' : '5ft',
                source: 'Item',
            } as Action;
        });
        // CR → proficiency bonus approximation
        const crNum = parseFloat(String(npc.cr)) || 0;
        const prof = crNum >= 17 ? 6 : crNum >= 13 ? 5 : crNum >= 9 ? 4 : crNum >= 5 ? 3 : 2;
        const speed = npc.speed || 30;
        const newCombatant: CombatantState = {
            id: uid, instanceId: uid,
            name: npc.name, species: npc.type || 'Unknown', class: npc.type || 'Monster', level: Math.max(1, Math.round(crNum)),
            abilityScores, baseAC: npc.ac, maxHP: npc.hp, currentHP: npc.hp, tempHP: 0,
            speed, proficiencyBonus: prof, initiative: initRoll, isWildShaped: false, rollMode: 'Auto', ac: npc.ac,
            status: [], resources: {
                action: true, actionUsed: false, bonusAction: true, bonusActionUsed: false,
                reaction: true, reactionUsed: false, movementMax: speed, movementSpent: 0, movementRemaining: speed,
                wildShapeCharges: { current: 0, max: 0 }, spellSlots: {}
            },
            skillProficiencies: [], actions, conditions: [], concentration: null,
            deathSaves: { successes: 0, failures: 0 }, inCombat: true, side: 'Enemy',
            portrait: npc.visualUrl || null, position: spread,
        };
        setCombatants(prev => [...prev, newCombatant]);
        addLog(`[Bestiary] Spawned ${npc.name} CR${npc.cr} (Init: ${initRoll}, HP: ${npc.hp}, AC: ${npc.ac}, ${actions.length} action(s)).`, 'system');
        setSpawnSearch('');
    };

    // ── BATTLE STATE: LOAD SNAPSHOT ───────────────────────────────────────────
    const handleLoadSnapshot = (snapshot: BattleSnapshot) => {
        setCombatants(snapshot.combatants);
        setRound(snapshot.round);
        setLog(snapshot.log);
        setActiveId(snapshot.activeCombatantId ?? null);
        addLog(`[System] Loaded battle state: "${snapshot.name}".`, 'system');
    };

    // ── LIBRARY: SPAWN MONSTER ────────────────────────────────────────────────
    const handleSpawnFromLibrary = (data: {
        name: string; hp: number; ac: number; speed: number;
        species: string; actions: Action[];
        abilityScores: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number };
    }) => {
        const initRoll = Math.floor(Math.random() * 20) + 1;
        const uid = `spawn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const newCombatant: CombatantState = {
            id: uid, instanceId: uid,
            name: data.name, species: data.species, class: data.species, level: 1,
            abilityScores: data.abilityScores, baseAC: data.ac, maxHP: data.hp,
            currentHP: data.hp, tempHP: 0, speed: data.speed, proficiencyBonus: 2,
            initiative: initRoll, isWildShaped: false, rollMode: 'Auto', ac: data.ac,
            status: [], resources: {
                action: true, actionUsed: false, bonusAction: true, bonusActionUsed: false,
                reaction: true, reactionUsed: false, movementMax: data.speed,
                movementSpent: 0, movementRemaining: data.speed,
                wildShapeCharges: { current: 0, max: 0 }, spellSlots: {}
            },
            skillProficiencies: [], actions: data.actions, conditions: [],
            concentration: null, deathSaves: { successes: 0, failures: 0 },
            inCombat: true, side: 'Enemy', portrait: null,
            position: { x: 180 + (Math.random() * 120 - 60), y: Math.random() * 200 - 100 },
        };
        setCombatants(prev => [...prev, newCombatant]);
        addLog(`[Library] Spawned ${data.name} (Init: ${initRoll}, HP: ${data.hp}, AC: ${data.ac}).`, 'system');
    };

    // ── LIBRARY: ASSIGN SPELL ─────────────────────────────────────────────────
    const handleAssignSpellFromLibrary = (combatantId: string, action: Action) => {
        updateCombatant(combatantId, {
            tempActions: [...(combatants.find(c => c.instanceId === combatantId)?.tempActions ?? []), action],
        });
        addLog(`[Library] Assigned spell "${action.name}" to ${combatants.find(c => c.instanceId === combatantId)?.name ?? 'combatant'}.`, 'system');
    };

    // ── AOE CONFIRM ───────────────────────────────────────────────────────────
    const handleAoEConfirm = (center: { x: number; y: number }) => {
        if (!aoePreview) return;
        const { attacker, action } = aoePreview;

        // Range validation: straight-line from caster to placement point
        const rangeFt = parseRangeFt(action.range);
        if (attacker.position && rangeFt !== Infinity) {
            const ddx = center.x - attacker.position.x;
            const ddy = center.y - attacker.position.y;
            const dFt = Math.sqrt(ddx*ddx + ddy*ddy) / PX_PER_FT;
            if (dFt > rangeFt) {
                addLog(`[Range] ${action.name} is out of range (${Math.round(dFt)}ft > ${rangeFt}ft).`, 'system');
                return; // Don't close preview so DM can reposition
            }
        }

        setAoePreview(null);
        const aoeSize = action.aoeSize || 20;
        const sizePx = aoeSize * PX_PER_FT;
        const shape = action.aoeShape;
        const attackerPos = attacker.position;

        // Determine which combatants are caught in the AoE using the shared formula
        const inArea = sortedCombatants.filter(c => {
            if (!c.position || c.instanceId === attacker.instanceId) return false;
            const px = c.position.x; const py = c.position.y;
            if (shape === 'sphere' || shape === 'cylinder') {
                return Math.sqrt((px-center.x)**2 + (py-center.y)**2) <= sizePx;
            }
            if (shape === 'cube') {
                const half = sizePx / 2;
                return px >= center.x-half && px <= center.x+half && py >= center.y-half && py <= center.y+half;
            }
            if ((shape === 'cone' || shape === 'line') && attackerPos) {
                const ax = attackerPos.x; const ay = attackerPos.y;
                if (shape === 'cone') {
                    const angle = Math.atan2(center.y - ay, center.x - ax);
                    const toTarget = Math.atan2(py - ay, px - ax);
                    const dist = Math.sqrt((px-ax)**2 + (py-ay)**2);
                    const angleDiff = Math.abs(((toTarget - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
                    return dist <= sizePx && angleDiff <= Math.PI / 6;
                } else {
                    const ddx = center.x - ax; const ddy = center.y - ay;
                    const lineLen = Math.sqrt(ddx*ddx + ddy*ddy) || 1;
                    const nx = ddx/lineLen; const ny = ddy/lineLen;
                    const t = (px-ax)*nx + (py-ay)*ny;
                    const halfW = 2.5 * PX_PER_FT;
                    if (t >= 0 && t <= sizePx) {
                        const perpDist = Math.abs((px-ax)*ny - (py-ay)*nx);
                        return perpDist <= halfW;
                    }
                    return false;
                }
            }
            return false;
        });

        const firstTarget = inArea.find(c => c.side !== attacker.side) || null;
        addLog(`${attacker.name}'s ${action.name} — ${inArea.length} target(s) in ${shape} area (${aoeSize}ft).`, 'combat');
        setCombatActionModal({ isOpen: true, attacker, action, initialTarget: firstTarget });
    };

    const [viewMode, setViewMode] = useState<'character' | 'battlemap'>('character');
    const [actionTab, setActionTab] = useState<'standard' | 'class' | 'spells'>('standard');

    // Standard D&D 2024 generic actions


    const handleStdAction = (stdAction: typeof STD_ACTIONS[0]) => {
        if (!activeCombatant) return;
        if (stdAction.id === 'std-attack') {
            // Use first weapon action, or fall back to unarmed
            const weaponAction = activeCombatant.actions.find(a => a.actionType === 'Attack');
            if (weaponAction) {
                handleAction(activeCombatant, weaponAction);
            } else {
                const unarmed = { id: 'unarmed', name: 'Unarmed Strike', type: 'Action' as const, actionType: 'Attack' as const, attackBonus: RulesEngine.calculateModifier(activeCombatant.abilityScores.STR) + activeCombatant.proficiencyBonus, damageDice: '1', damageModifier: RulesEngine.calculateModifier(activeCombatant.abilityScores.STR), damageType: 'bludgeoning', description: 'An unarmed strike (1 + STR mod bludgeoning).', source: 'Item' as const };
                handleAction(activeCombatant, unarmed);
            }
            return;
        }
        if (stdAction.id === 'std-dodge') {
            updateCombatant(activeCombatant.instanceId, { conditions: [...activeCombatant.conditions.filter(c => c !== 'Dodge'), 'Dodge'] });
        }
        consumeResources(activeCombatant, { ...stdAction, id: stdAction.id, actionType: 'Other', description: stdAction.description, source: 'Class' } as any);
        addLog(`${activeCombatant.name} uses ${stdAction.name}.`, 'combat');
    };

    const focus = activeCombatant; // the combatant whose sheet is shown in center

    return (
        <div className="flex flex-col h-screen bg-[#0D0D0F] text-slate-100 overflow-hidden" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>

            {/* ═══ HEADER ═══ */}
            <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-white/5 bg-black/60 backdrop-blur-xl z-50 gap-3">
                {/* LEFT: Round + Mode + Dice */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Round badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8">
                        <RotateCcw className="w-3 h-3 text-amber-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Rnd <span className="text-amber-400">{round}</span></span>
                        {activeId && <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />}
                    </div>
                    {/* Combat Mode Badge */}
                    <button onClick={() => setShowModePanel(v => !v)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all ${showModePanel ? 'border-white/20 bg-white/10' : 'border-white/5 bg-white/[0.02] hover:border-white/10'} ${
                        combatMode === 'DM_TABLE' ? 'text-blue-400' :
                        combatMode === 'ASSISTED' ? 'text-amber-400' :
                        combatMode === 'AUTO_RESOLUTION' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                        {combatMode === 'DM_TABLE' ? <Shield className="w-3 h-3" /> : combatMode === 'FULL_GAME' ? <Swords className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        <span className="hidden sm:inline">{combatMode.replace(/_/g, ' ')}</span>
                    </button>
                    {/* Dice Tray Toggle */}
                    <button
                        onClick={() => setIsDiceOpen(!isDiceOpen)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all ${
                            isDiceOpen
                                ? 'border-amber-500/50 bg-amber-500/20 text-amber-400'
                                : diceContextLabel
                                    ? 'border-amber-500/50 bg-amber-500/20 text-amber-400 animate-pulse'
                                    : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-slate-200'
                        }`}
                        title={diceContextLabel ? `Roll Required: ${diceContextLabel}` : 'Toggle Dice Tray'}
                    >
                        <Dices className="w-3 h-3" />
                        <span className="hidden sm:inline">{diceContextLabel && !isDiceOpen ? 'Roll!' : 'Dice'}</span>
                    </button>
                </div>

                {/* CENTER: View toggle */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mx-auto">
                    <button onClick={() => setViewMode('character')} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewMode === 'character' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}>
                        <span className="flex items-center gap-1"><Heart className="w-2.5 h-2.5" />Character</span>
                    </button>
                    <button onClick={() => setViewMode('battlemap')} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewMode === 'battlemap' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}>
                        <span className="flex items-center gap-1"><Target className="w-2.5 h-2.5" />Battlemap</span>
                    </button>
                    {viewMode === 'battlemap' && (
                        <button
                            onClick={() => setShowTacticalView(v => !v)}
                            className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${showTacticalView ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}
                            title={showTacticalView ? "Hide Player Card" : "Show Player Card"}
                        >
                            <Layout className="w-2.5 h-2.5" />
                        </button>
                    )}
                </div>

                {/* RIGHT: Library, Saves, DM, End Combat, +Encounter */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setShowLibrary(v => !v)} className={`px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${showLibrary ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-white/5 border-white/8 text-slate-400 hover:border-blue-500/30 hover:text-blue-400'}`}>
                        <span className="flex items-center gap-1"><BookOpen className="w-2.5 h-2.5" /><span className="hidden md:inline">Library</span></span>
                    </button>
                    <button onClick={() => setShowBattleState(v => !v)} className={`px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${showBattleState ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-white/5 border-white/8 text-slate-400 hover:border-green-500/30 hover:text-green-400'}`}>
                        <span className="flex items-center gap-1"><RotateCcw className="w-2.5 h-2.5" /><span className="hidden md:inline">Saves</span></span>
                    </button>
                    {/* DM God Mode Toggle */}
                    <button
                        onClick={() => setIsDMMode(!isDMMode)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${isDMMode ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.35)]' : 'bg-white/5 border-white/8 text-slate-400 hover:border-purple-500/30 hover:text-purple-400'}`}
                        title={isDMMode ? 'God Mode Active — Click to Deactivate' : 'Activate God Mode'}
                    >
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>DM</span>
                        {isDMMode && <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />}
                    </button>
                    {combatants.length > 0 && activeId && (
                        <button onClick={() => setVictoryPending(true)} className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/8 text-slate-400 text-[8px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">
                            <span className="flex items-center gap-1"><Swords className="w-2.5 h-2.5" /><span className="hidden md:inline">End Combat</span></span>
                        </button>
                    )}
                    <button onClick={() => setIsBuilding(true)} className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-black text-[8px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                        <span className="flex items-center gap-1"><Plus className="w-2.5 h-2.5" />Encounter</span>
                    </button>
                </div>
            </header>

            {/* ── COMBAT MODE SELECTOR DROPDOWN ─────────────────────────────── */}
            <AnimatePresence>
                {showModePanel && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="absolute top-14 left-0 right-0 z-50 px-6 pt-2 pb-4 bg-black/90 backdrop-blur-xl border-b border-white/5 flex gap-3">
                        {([
                            { id: 'DM_TABLE', label: 'DM Table', color: 'blue', desc: 'Manual control. Enemies never act automatically.' },
                            { id: 'ASSISTED', label: 'Assisted', color: 'amber', desc: 'Prompted rolls. Enemies wait for DM commands.' },
                            { id: 'AUTO_RESOLUTION', label: 'Auto Resolution', color: 'emerald', desc: 'Auto-rolls on trigger. Enemies wait for DM.' },
                            { id: 'FULL_GAME', label: 'Full Game', color: 'red', desc: 'Full AI enemy turns. Maximum automation.' },
                        ] as const).map(m => (
                            <button key={m.id} onClick={() => { setCombatMode(m.id as CombatMode); setShowModePanel(false); }}
                                className={`flex-1 p-3 rounded-xl border text-left transition-all ${combatMode === m.id ? `bg-${m.color}-500/15 border-${m.color}-500/40` : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'}`}>
                                <p className={`text-[10px] font-black uppercase ${combatMode === m.id ? `text-${m.color}-300` : 'text-slate-400'}`}>{m.label}</p>
                                <p className="text-[8px] text-slate-600 mt-0.5">{m.desc}</p>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MAIN LAYOUT ═══ */}
            {combatants.length > 0 ? (
                <div className={`flex flex-1 overflow-hidden transition-all duration-700 ${isDMMode ? 'border-[6px] border-purple-500/60 m-0 rounded-none shadow-[inset_0_0_100px_rgba(168,85,247,0.2)] ring-4 ring-purple-500/30 ring-inset z-10' : 'border-0 p-0'}`}>

                    {/* ── LEFT: INITIATIVE ── (Persistent in 3-column layout) */}
                    <div className="w-60 shrink-0 border-r border-white/5 bg-black/40 flex flex-col z-20">
                        <InitiativePanel
                            sortedCombatants={sortedCombatants}
                            activeId={activeId}
                            selectedId={selectedId}
                            targetId={targetId}
                            isDMMode={isDMMode}
                            activeMobileTab={activeMobileTab}
                            viewMode={viewMode}
                            sidebarsVisible={true}
                            onSelect={(id) => { setSelectedId(id); }}
                            onAction={handleAction}
                            onHpChange={(id, amount) => {
                                const target = combatants.find(cb => cb.instanceId === id);
                                if (target) {
                                    updateCombatant(id, { currentHP: Math.max(0, Math.min(target.maxHP, target.currentHP + amount)) });
                                }
                            }}
                            onConditionToggle={(id, condition: ConditionType) => {
                                const target = combatants.find(cb => cb.instanceId === id);
                                if (target) {
                                    const newConditions = target.conditions.includes(condition)
                                        ? target.conditions.filter(con => con !== condition)
                                        : [...target.conditions, condition];
                                    updateCombatant(id, { conditions: newConditions });
                                }
                            }}
                            onSetTarget={setTargetId}
                            onEditInitiative={handleInitiativeEdit}
                            onEndTurn={endTurn}
                            onResetCombat={resetCombat}
                            onLongRest={longRest}
                        />
                    </div>

                    {/* ── CENTER VIEW ── */}
                    <main className="flex-1 flex min-h-0 relative">
                        

                        {/* ── Sidebar: Character Details (Tactical Split View) ── */}
                        <AnimatePresence mode="popLayout">
                            {viewMode === 'battlemap' && showTacticalView && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 300, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="hidden lg:flex flex-col border-r border-white/5 bg-[#020617] relative z-40 overflow-hidden shrink-0 shadow-2xl"
                                    style={{ maxWidth: '25vw' }}
                                >
                                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                                        <CharacterDetailView
                                            isSidebar={true}
                                            focus={selectedCombatant || activeCombatant || focus}
                                            activeCombatant={activeCombatant}
                                            activeId={isSetupPhase ? null : activeId}
                                            selectedCombatant={selectedCombatant || null}
                                            selectedId={selectedId}
                                            targetId={targetId}
                                            combatants={combatants}
                                            actionTab={actionTab}
                                            setActionTab={setActionTab}
                                            setTargetId={setTargetId}
                                            setSelectedId={setSelectedId}
                                            handleAction={handleAction}

                                            handleStdAction={handleStdAction}
                                            updateCombatant={updateCombatant}
                                            consumeResources={consumeResources}

                                            addLog={addLog}
                                            updatePortrait={updatePortrait}
                                            isDMMode={isDMMode}
                                            dmChangeLevel={dmChangeLevel}
                                        />
                                    </div>
                                    <div className="absolute top-4 right-0 translate-x-1/2 z-50">
                                        <div className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[7px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg">
                                            Tactical View
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Main Panel Content ── */}
                        <div className="flex-1 flex flex-col overflow-hidden relative">
                            {viewMode === 'character' ? (
                                <CharacterDetailView
                                    focus={focus}
                                    activeCombatant={activeCombatant}
                                    activeId={activeId}
                                    selectedCombatant={selectedCombatant || null}
                                    selectedId={selectedId}
                                    targetId={targetId}
                                    combatants={combatants}
                                    actionTab={actionTab}
                                    setActionTab={setActionTab}
                                    setTargetId={setTargetId}
                                    setSelectedId={setSelectedId}
                                    handleAction={handleAction}

                                    handleStdAction={handleStdAction}
                                    updateCombatant={updateCombatant}
                                    consumeResources={consumeResources}

                                    addLog={addLog}
                                    updatePortrait={updatePortrait}
                                    isDMMode={isDMMode}
                                    dmChangeLevel={dmChangeLevel}
                                />
                            ) : (
                            <div className={`flex-1 flex flex-col bg-[#020617] relative overflow-hidden transition-transform duration-75 ${isShaking ? 'translate-x-[2px]' : ''}`} onClick={() => setSelectedId(null)}>

                                {/* ── COMPACT CHARACTER BAR — overlays top of map ── */}
                                {(() => {
                                    const bar = activeCombatant || selectedCombatant;
                                    if (!bar) return null;
                                    const hpPct = Math.max(0, (bar.currentHP / bar.maxHP) * 100);
                                    const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444';
                                    const mvRemain = bar.resources.movementRemaining ?? (bar.resources.movementMax - bar.resources.movementSpent);
                                    const actionUsed = bar.resources.actionUsed;
                                    const bonusUsed = bar.resources.bonusActionUsed;
                                    const reactUsed = bar.resources.reactionUsed;
                                    return (
                                        <div className="absolute top-0 left-0 right-0 z-[130] flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0f]/95 border-b border-white/8 pointer-events-none">
                                            {/* Portrait */}
                                            <div className="size-6 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                                {bar.portrait
                                                    ? <img src={bar.portrait} className="size-full object-cover" />
                                                    : <div className="size-full flex items-center justify-center text-[8px] font-black text-white" style={{ background: bar.side === 'Ally' ? '#92400e' : '#7f1d1d' }}>{bar.name[0]}</div>
                                                }
                                            </div>
                                            {/* Name + class */}
                                            <div className="shrink-0">
                                                <p className="text-[8px] font-black text-white uppercase leading-none">{bar.name}</p>
                                                {(bar.class || bar.type) && <p className="text-[6px] text-slate-500 uppercase leading-none mt-0.5">{bar.class || bar.type}{bar.level ? ` · Lv${bar.level}` : ''}</p>}
                                            </div>
                                            {/* Divider */}
                                            <div className="h-4 w-px bg-white/10 shrink-0" />
                                            {/* HP bar */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Heart className="w-2.5 h-2.5 shrink-0" style={{ color: hpColor }} />
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[8px] font-black leading-none" style={{ color: hpColor }}>{bar.currentHP}<span className="text-slate-600">/{bar.maxHP}</span></span>
                                                    <div className="w-14 h-1 rounded-full bg-white/10 overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${hpPct}%`, background: hpColor }} />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* AC */}
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <Shield className="w-2.5 h-2.5 text-blue-400" />
                                                <span className="text-[8px] font-black text-blue-300">{bar.ac}</span>
                                            </div>
                                            {/* Movement */}
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <Footprints className="w-2.5 h-2.5 text-amber-400" />
                                                <span className="text-[8px] font-black text-amber-300">{mvRemain}ft</span>
                                            </div>
                                            <div className="h-4 w-px bg-white/10 shrink-0" />
                                            {/* Action economy chips */}
                                            <div className="flex gap-1 shrink-0">
                                                <span className={`px-1.5 py-0.5 rounded text-[6px] font-black uppercase border ${!actionUsed ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'bg-white/5 border-white/5 text-slate-700 line-through'}`}>Act</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[6px] font-black uppercase border ${!bonusUsed ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-white/5 border-white/5 text-slate-700 line-through'}`}>Bon</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[6px] font-black uppercase border ${!reactUsed ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/5 text-slate-700 line-through'}`}>Rct</span>
                                            </div>
                                            {/* Active conditions */}
                                            {bar.conditions.length > 0 && (
                                                <>
                                                    <div className="h-4 w-px bg-white/10 shrink-0" />
                                                    <div className="flex gap-1 overflow-hidden">
                                                        {bar.conditions.slice(0, 4).map(c => (
                                                            <span key={c} className="px-1.5 py-0.5 rounded text-[6px] font-black uppercase bg-orange-500/20 border border-orange-500/30 text-orange-300 shrink-0">{c}</span>
                                                        ))}
                                                        {bar.conditions.length > 4 && <span className="text-[6px] text-slate-600">+{bar.conditions.length - 4}</span>}
                                                    </div>
                                                </>
                                            )}
                                            {/* Switch to character view hint */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setViewMode('character'); }}
                                                className="ml-auto pointer-events-auto px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-600 hover:text-slate-300 text-[6px] font-black uppercase tracking-widest transition-all shrink-0"
                                            >
                                                Full Stats →
                                            </button>
                                        </div>
                                    );
                                })()}

                                {/* DM Mode Purple Frame Indicator — only during setup phase */}
                                {isDMMode && isSetupPhase && (
                                    <div className="absolute inset-0 pointer-events-none z-[200] rounded-none"
                                        style={{ boxShadow: 'inset 0 0 0 3px rgba(168,85,247,0.55), inset 0 0 40px rgba(139,92,246,0.08)' }}
                                    />
                                )}
                                {/* Turn Flash Overlay */}
                                <AnimatePresence>
                                    {turnFlash && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 0.4, 0] }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.6 }}
                                            className="absolute inset-0 bg-amber-500/10 pointer-events-none z-[100] border-[2px] border-amber-500/20"
                                        />
                                    )}
                                </AnimatePresence>
                                {/* ── GRID OVERLAY — square, always rendered when visible ── */}
                                {gridVisible && (() => {
                                    const GRID_PX = 50; // 50px = 1 square (5 ft default)
                                    const colorMap = { light: '#ffffff', dark: '#000000', accent: '#f59e0b' };
                                    const lineColor = colorMap[gridColor];
                                    return (
                                        <div
                                            className="absolute inset-0 pointer-events-none z-10"
                                            style={{
                                                backgroundImage: `linear-gradient(to right, ${lineColor}${Math.round(gridOpacity * 255).toString(16).padStart(2,'0')} ${gridThickness}px, transparent ${gridThickness}px), linear-gradient(to bottom, ${lineColor}${Math.round(gridOpacity * 255).toString(16).padStart(2,'0')} ${gridThickness}px, transparent ${gridThickness}px)`,
                                                backgroundSize: `${GRID_PX}px ${GRID_PX}px`,
                                            }}
                                        />
                                    );
                                })()}

                                {/* ── DM MODE INDICATOR + TOGGLE ── */}
                                <div className="absolute top-[34px] right-3 z-[150] pointer-events-auto flex items-center gap-1.5">
                                    {isDMMode && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-900/80 border border-purple-500/40 rounded-full">
                                            <div className="size-1.5 rounded-full bg-purple-400 animate-pulse" />
                                            <span className="text-[7px] font-black uppercase tracking-widest text-purple-300">DM Mode</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsDMMode(v => !v); }}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border transition-all ${isDMMode ? 'bg-purple-500/30 border-purple-500/50 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'bg-white/5 border-white/10 text-slate-500 hover:border-purple-500/30 hover:text-purple-400'}`}
                                        title={isDMMode ? 'Switch to Full Game mode (AI controls enemies)' : 'Switch to DM Mode (free token movement)'}
                                    >
                                        <User className="w-3 h-3" />
                                        {isDMMode ? 'DM' : 'Full Game'}
                                    </button>

                                    {/* DM TOOLKIT TRIGGER */}
                                    {isDMMode && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsDMAddModalOpen(true); }}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-[7px] font-black uppercase tracking-widest border border-purple-400/50 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                            title="Open DM Toolkit"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Toolkit
                                        </button>
                                    )}
                                </div>

                                {/* ── MAP CONTROLS TOOLBAR ── */}
                                <FloatingToolbar
                                    battlemapBg={battlemapBg} setBattlemapBg={setBattlemapBg}
                                    bgOpacity={bgOpacity} setBgOpacity={setBgOpacity}
                                    gridVisible={gridVisible} setGridVisible={setGridVisible}
                                    gridOpacity={gridOpacity} setGridOpacity={setGridOpacity}
                                    gridThickness={gridThickness} setGridThickness={setGridThickness}
                                    gridColor={gridColor} setGridColor={setGridColor}
                                    gridScale={gridScale} setGridScale={setGridScale}
                                    snapToGrid={snapToGrid} setSnapToGrid={setSnapToGrid}
                                    sidebarsVisible={sidebarsVisible} setSidebarsVisible={setSidebarsVisible}
                                    onEndTurn={endTurn}
                                    showJournal={showJournalLog} setShowJournal={setShowJournalLog}
                                />

                                {/* ── MAP ACTIONS BAR ── */}
                                <AnimatePresence>
                                    {activeCombatant && viewMode === 'battlemap' && (
                                        <CombatActions
                                            activeCombatant={activeCombatant}
                                            onAction={handleAction}
                                            onDash={handleDash}
                                            onMove={enterMovePreview}
                                            combatPhase={combatPhase}
                                            disabled={isBuilding}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* ── RANGE ERROR TOAST ── */}
                                <AnimatePresence>
                                    {rangeError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="absolute top-16 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-950/95 border border-red-500/40 shadow-2xl backdrop-blur-xl pointer-events-none"
                                        >
                                            <Ban className="w-5 h-5 text-red-400" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-0.5">Out of Range</p>
                                                <p className="text-xs text-red-200">{rangeError}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* ── RESET TOAST ── */}
                                <AnimatePresence>
                                    {resetToast && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="absolute top-16 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl pointer-events-none"
                                        >
                                            <RotateCcw className="w-5 h-5 text-amber-400" />
                                            <p className="text-[11px] font-black uppercase tracking-widest text-amber-300">Combat Reset</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Battlemat
                                    key="mythic-battlemat"
                                    floatingTexts={floatingTexts}
                                    combatants={sortedCombatants}
                                    activeId={activeId}
                                    addLog={addLog}
                                    selectedId={selectedId}
                                    hoveredId={hoveredId}
                                    targetId={targetId}
                                    onSelect={setSelectedId}
                                    onHover={setHoveredId}
                                    onSetTarget={setTargetId}
                                    onAction={handleAction}
                                    onPositionUpdate={updatePosition}
                                    bg={battlemapBg}
                                    bgOpacity={bgOpacity}
                                    isDMMode={isDMMode}
                                    snapToGrid={snapToGrid}
                                    gridScale={gridScale}
                                    aoePreview={aoePreview ? { action: aoePreview.action, attackerPos: aoePreview.attacker.position } : null}
                                    onAoEConfirm={handleAoEConfirm}
                                    onAoECancel={() => { setAoePreview(null); addLog('AoE placement cancelled.', 'system'); }}
                                    combatPhase={combatPhase}
                                    movePreviewDest={movePreviewDest}
                                    onMovePreviewUpdate={setMovePreviewDest}
                                    onMoveConfirm={confirmMove}
                                    onMoveCancel={cancelMovePreview}
                                    obstacles={new Set(obstacles)}
                                    difficultTerrain={new Set(difficultTerrain)}
                                />

                                {/* ── FLOATING JOURNAL ── */}
                                {!isSetupPhase && (
                                    <FloatingJournal
                                        log={log}
                                        onAddNote={(text) => addLog(text, 'notes')}
                                        onClearLog={() => setLog([])}
                                    />
                                )}

                                {/* ── SETUP PHASE OVERLAY ─── Shown after initiative but before turns begin ── */}
                                <AnimatePresence>
                                {isSetupPhase && (
                                    <motion.div
                                        key="setup-overlay"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 pointer-events-none z-[125]"
                                    >
                                        {/* Top banner */}
                                        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 bg-black/90 backdrop-blur-xl rounded-2xl border border-violet-500/40 shadow-[0_0_40px_rgba(139,92,246,0.25)] pointer-events-auto">
                                            <div className="size-2.5 rounded-full bg-violet-400 animate-pulse flex-shrink-0" />
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-violet-300">Setup Phase — DM Mode Active</span>
                                                <span className="text-[8px] text-slate-500 uppercase tracking-widest">
                                                    Drag tokens · Edit levels in DM panel · Then start combat
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => { setIsSetupPhase(false); setIsBuilding(true); }}
                                                className="size-7 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all"
                                                title="Back to encounter builder"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* START COMBAT button — bottom center */}
                                        <button
                                            onClick={beginTurns}
                                            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-8 py-4 bg-violet-600 hover:bg-violet-500 active:scale-95 rounded-2xl border border-violet-400/50 shadow-[0_0_50px_rgba(139,92,246,0.5)] text-white font-black text-[13px] uppercase tracking-widest transition-all pointer-events-auto"
                                        >
                                            <Swords className="w-5 h-5" />
                                            Start Combat
                                        </button>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </div>
                        )}
                        </div>{/* /flex-1 flex-col center content */}
                    </main>

                    {/* ── RIGHT COL: COMMANDER DESK (Journal & DM Panel) ── */}
                    {/* Collapse toggle tab */}
                    <div className="relative shrink-0 flex items-center z-30">
                        <button
                            onClick={() => setRightPanelOpen(!rightPanelOpen)}
                            className="absolute left-0 -translate-x-full top-3 size-5 rounded-l-lg bg-[#0d0d14] border border-r-0 border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-lg"
                            title={rightPanelOpen ? 'Hide panel' : 'Show panel'}
                        >
                            {rightPanelOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                        </button>
                    </div>
                    <aside className={`shrink-0 border-l border-white/5 bg-black/60 flex flex-col z-20 overflow-hidden transition-all duration-300 ${rightPanelOpen ? 'w-80' : 'w-0'}`}>

                        {/* CONTENT AREA — DM Console only */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                            {/* DM console inner */}
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                        {/* Panel Header: DM Control label */}
                        <div className={`px-4 py-2.5 border-b shrink-0 flex items-center justify-between transition-colors duration-300 ${isDMMode ? 'border-purple-500/30 bg-purple-500/[0.06]' : 'border-white/5 bg-black/20'}`}>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className={`w-3 h-3 transition-colors ${isDMMode ? 'text-purple-400' : 'text-slate-600'}`} />
                                <span className={`text-[8px] font-black uppercase tracking-[0.25em] transition-colors ${isDMMode ? 'text-purple-300' : 'text-slate-600'}`}>DM Control</span>
                                {isDMMode && <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />}
                            </div>
                            <button
                                onClick={() => setIsDMMode(!isDMMode)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[7px] font-black uppercase tracking-widest transition-all ${isDMMode ? 'bg-purple-500/30 border-purple-500/50 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-white/5 border-white/10 text-slate-500 hover:border-purple-500/30 hover:text-purple-400'}`}
                            >
                                {isDMMode ? '● God Mode' : 'God Mode'}
                            </button>
                        </div>

                        {/* Quick-Spawn Bestiary search */}
                        <div className="px-3 pt-3 pb-2.5 border-b border-white/5 shrink-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Skull className="w-3 h-3 text-slate-600" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-600">Quick Spawn</span>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                                <input
                                    value={spawnSearch}
                                    onChange={e => setSpawnSearch(e.target.value)}
                                    placeholder="Search & click to spawn…"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-[10px] text-slate-300 placeholder:text-slate-700 focus:border-purple-500/40 focus:bg-white/[0.05] outline-none transition-all"
                                />
                            </div>
                            {/* Filtered monster chips */}
                            {spawnSearch && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {QUICKSPAWN_MONSTERS
                                        .filter(m => m.name.toLowerCase().includes(spawnSearch.toLowerCase()))
                                        .slice(0, 6)
                                        .map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => spawnMonster(m)}
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all group"
                                            >
                                                <span className="text-[8px] font-black text-slate-300 group-hover:text-white">{m.name}</span>
                                                <span className="text-[7px] text-red-500/60 font-bold">{m.hp}HP</span>
                                            </button>
                                        ))}
                                    {/* Homebrew monsters */}
                                    {homebrewMonsters
                                        .filter(m => m.name.toLowerCase().includes(spawnSearch.toLowerCase()))
                                        .slice(0, 4)
                                        .map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => spawnMonster(null, undefined, undefined, undefined, m)}
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all group"
                                            >
                                                <FlaskConical size={8} className="text-amber-400" />
                                                <span className="text-[8px] font-black text-amber-200 group-hover:text-white">{m.name}</span>
                                                <span className="text-[7px] text-amber-500/60 font-bold">{m.hp}HP</span>
                                            </button>
                                        ))}
                                    {/* Bestiary chips */}
                                    {bestiaryNpcs
                                        .filter(m => m.name.toLowerCase().includes(spawnSearch.toLowerCase()))
                                        .slice(0, 4)
                                        .map(m => (
                                            <button
                                                key={m.id || m.name}
                                                onClick={() => spawnFromBestiary(m)}
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all group"
                                            >
                                                <Bug className="w-2.5 h-2.5 text-blue-400" />
                                                <span className="text-[8px] font-black text-blue-200 group-hover:text-white">{m.name}</span>
                                                <span className="text-[7px] text-blue-500/60 font-bold">CR{m.cr}</span>
                                            </button>
                                        ))}
                                    {QUICKSPAWN_MONSTERS.filter(m => m.name.toLowerCase().includes(spawnSearch.toLowerCase())).length === 0
                                     && homebrewMonsters.filter(m => m.name.toLowerCase().includes(spawnSearch.toLowerCase())).length === 0
                                     && bestiaryNpcs.filter(m => m.name.toLowerCase().includes(spawnSearch.toLowerCase())).length === 0 && (
                                        <span className="text-[8px] text-slate-700 font-bold italic">No monsters found — try the Library</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* DM Tools — always visible, scrollable */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide min-h-0">

                                {/* ── SPAWN MONSTER ── */}
                                <div className="space-y-2 pb-3 border-b border-white/5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-purple-400/60 flex items-center gap-1.5">
                                            <PlusCircle className="w-3.5 h-3.5" />
                                            Spawn Monster
                                        </p>
                                        <button
                                            onClick={() => setShowSpawnPanel(v => !v)}
                                            className={`text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${showSpawnPanel ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-white/5 border-white/10 text-slate-500 hover:text-purple-400 hover:border-purple-500/30'}`}
                                        >
                                            {showSpawnPanel ? '▲ Close' : '▼ Open'}
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                    {showSpawnPanel && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                                            {/* Search / filter */}
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                                                <input
                                                    value={spawnSearch}
                                                    onChange={e => setSpawnSearch(e.target.value)}
                                                    placeholder="Filter monsters…"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-[10px] text-slate-300 placeholder:text-slate-700 focus:border-purple-500/40 outline-none transition-all"
                                                />
                                            </div>
                                            {/* Preset grid */}
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {QUICKSPAWN_MONSTERS
                                                    .filter(m => !spawnSearch || m.name.toLowerCase().includes(spawnSearch.toLowerCase()))
                                                    .map(m => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => spawnMonster(m)}
                                                        className="flex flex-col items-start gap-0.5 p-2.5 rounded-xl bg-red-500/5 border border-red-500/15 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-left group"
                                                    >
                                                        <span className="text-[9px] font-black text-slate-300 group-hover:text-white uppercase tracking-wide">{m.name}</span>
                                                        <span className="text-[7px] text-slate-600 font-bold">HP {m.hp} · AC {m.ac}</span>
                                                    </button>
                                                ))}
                                                {/* Homebrew monsters */}
                                                {homebrewMonsters
                                                    .filter(m => !spawnSearch || m.name.toLowerCase().includes(spawnSearch.toLowerCase()))
                                                    .map(m => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => spawnMonster(null, undefined, undefined, undefined, m)}
                                                        className="flex flex-col items-start gap-0.5 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all text-left group"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <FlaskConical size={7} className="text-amber-400" />
                                                            <span className="text-[9px] font-black text-amber-200 group-hover:text-white uppercase tracking-wide">{m.name}</span>
                                                        </div>
                                                        <span className="text-[7px] text-amber-700/70 font-bold">HP {m.hp} · AC {m.ac} · CR {m.cr}</span>
                                                    </button>
                                                ))}
                                                {/* Bestiary (NPCManager) entries */}
                                                {bestiaryNpcs
                                                    .filter(m => !spawnSearch || m.name.toLowerCase().includes(spawnSearch.toLowerCase()))
                                                    .map(m => (
                                                    <button
                                                        key={m.id || m.name}
                                                        onClick={() => spawnFromBestiary(m)}
                                                        className="flex flex-col items-start gap-0.5 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all text-left group"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <Bug className="w-2 h-2 text-blue-400" />
                                                            <span className="text-[9px] font-black text-blue-200 group-hover:text-white uppercase tracking-wide truncate">{m.name}</span>
                                                        </div>
                                                        <span className="text-[7px] text-blue-700/70 font-bold">HP {m.hp} · AC {m.ac} · CR {m.cr}</span>
                                                    </button>
                                                ))}
                                                {homebrewMonsters.length === 0 && bestiaryNpcs.length === 0 && (
                                                    <a href="/homebrew" target="_blank" className="col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-xl border border-dashed border-amber-500/20 text-amber-500/50 hover:text-amber-400 hover:border-amber-500/40 text-[7px] font-bold uppercase tracking-widest transition-all">
                                                        <FlaskConical size={8} /> Add Homebrew Monsters →
                                                    </a>
                                                )}
                                            </div>
                                            {/* Custom spawn form */}
                                            <div className="pt-2 border-t border-white/5 space-y-1.5">
                                                <p className="text-[7px] font-black uppercase tracking-widest text-slate-600">Custom Monster</p>
                                                <input value={customSpawnName} onChange={e => setCustomSpawnName(e.target.value)} placeholder="Name…" className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder:text-slate-700 outline-none focus:border-purple-500/30" />
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    <input value={customSpawnHp} onChange={e => setCustomSpawnHp(e.target.value)} placeholder="HP" type="number" className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder:text-slate-700 outline-none focus:border-purple-500/30" />
                                                    <input value={customSpawnAc} onChange={e => setCustomSpawnAc(e.target.value)} placeholder="AC" type="number" className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder:text-slate-700 outline-none focus:border-purple-500/30" />
                                                </div>
                                                <button
                                                    disabled={!customSpawnName.trim()}
                                                    onClick={() => spawnMonster(null, customSpawnName, parseInt(customSpawnHp) || 10, parseInt(customSpawnAc) || 10)}
                                                    className="w-full py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[8px] font-black uppercase tracking-widest hover:bg-purple-500/30 transition-all disabled:opacity-30"
                                                >
                                                    Spawn Custom →
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                    </AnimatePresence>
                                </div>

                                {selectedCombatant || focus ? (() => {
                                    const dmTarget = selectedCombatant || focus!;
                                    return (
                                        <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-purple-400/60">Editing: {dmTarget.name}</p>
                                            <span className={`text-[7px] font-black uppercase px-2 py-1 rounded-lg border ${dmTarget.side === 'Ally' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{dmTarget.type || dmTarget.side}</span>
                                        </div>

                                        {/* VISIBILITY */}
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Visibility</p>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <button onClick={() => dmToggleHidden(dmTarget.instanceId)} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[8px] font-black border transition-all ${dmTarget.hidden ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}>
                                                    <EyeOff className="w-3 h-3" />{dmTarget.hidden ? 'Hidden' : 'Set Hidden'}
                                                </button>
                                                <button onClick={() => dmTogglePartialHidden(dmTarget.instanceId)} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[8px] font-black border transition-all ${dmTarget.partialHidden ? 'bg-slate-700/60 border-slate-600/60 text-slate-300' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}>
                                                    <Eye className="w-3 h-3" />{dmTarget.partialHidden ? 'Partial' : 'Part. Cover'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* ADVANTAGE / DISADVANTAGE */}
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Roll Override</p>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <button onClick={() => dmToggleAdvantage(dmTarget.instanceId)} className={`py-2 rounded-xl text-[8px] font-black border transition-all ${dmTarget.conditions.includes('Advantage' as any) ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-500 hover:text-emerald-400'}`}>↑ Advantage</button>
                                                <button onClick={() => dmToggleDisadvantage(dmTarget.instanceId)} className={`py-2 rounded-xl text-[8px] font-black border transition-all ${dmTarget.conditions.includes('Disadvantage' as any) ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-white/5 border-white/10 text-slate-500 hover:text-red-400'}`}>↓ Disadv.</button>
                                            </div>
                                        </div>

                                        {/* HP */}
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">HP — {dmTarget.currentHP}/{dmTarget.maxHP}{dmTarget.tempHP > 0 ? ` (+${dmTarget.tempHP} tmp)` : ''}</p>
                                            <div className="grid grid-cols-6 gap-1">
                                                {[-10,-5,-1,1,5,10].map(d => (
                                                    <button key={d} onClick={() => dmAdjustHP(dmTarget.instanceId, d)} className={`py-1.5 rounded-lg text-[8px] font-black border transition-all ${d < 0 ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}>{d > 0 ? '+' : ''}{d}</button>
                                                ))}
                                            </div>
                                            <div className="flex gap-1.5">
                                                <input type="number" value={dmHpInput} onChange={e => setDmHpInput(e.target.value)} placeholder="Set HP…" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-slate-700 outline-none focus:border-white/20" />
                                                <button onClick={() => dmApplyHP(dmTarget.instanceId)} className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 text-[8px] font-black border border-white/10 hover:bg-white/15">SET</button>
                                            </div>
                                        </div>

                                        {/* TEMP HP */}
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Temp HP</p>
                                            <div className="flex gap-1.5">
                                                <input type="number" value={dmTempHpInput} onChange={e => setDmTempHpInput(e.target.value)} placeholder="Add Temp HP…" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-slate-700 outline-none focus:border-white/20" />
                                                <button onClick={() => dmApplyTempHP(dmTarget.instanceId)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-[8px] font-black border border-blue-500/20 hover:bg-blue-500/30">SET</button>
                                            </div>
                                        </div>

                                        {/* LEVEL */}
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Level — {dmTarget.level}</p>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => dmChangeLevel(dmTarget.instanceId, dmTarget.level - 1)} className="size-7 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[12px] font-black transition-all flex items-center justify-center">−</button>
                                                <div className="flex-1 grid grid-cols-5 gap-1">
                                                    {[1, 5, 10, 15, 20].map(lv => (
                                                        <button key={lv} onClick={() => dmChangeLevel(dmTarget.instanceId, lv)} className={`py-1 rounded-lg text-[8px] font-black border transition-all ${dmTarget.level === lv ? 'bg-violet-500/30 border-violet-500/50 text-violet-300' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/10'}`}>{lv}</button>
                                                    ))}
                                                </div>
                                                <button onClick={() => dmChangeLevel(dmTarget.instanceId, dmTarget.level + 1)} className="size-7 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[12px] font-black transition-all flex items-center justify-center">+</button>
                                            </div>
                                        </div>

                                        {/* AC + INITIATIVE */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">AC — {dmTarget.ac}</p>
                                                <div className="flex gap-1">
                                                    <input type="number" value={dmAcInput} onChange={e => setDmAcInput(e.target.value)} placeholder="Override…" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-slate-700 outline-none focus:border-white/20" />
                                                    <button onClick={() => dmApplyAC(dmTarget.instanceId)} className="px-2 py-1.5 rounded-lg bg-white/10 text-slate-300 text-[8px] font-black border border-white/10 hover:bg-white/15">SET</button>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Initiative — {dmTarget.initiative}</p>
                                                <div className="flex gap-1">
                                                    <input type="number" placeholder="Override…" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-slate-700 outline-none focus:border-white/20"
                                                        onKeyDown={e => { if (e.key === 'Enter') { handleInitiativeEdit(dmTarget.instanceId, parseInt((e.target as HTMLInputElement).value) || dmTarget.initiative); (e.target as HTMLInputElement).value = ''; } }} />
                                                    <button onClick={() => setInitiativeEditId(dmTarget.instanceId)} className="px-2 py-1.5 rounded-lg bg-white/10 text-slate-300 text-[8px] font-black border border-white/10 hover:bg-white/15">←</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MOVEMENT */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Movement</p>
                                                <span className="text-[8px] text-slate-500">{dmTarget.resources.movementRemaining ?? (dmTarget.resources.movementMax - dmTarget.resources.movementSpent)}ft remaining / {dmTarget.resources.movementMax}ft</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {[5,10,15,30].map(ft => (
                                                    <button key={ft} onClick={() => dmSpendMovement(dmTarget.instanceId, ft)} className="flex-1 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[7px] font-black hover:bg-amber-500/20 transition-all">−{ft}</button>
                                                ))}
                                                <button onClick={() => updateCombatant(dmTarget.instanceId, { resources: { ...dmTarget.resources, movementSpent: 0, movementRemaining: dmTarget.resources.movementMax } })} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-500 text-[7px] font-black hover:text-slate-300">RST</button>
                                            </div>
                                        </div>

                                        {/* CONCENTRATION */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Concentration</p>
                                                {dmTarget.concentration && (
                                                    <button onClick={() => dmSetConcentration(dmTarget.instanceId, null)} className="text-[7px] text-red-500 font-black hover:text-red-400">Break</button>
                                                )}
                                            </div>
                                            {dmTarget.concentration ? (
                                                <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                                                    <div className="size-2 rounded-full bg-blue-400 animate-pulse" />
                                                    <span className="text-[10px] font-black text-blue-300">{dmTarget.concentration}</span>
                                                </div>
                                            ) : (
                                                <input type="text" placeholder="Concentrating on…" className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder:text-slate-700 outline-none focus:border-blue-500/30"
                                                    onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value) { dmSetConcentration(dmTarget.instanceId, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} />
                                            )}
                                        </div>

                                        {/* CONDITIONS */}
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Conditions</p>
                                            <div className="flex flex-wrap gap-1">
                                                {(['Prone','Poisoned','Stunned','Blinded','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Restrained','Unconscious','Rage','Dodge','Deafened','Petrified'] as const).map(cond => (
                                                    <button key={cond} onClick={() => dmToggleCondition(dmTarget.instanceId, cond)} className={`text-[7px] font-black uppercase px-2 py-1 rounded-lg border transition-all ${dmTarget.conditions.includes(cond as any) ? 'bg-amber-500 border-amber-400 text-black' : 'bg-white/5 border-white/5 text-slate-600 hover:text-slate-300'}`}>{cond}</button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* NOTES */}
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> DM Notes</p>
                                            <textarea
                                                value={dmNotesInput || dmTarget.dmNotes || ''}
                                                onChange={e => setDmNotesInput(e.target.value)}
                                                onBlur={() => { dmSaveNotes(dmTarget.instanceId, dmNotesInput || ''); }}
                                                placeholder="Notes visible only to DM…"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-slate-300 placeholder:text-slate-700 outline-none focus:border-white/20 resize-none h-16"
                                            />
                                        </div>

                                        {/* SPELL SLOTS */}
                                        {dmTarget.resources.spellSlots && Object.keys(dmTarget.resources.spellSlots).length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Spell Slots</p>
                                                <div className="space-y-1">
                                                    {Object.entries(dmTarget.resources.spellSlots).map(([lvl, slots]: any) => (
                                                        <div key={lvl} className="flex items-center gap-2">
                                                            <span className="text-[8px] font-black text-slate-500 w-8 shrink-0">Lvl {lvl}</span>
                                                            <div className="flex gap-1 flex-1">
                                                                {Array.from({ length: slots.max }).map((_, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => {
                                                                            const used = i < (slots.max - slots.current);
                                                                            updateCombatant(dmTarget.instanceId, {
                                                                                resources: {
                                                                                    ...dmTarget.resources,
                                                                                    spellSlots: {
                                                                                        ...dmTarget.resources.spellSlots,
                                                                                        [lvl]: { ...slots, current: used ? slots.current + 1 : Math.max(0, slots.current - 1) }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }}
                                                                        className={`flex-1 h-3.5 rounded border transition-all ${i < slots.current ? 'bg-violet-500/40 border-violet-500/60' : 'bg-white/5 border-white/5 hover:border-white/15'}`}
                                                                        title={i < slots.current ? 'Click to expend' : 'Click to restore'}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="text-[7px] font-black text-slate-600 shrink-0">{slots.current}/{slots.max}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => updateCombatant(dmTarget.instanceId, {
                                                        resources: {
                                                            ...dmTarget.resources,
                                                            spellSlots: Object.fromEntries(
                                                                Object.entries(dmTarget.resources.spellSlots || {}).map(([lvl, s]: any) => [lvl, { ...s, current: s.max }])
                                                            )
                                                        }
                                                    })}
                                                    className="w-full py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[7px] font-black hover:bg-violet-500/20 transition-all"
                                                >
                                                    Restore All Slots
                                                </button>
                                            </div>
                                        )}

                                        {/* RECHARGE ABILITIES */}
                                        {dmTarget.rechargeAbilities && dmTarget.rechargeAbilities.length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Recharge Abilities</p>
                                                <div className="space-y-1">
                                                    {dmTarget.rechargeAbilities.map((ability: any) => (
                                                        <div key={ability.name} className="flex items-center gap-2">
                                                            <div className={`flex-1 px-2 py-1.5 rounded-lg border text-[8px] font-black flex items-center gap-1.5 ${ability.used ? 'bg-white/5 border-white/5 text-slate-600' : 'bg-orange-500/10 border-orange-500/20 text-orange-300'}`}>
                                                                <span className="flex-1 truncate">{ability.name}</span>
                                                                <span className="text-[7px] text-slate-600">{ability.recharge}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => updateCombatant(dmTarget.instanceId, {
                                                                    rechargeAbilities: dmTarget.rechargeAbilities!.map((a: any) =>
                                                                        a.name === ability.name ? { ...a, used: !a.used } : a
                                                                    )
                                                                })}
                                                                className={`px-2 py-1.5 rounded-lg text-[7px] font-black border transition-all ${ability.used ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}
                                                            >
                                                                {ability.used ? 'RCHG' : 'USE'}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* DM TEMP LOADOUT */}
                                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Temp Loadout</p>
                                                <button onClick={() => setShowTempLoadout(v => !v)} className="text-[7px] font-black text-slate-600 hover:text-amber-400 transition-colors uppercase tracking-widest">
                                                    {showTempLoadout ? '▲ Hide' : '▼ Add'}
                                                </button>
                                            </div>
                                            {/* Existing temp actions */}
                                            {(dmTarget.tempActions ?? []).length > 0 && (
                                                <div className="space-y-1">
                                                    {(dmTarget.tempActions ?? []).map((a: Action) => (
                                                        <div key={a.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                                                            <span className="flex-1 text-[8px] font-black text-amber-300 truncate">{a.name} ({a.damageDice})</span>
                                                            <button onClick={() => revokeTempAction(dmTarget.instanceId, a.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {showTempLoadout && (
                                                <div className="space-y-2 pt-1">
                                                    <input value={tempActionName} onChange={e => setTempActionName(e.target.value)} placeholder="Action name…" className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder:text-slate-700 outline-none focus:border-amber-500/30" />
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <input value={tempActionDice} onChange={e => setTempActionDice(e.target.value)} placeholder="Dice (1d6)" className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder:text-slate-700 outline-none focus:border-amber-500/30" />
                                                        <input value={tempActionType} onChange={e => setTempActionType(e.target.value)} placeholder="Type" className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder:text-slate-700 outline-none focus:border-amber-500/30" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <input value={tempActionBonus} onChange={e => setTempActionBonus(e.target.value)} placeholder="+Hit" className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder:text-slate-700 outline-none focus:border-amber-500/30" />
                                                        <button
                                                            disabled={!tempActionName.trim()}
                                                            onClick={() => {
                                                                grantTempAction(dmTarget.instanceId, {
                                                                    id: `temp-${Date.now()}`,
                                                                    name: tempActionName.trim(),
                                                                    description: 'Temporary DM-granted action',
                                                                    type: 'Action',
                                                                    actionType: 'Attack',
                                                                    damageDice: tempActionDice || '1d6',
                                                                    damageType: tempActionType || 'slashing',
                                                                    attackBonus: parseInt(tempActionBonus) || 0,
                                                                    source: 'Temp',
                                                                });
                                                                setTempActionName(''); setTempActionDice('1d6'); setTempActionBonus('0');
                                                                setShowTempLoadout(false);
                                                            }}
                                                            className="py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[8px] font-black hover:bg-amber-500/30 transition-all disabled:opacity-30"
                                                        >
                                                            Grant →
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* DANGER ZONE */}
                                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                                            <p className="text-[7px] font-black uppercase tracking-widest text-red-500/40">Danger Zone</p>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <button onClick={() => dmKillInstantly(dmTarget.instanceId)} className="py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-black hover:bg-red-500/20 transition-all">Kill Instantly</button>
                                                <button onClick={() => dmRevive(dmTarget.instanceId)} className="py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black hover:bg-emerald-500/20 transition-all">Revive (1 HP)</button>
                                            </div>
                                            <button onClick={() => { setCombatants(prev => prev.filter(c => c.instanceId !== dmTarget.instanceId)); setSelectedId(null); }} className="w-full py-2 rounded-xl text-slate-600 text-[8px] font-black border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all">Remove from Encounter</button>
                                        </div>
                                    </div>
                                );
                            })() : (
                                    <div className="py-10 text-center opacity-30">
                                        <Shield className="w-7 h-7 mx-auto mb-2 text-slate-500" />
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Select a combatant</p>
                                    </div>
                                )}
                        </div>{/* /DM Tools scrollable */}

                        {/* ── JOURNAL — collapsible ── */}
                        <div className="border-t border-white/5 shrink-0">
                            <button
                                onClick={() => setShowJournalLog(v => !v)}
                                className="w-full px-4 py-2 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-slate-300 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Notebook className="w-3 h-3" />
                                    <span>Battle Journal</span>
                                    {log.length > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-white/8 text-slate-600 text-[7px] font-bold">{log.length}</span>
                                    )}
                                </div>
                                <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showJournalLog ? 'rotate-90' : ''}`} />
                            </button>
                            {showJournalLog && (
                                <div className="flex flex-col border-t border-white/5" style={{ height: '230px' }}>
                                    {/* Note input */}
                                    <div className="px-3 py-2 border-b border-white/5 shrink-0 flex gap-2">
                                        <input
                                            value={noteInput}
                                            onChange={e => setNoteInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && noteInput.trim()) {
                                                    addLog(noteInput.trim(), 'notes');
                                                    setNoteInput('');
                                                }
                                            }}
                                            placeholder="Add note…"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-emerald-100 placeholder:text-slate-600 outline-none focus:border-emerald-500/30 transition-all"
                                        />
                                        <button
                                            onClick={() => { if (noteInput.trim()) { addLog(noteInput.trim(), 'notes'); setNoteInput(''); } }}
                                            disabled={!noteInput.trim()}
                                            className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 disabled:opacity-30 transition-all"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    {/* Log entries */}
                                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
                                        {log.length === 0 && (
                                            <p className="text-center text-[8px] text-slate-700 py-6 italic">No events yet</p>
                                        )}
                                        {log.slice().reverse().slice(0, 30).map(entry => (
                                            <div key={entry.id} className={`px-2.5 py-1.5 rounded-xl text-[10px] leading-relaxed ${
                                                entry.type === 'combat' ? 'bg-red-500/[0.04] border border-red-500/15 text-red-200/80' :
                                                entry.type === 'system' ? 'text-slate-600 italic text-[9px] font-mono opacity-60' :
                                                'bg-emerald-500/[0.04] border border-emerald-500/15 text-emerald-200/80 italic'
                                            }`}>
                                                {entry.message}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Clear log */}
                                    <div className="px-3 py-1.5 border-t border-white/5 shrink-0">
                                        <button onClick={() => setLog([])} className="w-full py-1 rounded-lg bg-white/5 border border-white/5 text-slate-700 hover:text-red-400 text-[7px] font-black uppercase tracking-widest transition-all">
                                            Clear Log
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── FOOTER: End Turn ── */}
                        <div className="px-3 pb-3 pt-2 shrink-0 border-t border-white/5">
                            <button
                                onClick={(e) => { e.stopPropagation(); endTurn(); }}
                                disabled={!activeId}
                                className={`w-full py-2.5 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isDMMode ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30 shadow-[0_6px_16px_rgba(168,85,247,0.15)] hover:bg-purple-500/30' : 'bg-amber-500 text-black shadow-[0_6px_16px_rgba(245,158,11,0.25)] hover:brightness-110'}`}
                            >
                                <ChevronRight className="w-3.5 h-3.5" /> End Turn
                            </button>
                        </div>

                            </div>{/* /dm-console inner */}
                        </div>{/* /content-area */}
                    </aside>
    </div>
) : (
            <>
                {/* ── EMPTY STATE ── */}
                <div className="flex-1 flex items-center justify-center flex-col gap-8">
                    <div className="size-24 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Swords className="w-10 h-10 text-amber-500" />
                    </div>
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black uppercase text-white tracking-tight">The Field is Quiet</h1>
                        <p className="text-sm text-slate-500 max-w-sm">Summon your party and forge an encounter to begin combat.</p>
                    </div>
                    {/* God Mode Toggle */}
                    <button
                        onClick={() => setIsDMMode(!isDMMode)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                            isDMMode 
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                        title="Toggle DM God Mode (Free Movement & Control)"
                    >
                        {isDMMode
                            ? <Sparkles className={`w-5 h-5 ${isDMMode ? 'animate-pulse' : ''}`} />
                            : <Shield className="w-5 h-5" />
                        }
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isDMMode ? 'God Mode Active' : 'God Mode'}
                        </span>
                    </button>
                    <button onClick={() => setIsBuilding(true)} className="px-10 py-4 bg-amber-500 text-black font-black uppercase tracking-[0.25em] text-[11px] rounded-2xl shadow-[0_15px_40px_rgba(245,158,11,0.3)] hover:brightness-110 hover:scale-105 active:scale-95 transition-all">
                        Forge Encounter
                    </button>
                </div>
            </>
        )}



            {/* ═══ OVERLAYS ═══ */}

            {/* ── Combat Action Modal ── */}
            {combatActionModal.isOpen && combatActionModal.attacker && combatActionModal.action && (
                <CombatActionModal
                    isOpen={combatActionModal.isOpen}
                    onClose={() => {
                        setCombatActionModal({ isOpen: false });
                        // Return dice tray to free mode when modal closes
                        setDicePreloadFormula(undefined);
                        setDiceContextLabel(undefined);
                        setConfirmedRoll(null);
                    }}
                    onComplete={handleActionResolution}
                    attacker={combatActionModal.attacker}
                    action={combatActionModal.action}
                    initialTarget={combatActionModal.initialTarget ?? null}
                    availableTargets={sortedCombatants.filter(c => c.currentHP > 0)}
                    combatMode={combatMode}
                    onStepChange={(step, formula, label) => {
                        // Reset the confirmed roll so it's not re-used for the new step
                        setConfirmedRoll(null);
                        if (formula && label) {
                            // Preload the formula/label so the tray is ready if the user
                            // manually opens it — but don't auto-open it during combat.
                            setDicePreloadFormula(formula);
                            setDiceContextLabel(label);
                        } else {
                            // Non-roll step (target select, result display)
                            setDicePreloadFormula(undefined);
                            setDiceContextLabel(undefined);
                        }
                    }}
                    confirmedRoll={confirmedRoll}
                />
            )}




            {/* ── Battle State Panel ── */}
            <BattleStatePanel
                isOpen={showBattleState}
                onClose={() => setShowBattleState(false)}
                combatants={combatants}
                activeCombatantId={activeId}
                round={round}
                log={log}
                onLoadSnapshot={handleLoadSnapshot}
            />

            {/* ── Combat Library Panel ── */}
            <CombatLibraryPanel
                isOpen={showLibrary}
                onClose={() => setShowLibrary(false)}
                homebrewMonsters={homebrewMonsters}
                homebrewSpells={homebrewSpells}
                focusedCombatant={focus ?? selectedCombatant ?? null}
                onSpawnMonster={handleSpawnFromLibrary}
                onAssignSpell={handleAssignSpellFromLibrary}
            />

            {/* ── Victory / End Combat Screen ── */}
            <AnimatePresence>
                {victoryPending && (
                    <VictoryScreen
                        combatants={combatants}
                        round={round}
                        log={log}
                        onDismiss={() => setVictoryPending(false)}
                        onEndCombat={(record) => {
                            // Write to journal
                            const entry = `⚔ Battle ended — Round ${round}. ${record.defeated.length} enemy/enemies defeated. ${record.fallen.length > 0 ? `Fallen: ${record.fallen.join(', ')}. ` : ''}${record.loot ? `Loot: ${record.loot}. ` : ''}${record.location ? `Location: ${record.location}. ` : ''}${record.notes ? record.notes : ''}`;
                            addLog(entry, 'narrative');
                            setVictoryPending(false);
                            resetCombat();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Encounter Builder */}
            <AnimatePresence>
                {isBuilding && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-[#0d0d0f] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col">
                            <button onClick={() => setIsBuilding(false)} className="absolute top-6 right-6 z-10 size-10 rounded-full bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all border border-white/5">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex-1 overflow-y-auto">
                                <EncounterBuilder onStartCombat={startCombat} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Wild Shape Modal — global overlay so it works from any view */}
            <WildshapeModal
                isOpen={isWildshapeOpen}
                onClose={() => setIsWildshapeOpen(false)}
                beasts={BEASTS}
                onSelectBeast={handleWildShapeSelect}
            />

            {/* Hidden file input for portraits */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

            {/* ── VICTORY / DEFEAT OVERLAY ── */}
            <AnimatePresence>
                {showVictory && (
                    <VictoryScreen
                        combatants={combatants}
                        round={round}
                        log={log}
                        outcome={showVictory}
                        onDismiss={() => setShowVictory(null)}
                        onEndCombat={(record) => {
                            // Save battle record to persistent log
                            const saved = JSON.parse(localStorage.getItem('mythic_battle_records') || '[]');
                            saved.unshift({ ...record, date: new Date().toISOString(), round, outcome: showVictory });
                            localStorage.setItem('mythic_battle_records', JSON.stringify(saved.slice(0, 50)));
                            setShowVictory(null);
                            resetCombat();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ── MOBILE / TABLET FLOATING END TURN ──────────────────────────────────
                Visible on screens narrower than xl (< 1280px) when combat is active.
                Ensures End Turn is always reachable even if side panels are hidden.
            ──────────────────────────────────────────────────────────────────────── */}
            {activeId && !isSetupPhase && (
                <div className="xl:hidden fixed bottom-5 right-5 z-[300] flex flex-col items-end gap-2">
                    {/* Active combatant pill */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/90 border border-amber-500/30 backdrop-blur-xl">
                        <span className="size-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">{activeCombatant?.name}</span>
                    </div>
                    {/* End Turn button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); endTurn(); }}
                        className="min-h-[52px] px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-[12px] uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all flex items-center gap-2"
                    >
                        <ChevronRight className="w-5 h-5" />
                        End Turn
                    </button>
                </div>
            )}

            {/* ── DM ADD ELEMENT MODAL ────────────────────────────────────────────────── */}
            {/* ── MOBILE NAVIGATION ── */}
            <div className="lg:hidden fixed bottom-6 left-6 right-6 h-14 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl z-[100] flex items-center justify-around px-2 shadow-2xl ring-1 ring-white/5">
                {[
                    { id: 'initiative', icon: Zap, label: 'Combat' },
                    { id: 'map', icon: MapIcon, label: 'Map' },
                    { id: 'stats', icon: Shield, label: 'Stats' },
                    { id: 'journal', icon: BookOpen, label: 'Logs' }
                ].map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveMobileTab(tab.id as any);
                                if (tab.id === 'map') {
                                    setViewMode('battlemap');
                                } else {
                                    setViewMode('character');
                                }
                                if (tab.id === 'stats') setShowTacticalView(true);
                            }}
                            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${activeMobileTab === tab.id ? 'text-amber-400' : 'text-slate-500'}`}
                        >
                            <TabIcon className={`w-4 h-4 transition-transform ${activeMobileTab === tab.id ? 'scale-110' : ''}`} />
                            <span className="text-[7px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            <DMAddElementModal
                isOpen={isDMAddModalOpen}
                onClose={() => setIsDMAddModalOpen(false)}
                onAddMonster={handleAddMonster}
                onReplaceActions={handleReplaceActions}
                selectedCombatant={combatants.find(c => c.instanceId === selectedId) || null}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// VICTORY SCREEN
// ─────────────────────────────────────────────────────────────────────────────

interface VictoryRecord {
    defeated: string[];
    fallen: string[];
    loot: string;
    location: string;
    notes: string;
}

function VictoryScreen({
    combatants, round, log, outcome, onDismiss, onEndCombat
}: {
    combatants: CombatantState[];
    round: number;
    log: LogEntry[];
    outcome?: 'victory' | 'defeat' | null;
    onDismiss: () => void;
    onEndCombat: (record: VictoryRecord) => void;
}) {
    const [loot, setLoot] = React.useState('');
    const [location, setLocation] = React.useState('');
    const [notes, setNotes] = React.useState('');

    const defeated = combatants.filter(c => c.side === 'Enemy' && c.currentHP <= 0);
    const fled = combatants.filter(c => c.side === 'Enemy' && c.currentHP > 0);
    const fallen = combatants.filter(c => c.side === 'Ally' && c.currentHP <= 0);
    const survivors = combatants.filter(c => c.side === 'Ally' && c.currentHP > 0);
    const isVictory = outcome === 'victory' || (combatants.filter(c => c.side === 'Enemy').every(c => c.currentHP <= 0) && combatants.filter(c => c.side === 'Enemy').length > 0);
    const isDefeat = outcome === 'defeat';

    const [tab, setTab] = React.useState<'summary' | 'record'>('summary');

    const titleText = isVictory ? 'Victory!' : isDefeat ? 'Defeat' : 'Combat Ends';
    const titleColor = isVictory ? 'text-amber-400' : isDefeat ? 'text-red-400' : 'text-slate-300';
    const glowColor = isVictory ? 'via-amber-500' : isDefeat ? 'via-red-600' : 'via-slate-500';
    const subtitleText = isVictory ? 'All enemies defeated' : isDefeat ? 'The party has fallen' : 'Battle concluded';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
        >
            {/* Card */}
            <motion.div
                initial={{ scale: 0.92, y: 24, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 24, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full max-w-lg bg-[#0D0F14] border border-white/10 rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.9)] overflow-hidden"
            >
                {/* Top glow bar — color by outcome */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent ${glowColor} to-transparent opacity-80`} />

                {/* Dismiss */}
                <button
                    onClick={onDismiss}
                    className="absolute top-5 right-5 size-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all z-10"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="p-8 space-y-6">
                    {/* Title */}
                    <div className="text-center space-y-1">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                            className={`text-[48px] font-black uppercase tracking-tighter leading-none ${titleColor}`}
                        >
                            {titleText}
                        </motion.div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                            {subtitleText} · Round {round}
                        </p>
                    </div>

                    {/* Tab toggle */}
                    <div className="flex p-1 gap-1 bg-white/[0.03] border border-white/5 rounded-2xl">
                        <button onClick={() => setTab('summary')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'summary' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}>Summary</button>
                        <button onClick={() => setTab('record')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'record' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}>Record Battle</button>
                    </div>

                    <AnimatePresence mode="wait">
                    {tab === 'summary' ? (
                        <motion.div key="summary" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                            {/* Enemies defeated */}
                            {defeated.length > 0 && (
                                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/15 space-y-2">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-red-500/60">Enemies Defeated · {defeated.length}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {defeated.map(c => (
                                            <span key={c.instanceId} className="text-[9px] font-black px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
                                                {c.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Enemies fled */}
                            {fled.length > 0 && (
                                <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/15 space-y-2">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-orange-500/60">Fled / Survived · {fled.length}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {fled.map(c => (
                                            <span key={c.instanceId} className="text-[9px] font-black px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300">
                                                {c.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Party */}
                            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-2">
                                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500/60">Party</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {survivors.map(c => (
                                        <span key={c.instanceId} className="text-[9px] font-black px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                                            {c.name} <span className="opacity-60">{c.currentHP}/{c.maxHP} HP</span>
                                        </span>
                                    ))}
                                    {fallen.map(c => (
                                        <span key={c.instanceId} className="text-[9px] font-black px-2.5 py-1 rounded-xl bg-slate-700/50 border border-slate-600/30 text-slate-400 line-through">
                                            {c.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="record" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Location / Setting</label>
                                <input
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="e.g. Goblin Cave, Floor 2…"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[11px] text-white placeholder:text-slate-700 outline-none focus:border-amber-500/40 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Loot Found</label>
                                <input
                                    value={loot}
                                    onChange={e => setLoot(e.target.value)}
                                    placeholder="e.g. 50gp, Sword +1, Scroll of Fireball…"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[11px] text-white placeholder:text-slate-700 outline-none focus:border-amber-500/40 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">DM Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="What happened? What's next?…"
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[11px] text-white placeholder:text-slate-700 outline-none focus:border-amber-500/40 transition-all resize-none"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                    {/* Action buttons */}
                    <div className="space-y-2 pt-2">
                        <div className="flex gap-2">
                            <button
                                onClick={onDismiss}
                                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/[0.08] text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all"
                            >
                                Continue Battle
                            </button>
                            <button
                                onClick={() => onEndCombat({
                                    defeated: defeated.map(c => c.name),
                                    fallen: fallen.map(c => c.name),
                                    loot, location, notes,
                                })}
                                className={`flex-[2] py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all ${isVictory ? 'bg-amber-500 text-black shadow-[0_8px_25px_rgba(245,158,11,0.3)]' : 'bg-red-600/80 text-white shadow-[0_8px_25px_rgba(239,68,68,0.3)]'}`}
                            >
                                Save to Journal & End →
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onEndCombat({ defeated: [], fallen: [], loot: '', location: '', notes: 'Combat cancelled.' })}
                                className="flex-1 py-2.5 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-600 text-[8px] font-black uppercase tracking-widest hover:text-slate-400 hover:border-white/10 transition-all"
                            >
                                Reset Combat
                            </button>
                            <button
                                onClick={() => { window.location.href = '/'; }}
                                className="flex-1 py-2.5 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-600 text-[8px] font-black uppercase tracking-widest hover:text-slate-400 hover:border-white/10 transition-all"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
