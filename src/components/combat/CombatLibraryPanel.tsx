'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Swords, Sparkles, FlaskConical, ChevronRight,
  Plus, Shield, Zap, BookOpen, ExternalLink,
} from 'lucide-react';
import monstersData from '@/data/monsters.json';
import spellsData from '@/data/spells.json';
import type { HomebrewMonster, HomebrewSpell } from '@/types/homebrew';
import type { Action, CombatantState } from '@/types';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface MonsterTrait {
  name: string;
  description: string;
  limitedUses?: string; // e.g. "3/Day"
}

interface MonsterLegendaryAction {
  name: string;
  cost: number;
  description: string;
}

interface MonsterSpellcasting {
  ability: string;
  spellSaveDC: number;
  spellAttackBonus: number;
  level: number;
  slots: Record<string, number>;
  spells: Record<string, string[]>;
}

interface OfficialMonster {
  id: string;
  name: string;
  type: string;
  cr: string;
  hp: number;
  ac: number;
  speed?: number;
  description?: string;
  stats?: Record<string, number>;
  savingThrows?: Record<string, number>;
  skills?: Record<string, number>;
  damageResistances?: string[];
  damageImmunities?: string[];
  conditionImmunities?: string[];
  senses?: string;
  languages?: string;
  /** actions can be raw strings (legacy) or pre-structured Action objects */
  actions?: (string | Action)[];
  traits?: MonsterTrait[];
  spellcasting?: MonsterSpellcasting;
  legendaryActions?: MonsterLegendaryAction[];
  legendaryActionCount?: number;
  visualUrl?: string;
  webLink?: string;
}

interface OfficialSpell {
  id: string;
  name: string;
  level: number;
  school: string;
  time: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  visualUrl?: string;
  webLink?: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function crToNum(cr: string): number {
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  return parseFloat(cr) || 0;
}

function crColor(cr: string): string {
  const n = crToNum(cr);
  if (n >= 17) return 'bg-red-900/40 text-red-300 border-red-700/40';
  if (n >= 10) return 'bg-orange-900/40 text-orange-300 border-orange-700/40';
  if (n >= 5)  return 'bg-amber-900/40 text-amber-300 border-amber-700/40';
  if (n >= 1)  return 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40';
  return 'bg-slate-700/60 text-slate-400 border-slate-600';
}

function levelLabel(lvl: number): string {
  if (lvl === 0) return 'Cantrip';
  if (lvl === 1) return '1st';
  if (lvl === 2) return '2nd';
  if (lvl === 3) return '3rd';
  return `${lvl}th`;
}

function levelColor(lvl: number): string {
  if (lvl === 0) return 'bg-green-900/40 text-green-300 border-green-700/40';
  if (lvl <= 3)  return 'bg-blue-900/40 text-blue-300 border-blue-700/40';
  if (lvl <= 6)  return 'bg-purple-900/40 text-purple-300 border-purple-700/40';
  return 'bg-red-900/40 text-red-300 border-red-700/40';
}

// Converts a raw actions string (old format) into a lightweight Action
function parseRawAction(raw: string, idx: number): Action {
  return {
    id: `parsed-${idx}`,
    name: raw.split(':')[0] ?? 'Action',
    description: raw,
    type: 'Action',
    actionType: 'Attack',
    attackType: 'Melee',
    source: 'Item',
  };
}

// Convert an official monster to a CombatantState-ready shape
function officialMonsterToSpawn(m: OfficialMonster): {
  name: string; hp: number; ac: number; speed: number;
  species: string; actions: Action[];
  abilityScores: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number };
} {
  const stats = m.stats ?? {};

  // Build the actions list: pass through pre-structured Action objects; parse legacy strings
  const actions: Action[] = (m.actions ?? []).map((a, i) => {
    if (typeof a === 'string') return parseRawAction(a, i);
    // Pre-structured: already an Action-compatible object
    return a as Action;
  });

  // If the monster has spellcasting, add a synthetic Spellcasting action so the
  // spell list is surfaced in the combat panel
  if (m.spellcasting) {
    const sc = m.spellcasting;
    const spellLines: string[] = [];
    Object.entries(sc.spells).forEach(([lvl, names]) => {
      const label = lvl === '0' ? 'Cantrips (at will)' : `Level ${lvl} (${sc.slots[lvl] ?? 0} slots)`;
      spellLines.push(`${label}: ${(names as string[]).join(', ')}`);
    });
    actions.push({
      id: 'spellcasting',
      name: 'Spellcasting',
      description: `${m.name} is an ${sc.level}th-level spellcaster. Spellcasting ability: ${sc.ability} (spell save DC ${sc.spellSaveDC}, +${sc.spellAttackBonus} to hit). Spells prepared:\n${spellLines.join('\n')}`,
      type: 'Action',
      actionType: 'Spell',
      attackType: 'Spell',
      source: 'Item',
    } as Action);
  }

  return {
    name: m.name,
    hp: m.hp,
    ac: m.ac,
    speed: m.speed ?? 30,
    species: m.type,
    actions,
    abilityScores: {
      STR: stats['STR'] ?? 10,
      DEX: stats['DEX'] ?? 10,
      CON: stats['CON'] ?? 10,
      INT: stats['INT'] ?? 10,
      WIS: stats['WIS'] ?? 10,
      CHA: stats['CHA'] ?? 10,
    },
  };
}

// Convert a HomebrewMonster to the same shape
function homebrewMonsterToSpawn(m: HomebrewMonster): {
  name: string; hp: number; ac: number; speed: number;
  species: string; actions: Action[];
  abilityScores: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number };
} {
  return {
    name: m.name,
    hp: m.hp,
    ac: m.ac,
    speed: m.speed,
    species: m.type,
    actions: m.actions,
    abilityScores: m.abilityScores,
  };
}

const CR_FILTER_OPTIONS = [
  { label: 'All CR', value: 'all' },
  { label: 'CR 0–½', value: 'low' },
  { label: 'CR 1–4', value: 'easy' },
  { label: 'CR 5–10', value: 'med' },
  { label: 'CR 11–16', value: 'hard' },
  { label: 'CR 17+', value: 'deadly' },
];

const SPELL_LEVEL_OPTIONS = [
  { label: 'All', value: -1 },
  { label: 'Cantrip', value: 0 },
  ...([1,2,3,4,5,6,7,8,9].map(l => ({ label: `Level ${l}`, value: l }))),
];

// ─── MONSTER CARD ─────────────────────────────────────────────────────────────

function MonsterRow({
  name, type, cr, hp, ac, isHomebrew, isOverride, onSpawn, onViewDetails,
}: {
  name: string; type: string; cr: string; hp: number; ac: number;
  isHomebrew?: boolean; isOverride?: boolean;
  onSpawn: () => void; onViewDetails?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60
        hover:border-slate-600 hover:bg-slate-800 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-100 truncate">{name}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${crColor(cr)}`}>CR {cr}</span>
          {isHomebrew && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-700/30">
              <FlaskConical size={8} /> HB
            </span>
          )}
          {isOverride && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-700/30">Override</span>
          )}
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5 capitalize">
          {type} · HP {hp} · AC {ac}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onViewDetails && (
          <button onClick={onViewDetails} title="Details" className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <BookOpen size={12} />
          </button>
        )}
        <button
          onClick={onSpawn}
          title="Spawn into combat"
          className="flex items-center gap-1 px-2 py-1 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-300 rounded-lg text-[9px] font-bold transition-colors"
        >
          <Plus size={10} /> Spawn
        </button>
      </div>
    </motion.div>
  );
}

// ─── SPELL CARD ───────────────────────────────────────────────────────────────

function SpellRow({
  spell, onAssign, onViewDetails, combatant,
}: {
  spell: OfficialSpell | HomebrewSpell;
  isHomebrew?: boolean;
  onAssign?: (spell: OfficialSpell | HomebrewSpell) => void;
  onViewDetails?: () => void;
  combatant?: CombatantState | null;
}) {
  const level = spell.level;
  const school = spell.school;
  const time = 'time' in spell ? (spell as OfficialSpell).time : (spell as HomebrewSpell).castingTime;
  const range = spell.range;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60
        hover:border-slate-600 hover:bg-slate-800 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-100">{spell.name}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${levelColor(level)}`}>
            {levelLabel(level)}
          </span>
          <span className="text-[9px] text-slate-500">{school}</span>
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">
          {time} · {range}
        </div>
        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{spell.description}</p>
      </div>
      <div className="flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onViewDetails && (
          <button onClick={onViewDetails} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <BookOpen size={12} />
          </button>
        )}
        {onAssign && (
          <button
            onClick={() => onAssign(spell)}
            title={combatant ? `Assign to ${combatant.name}` : 'Select a combatant first'}
            disabled={!combatant}
            className="flex items-center gap-1 px-2 py-1 bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 text-blue-300 rounded-lg text-[9px] font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={10} /> Assign
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

function MonsterDetailModal({ monster, onClose, onSpawn }: {
  monster: OfficialMonster | HomebrewMonster;
  onClose: () => void;
  onSpawn: () => void;
}) {
  const isOfficial = !('abilityScores' in monster);
  const stats = isOfficial ? (monster as OfficialMonster).stats ?? {} : (monster as HomebrewMonster).abilityScores;
  const keys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const mod = (v: number) => { const m = Math.floor((v - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
          <div>
            <span className="font-bold text-slate-100">{monster.name}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 capitalize">{monster.type}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${crColor((monster as any).cr)}`}>
                CR {(monster as any).cr}
              </span>
              {'size' in monster && <span className="text-xs text-slate-400">{(monster as HomebrewMonster).size}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Core */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400">HP</div>
              <div className="font-bold text-slate-100">{monster.hp}</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400">AC</div>
              <div className="font-bold text-slate-100">{monster.ac}</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400">Speed</div>
              <div className="font-bold text-slate-100">{(monster as any).speed ?? 30}ft</div>
            </div>
          </div>
          {/* Ability Scores */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Ability Scores</p>
            <div className="grid grid-cols-6 gap-1">
              {keys.map(k => {
                const val = isOfficial ? (stats as any)[k] : (stats as any)[k];
                return (
                  <div key={k} className="bg-slate-800 rounded-lg p-1.5 text-center">
                    <div className="text-[8px] text-slate-500 font-bold">{k}</div>
                    <div className="text-xs font-bold text-slate-200">{val ?? 10}</div>
                    <div className="text-[8px] text-slate-400">{mod(val ?? 10)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Actions */}
          {(monster as any).actions?.length > 0 && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Actions</p>
              <div className="space-y-1.5">
                {((monster as any).actions as any[]).map((a: any, i: number) => (
                  <div key={i} className="bg-slate-800/60 rounded-lg px-3 py-2 text-xs text-slate-300">
                    {typeof a === 'string' ? a : `${a.name}: ${a.description}`}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Description */}
          {(monster as any).description && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Description</p>
              <p className="text-xs text-slate-400">{(monster as any).description}</p>
            </div>
          )}
          {/* Web link (official only) */}
          {(monster as any).webLink && (
            <a href={(monster as any).webLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              <ExternalLink size={11} /> View on D&D Beyond
            </a>
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={() => { onSpawn(); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Plus size={14} /> Spawn into Combat
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────

export interface CombatLibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  homebrewMonsters: HomebrewMonster[];
  homebrewSpells: HomebrewSpell[];
  focusedCombatant: CombatantState | null;
  onSpawnMonster: (data: {
    name: string; hp: number; ac: number; speed: number;
    species: string; actions: Action[];
    abilityScores: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number };
  }) => void;
  onAssignSpell: (combatantId: string, action: Action) => void;
}

export default function CombatLibraryPanel({
  isOpen,
  onClose,
  homebrewMonsters,
  homebrewSpells,
  focusedCombatant,
  onSpawnMonster,
  onAssignSpell,
}: CombatLibraryPanelProps) {
  const [tab, setTab] = useState<'monsters' | 'spells'>('monsters');
  const [search, setSearch] = useState('');
  const [crFilter, setCrFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState(-1);
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [showHomebrew, setShowHomebrew] = useState(true);
  const [detailMonster, setDetailMonster] = useState<OfficialMonster | HomebrewMonster | null>(null);

  const officialMonsters = monstersData as OfficialMonster[];
  const officialSpells = spellsData as OfficialSpell[];

  // Monster types for filter
  const monsterTypes = useMemo(() => {
    const types = new Set(officialMonsters.map(m => m.type));
    homebrewMonsters.forEach(m => types.add(m.type));
    return ['all', ...Array.from(types).sort()];
  }, [homebrewMonsters]);

  // Spell schools for filter
  const spellSchools = useMemo(() => {
    const schools = new Set(officialSpells.map(s => s.school));
    homebrewSpells.forEach(s => schools.add(s.school));
    return ['all', ...Array.from(schools).sort()];
  }, [homebrewSpells]);

  const filteredMonsters = useMemo(() => {
    const q = search.toLowerCase();
    const all: Array<OfficialMonster | HomebrewMonster & { _isHomebrew?: boolean; _isOverride?: boolean }> = [
      ...officialMonsters.map(m => ({ ...m })),
      ...(showHomebrew ? homebrewMonsters.map(m => ({ ...m, _isHomebrew: true, _isOverride: !!m.overridesId })) : []),
    ];
    return all.filter(m => {
      if (q && !m.name.toLowerCase().includes(q) && !m.type.toLowerCase().includes(q) && !((m as any).cr?.toString() === q)) return false;
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      const n = crToNum((m as any).cr);
      if (crFilter === 'low' && n > 0.5) return false;
      if (crFilter === 'easy' && (n < 1 || n > 4)) return false;
      if (crFilter === 'med' && (n < 5 || n > 10)) return false;
      if (crFilter === 'hard' && (n < 11 || n > 16)) return false;
      if (crFilter === 'deadly' && n < 17) return false;
      return true;
    });
  }, [search, crFilter, typeFilter, showHomebrew, officialMonsters, homebrewMonsters]);

  const filteredSpells = useMemo(() => {
    const q = search.toLowerCase();
    const all: Array<OfficialSpell | HomebrewSpell & { _isHomebrew?: boolean }> = [
      ...officialSpells.map(s => ({ ...s })),
      ...(showHomebrew ? homebrewSpells.map(s => ({ ...s, _isHomebrew: true })) : []),
    ];
    return all.filter(s => {
      if (q && !s.name.toLowerCase().includes(q) && !s.school.toLowerCase().includes(q)) return false;
      if (levelFilter !== -1 && s.level !== levelFilter) return false;
      if (schoolFilter !== 'all' && s.school !== schoolFilter) return false;
      return true;
    });
  }, [search, levelFilter, schoolFilter, showHomebrew, officialSpells, homebrewSpells]);

  const handleSpellAssign = useCallback((spell: OfficialSpell | HomebrewSpell) => {
    if (!focusedCombatant) return;
    const action: Action = {
      id: `spell-${spell.id}-${Date.now()}`,
      name: spell.name,
      description: spell.description ?? '',
      type: 'Spell',
      actionType: 'Spell',
      spellLevel: spell.level,
      requiresConcentration: 'concentration' in spell ? (spell as HomebrewSpell).concentration : spell.description?.toLowerCase().includes('concentration') ?? false,
      range: spell.range,
      source: 'Item',
      damageType: ('damageType' in spell) ? (spell as HomebrewSpell).damageType : undefined,
    };
    onAssignSpell(focusedCombatant.instanceId, action);
  }, [focusedCombatant, onAssignSpell]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (click to close) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />

          {/* Slide-in panel from right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 40 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[420px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-amber-400" />
                <span className="font-bold text-sm text-slate-100">Combat Library</span>
                {focusedCombatant && (
                  <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Focus: {focusedCombatant.name}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700/60 shrink-0">
              {([
                { id: 'monsters', label: 'Monsters', icon: <Swords size={13} /> },
                { id: 'spells', label: 'Spells', icon: <Sparkles size={13} /> },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setSearch(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors
                    ${tab === t.id ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="px-3 py-2.5 border-b border-slate-700/50 shrink-0 space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={tab === 'monsters' ? 'Search monsters by name or type…' : 'Search spells by name or school…'}
                  className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100
                    placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </div>

              {/* Monster filters */}
              {tab === 'monsters' && (
                <div className="flex gap-1.5 flex-wrap">
                  <select
                    value={crFilter}
                    onChange={e => setCrFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-amber-500/60"
                  >
                    {CR_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-amber-500/60 capitalize"
                  >
                    {monsterTypes.map(t => <option key={t} value={t} className="capitalize">{t === 'all' ? 'All Types' : t}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer ml-auto">
                    <input type="checkbox" checked={showHomebrew} onChange={e => setShowHomebrew(e.target.checked)} className="accent-amber-500" />
                    <FlaskConical size={9} className="text-amber-400" /> HB
                  </label>
                </div>
              )}

              {/* Spell filters */}
              {tab === 'spells' && (
                <div className="flex gap-1.5 flex-wrap">
                  <select
                    value={levelFilter}
                    onChange={e => setLevelFilter(parseInt(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-amber-500/60"
                  >
                    {SPELL_LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <select
                    value={schoolFilter}
                    onChange={e => setSchoolFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-amber-500/60"
                  >
                    {spellSchools.map(s => <option key={s} value={s}>{s === 'all' ? 'All Schools' : s}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Results count */}
            <div className="px-3 py-1.5 text-[9px] text-slate-500 font-bold shrink-0">
              {tab === 'monsters'
                ? `${filteredMonsters.length} monster${filteredMonsters.length !== 1 ? 's' : ''}`
                : `${filteredSpells.length} spell${filteredSpells.length !== 1 ? 's' : ''}`
              }
              {tab === 'spells' && !focusedCombatant && (
                <span className="ml-2 text-amber-500/70">← Select a combatant to assign spells</span>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
              {tab === 'monsters' && (
                <>
                  {filteredMonsters.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">No monsters found</div>
                  ) : (
                    filteredMonsters.map((m, idx) => {
                      const isHb = (m as any)._isHomebrew;
                      const isOverride = (m as any)._isOverride;
                      return (
                        <MonsterRow
                          key={`${m.id}-${idx}`}
                          name={m.name}
                          type={m.type}
                          cr={(m as any).cr}
                          hp={m.hp}
                          ac={m.ac}
                          isHomebrew={isHb}
                          isOverride={isOverride}
                          onViewDetails={() => setDetailMonster(m)}
                          onSpawn={() => {
                            if (isHb) {
                              onSpawnMonster(homebrewMonsterToSpawn(m as HomebrewMonster));
                            } else {
                              onSpawnMonster(officialMonsterToSpawn(m as OfficialMonster));
                            }
                          }}
                        />
                      );
                    })
                  )}
                </>
              )}

              {tab === 'spells' && (
                <>
                  {filteredSpells.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">No spells found</div>
                  ) : (
                    filteredSpells.map((s, idx) => (
                      <SpellRow
                        key={`${s.id}-${idx}`}
                        spell={s}
                        combatant={focusedCombatant}
                        onAssign={handleSpellAssign}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Monster detail modal */}
          {detailMonster && (
            <MonsterDetailModal
              monster={detailMonster}
              onClose={() => setDetailMonster(null)}
              onSpawn={() => {
                const isHb = !!(detailMonster as any)._isHomebrew || 'abilityScores' in detailMonster;
                if (isHb) {
                  onSpawnMonster(homebrewMonsterToSpawn(detailMonster as HomebrewMonster));
                } else {
                  onSpawnMonster(officialMonsterToSpawn(detailMonster as OfficialMonster));
                }
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
