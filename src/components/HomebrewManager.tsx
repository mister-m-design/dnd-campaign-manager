'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, Swords, Sparkles, Shield, Zap, BookOpen,
  Plus, Pencil, Trash2, Download, Upload, X, Check, AlertTriangle,
  ChevronDown, ChevronRight, Copy, Search, RefreshCw
} from 'lucide-react';
import { useHomebrew } from '@/hooks/useHomebrew';
import type {
  HomebrewMonster, HomebrewSpell, HomebrewItem,
  HomebrewCondition, HomebrewAbility
} from '@/types/homebrew';
import {
  newHomebrewMonster, newHomebrewSpell, newHomebrewItem,
  newHomebrewCondition, newHomebrewAbility
} from '@/types/homebrew';
import type { Action, AbilityScores } from '@/types/index';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ABILITY_KEYS: (keyof AbilityScores)[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

const MONSTER_TYPES = [
  'aberration', 'beast', 'celestial', 'construct', 'dragon', 'elemental',
  'fey', 'fiend', 'giant', 'humanoid', 'monstrosity', 'ooze', 'plant', 'undead',
];

const SPELL_SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
];

const CR_VALUES = [
  '0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '30',
];

const SOURCE_TAGS = ['Homebrew', 'Custom', 'Third Party', 'Modified Official'] as const;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function abilityMod(score: number) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function crToXP(cr: string): string {
  const map: Record<string, string> = {
    '0': '0', '1/8': '25', '1/4': '50', '1/2': '100',
    '1': '200', '2': '450', '3': '700', '4': '1,100', '5': '1,800',
    '6': '2,300', '7': '2,900', '8': '3,900', '9': '5,000', '10': '5,900',
    '11': '7,200', '12': '8,400', '13': '10,000', '14': '11,500', '15': '13,000',
    '16': '15,000', '17': '18,000', '18': '20,000', '19': '22,000', '20': '25,000',
  };
  return map[cr] ?? '—';
}

// ─── UI COMPONENTS ──────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500
        focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all ${props.className || ''}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100
        focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500
        focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
    />
  );
}

function FormRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-4 ${className}`}>{children}</div>;
}

function ImagePicker({ value, onChange, label = "Image" }: { value?: string; onChange: (val: string) => void; label?: string }) {
  const [showUrlInput, setShowUrlInput] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-4">
        <div className="relative group">
          <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center bg-cover bg-center transition-all group-hover:border-amber-500/40"
               style={value ? { backgroundImage: `url(${value})` } : {}}>
            {!value && <FlaskConical size={24} className="text-slate-600" />}
          </div>
          {value && (
            <button
              onClick={() => onChange('')}
              className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <X size={10} />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-2">
          {!showUrlInput ? (
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 border-dashed hover:border-amber-500/60 cursor-pointer transition-colors group">
                <Upload size={14} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                <span className="text-xs text-slate-400 group-hover:text-amber-300 transition-colors">Upload File</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => onChange(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              <button
                onClick={() => setShowUrlInput(true)}
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 transition-all"
                title="Paste URL"
              >
                <Copy size={14} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Paste image URL here..."
                value={value?.startsWith('data:') ? '' : value}
                onChange={e => onChange(e.target.value)}
                autoFocus
              />
              <button
                onClick={() => setShowUrlInput(false)}
                className="px-3 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all text-xs font-semibold"
              >
                Done
              </button>
            </div>
          )}
          <p className="text-[10px] text-slate-500">Supports PNG, JPG, WebP or direct URLs.</p>
        </div>
      </div>
    </div>
  );
}

function WarningBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-amber-900/20 border border-amber-700/40 rounded-lg p-3 text-xs text-amber-300">
      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── ABILITY SCORE GRID ───────────────────────────────────────────────────────

// Roll 4d6 drop lowest
function roll4d6DropLowest(): number {
  const rolls = [1,2,3,4].map(() => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3]; // drop lowest
}

function rollAllStats(): AbilityScores {
  return { STR: roll4d6DropLowest(), DEX: roll4d6DropLowest(), CON: roll4d6DropLowest(), INT: roll4d6DropLowest(), WIS: roll4d6DropLowest(), CHA: roll4d6DropLowest() };
}

function standardArray(): AbilityScores {
  // D&D standard array: 15, 14, 13, 12, 10, 8 — shuffled for variety
  const arr = [15, 14, 13, 12, 10, 8];
  const shuffled = arr.sort(() => Math.random() - 0.5);
  return { STR: shuffled[0], DEX: shuffled[1], CON: shuffled[2], INT: shuffled[3], WIS: shuffled[4], CHA: shuffled[5] };
}

function AbilityScoreGrid({
  scores, onChange,
}: {
  scores: AbilityScores;
  onChange: (scores: AbilityScores) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => onChange(rollAllStats())}
          title="Roll 4d6 drop lowest for each stat"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-600/30 transition-colors"
        >
          <RefreshCw size={11} /> Roll Stats (4d6 drop lowest)
        </button>
        <button
          onClick={() => onChange(standardArray())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-600 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
        >
          Standard Array
        </button>
        <button
          onClick={() => onChange({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 })}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-500 text-xs hover:text-slate-300 transition-colors"
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {ABILITY_KEYS.map(key => {
          const score = scores?.[key] ?? 10;
          return (
            <div key={key} className="text-center">
              <div className="text-xs text-slate-400 font-bold mb-1">{key}</div>
              <input
                type="number"
                min={1}
                max={30}
                value={score}
                onChange={e => onChange({ 
                  ...(scores ?? { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }), 
                  [key]: parseInt(e.target.value) || 10 
                })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg text-center text-sm text-slate-100 py-1.5
                  focus:outline-none focus:border-amber-500 transition-colors"
              />
              <div className={`text-xs mt-1 font-bold ${score >= 16 ? 'text-amber-400' : score >= 13 ? 'text-green-400' : score <= 8 ? 'text-red-400' : 'text-slate-400'}`}>
                {abilityMod(score)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ACTION EDITOR (inline) ───────────────────────────────────────────────────

function ActionEditor({
  actions,
  onChange,
}: {
  actions: Action[];
  onChange: (actions: Action[]) => void;
}) {
  const addAction = () => {
    onChange([...actions, {
      id: `action-${Date.now()}`,
      name: 'New Action',
      description: '',
      type: 'Action',
      actionType: 'Attack',
      attackType: 'Melee',
      toHitBonus: 0,
      damageDice: '1d6',
      damageModifier: 0,
      damageType: 'bludgeoning',
    }]);
  };

  const updateAction = (idx: number, field: string, value: any) => {
    onChange(actions.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const removeAction = (idx: number) => {
    onChange(actions.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {actions.map((action, idx) => (
        <div key={action.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={action.name}
                onChange={e => updateAction(idx, 'name', e.target.value)}
                placeholder="Action name"
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <select
                value={action.type}
                onChange={e => updateAction(idx, 'type', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {['Action', 'Bonus Action', 'Reaction', 'Passive', 'Ability', 'Spell'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => removeAction(idx)}
              className="text-slate-500 hover:text-red-400 transition-colors p-1"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500 block mb-0.5">To Hit</label>
              <input
                type="number"
                value={action.toHitBonus ?? 0}
                onChange={e => updateAction(idx, 'toHitBonus', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-0.5">Damage Dice</label>
              <input
                type="text"
                value={action.damageDice ?? ''}
                onChange={e => updateAction(idx, 'damageDice', e.target.value)}
                placeholder="1d6"
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-0.5">Dmg Type</label>
              <input
                type="text"
                value={action.damageType ?? ''}
                onChange={e => updateAction(idx, 'damageType', e.target.value)}
                placeholder="slashing"
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <input
            type="text"
            value={action.description}
            onChange={e => updateAction(idx, 'description', e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>
      ))}
      <button
        onClick={addAction}
        className="w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-600
          hover:border-amber-500/60 text-slate-500 hover:text-amber-400 rounded-lg py-2 text-xs transition-colors"
      >
        <Plus size={13} /> Add Action
      </button>
    </div>
  );
}

// ─── MONSTER CARD (list view) ─────────────────────────────────────────────────

function MonsterCard({
  monster,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  monster: HomebrewMonster;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-slate-800/60 border border-slate-700 hover:border-slate-600 rounded-xl p-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Portrait thumbnail */}
        {monster.imageUrl && (
          <div className="size-12 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
            <img src={monster.imageUrl} alt={monster.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-100">{monster.name}</span>
            <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-700/40 px-1.5 py-0.5 rounded">
              CR {monster.cr}
            </span>
            <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded capitalize">
              {monster.type}
            </span>
            {monster.source !== 'Homebrew' && (
              <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-700/40 px-1.5 py-0.5 rounded">
                {monster.source}
              </span>
            )}
            {monster.overridesId && (
              <span className="text-xs bg-purple-900/40 text-purple-300 border border-purple-700/40 px-1.5 py-0.5 rounded">
                Override
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
            <span>HP {monster.hp}</span>
            <span>AC {monster.ac}</span>
            <span>Spd {monster.speed}ft</span>
            <span>{monster.size}</span>
            {monster.actions.length > 0 && <span>{monster.actions.length} actions</span>}
          </div>
          <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
            {ABILITY_KEYS.map(k => {
              const score = monster.abilityScores?.[k] ?? 10;
              return (
                <span key={k}>{k} {score} ({abilityMod(score)})</span>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onDuplicate} title="Duplicate" className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors">
            <Copy size={14} />
          </button>
          <button onClick={onEdit} title="Edit" className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} title="Delete" className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── MONSTER EDITOR ───────────────────────────────────────────────────────────

function MonsterEditor({
  monster,
  onSave,
  onCancel,
}: {
  monster: HomebrewMonster;
  onSave: (m: HomebrewMonster) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<HomebrewMonster>({ ...monster });
  const set = (field: string, value: any) => setDraft(prev => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Swords size={18} className="text-amber-400" />
            <span className="font-bold text-slate-100">
              {monster.name === 'New Monster' ? 'Create Monster' : `Edit: ${monster.name}`}
            </span>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {draft.overridesId && (
            <WarningBanner message={`This entry overrides official content (id: ${draft.overridesId}). Your homebrew version will be used in place of the original.`} />
          )}

          {/* Identity */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Identity</h3>
            <ImagePicker 
              value={draft.imageUrl} 
              onChange={val => set('imageUrl', val)} 
              label="Monster Portrait / Token" 
            />
            <FormRow className="grid-cols-2 mt-4">
              <div>
                <Label>Name</Label>
                <Input value={draft.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <Label>Source Tag</Label>
                <Select value={draft.source} onChange={e => set('source', e.target.value)}>
                  {SOURCE_TAGS.map(t => <option key={t}>{t}</option>)}
                </Select>
              </div>
            </FormRow>
            <FormRow className="grid-cols-4 mt-3">
              <div>
                <Label>Type</Label>
                <Select value={draft.type} onChange={e => set('type', e.target.value)}>
                  {MONSTER_TYPES.map(t => <option key={t}>{t}</option>)}
                </Select>
              </div>
              <div>
                <Label>Size</Label>
                <Select value={draft.size} onChange={e => set('size', e.target.value)}>
                  {['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'].map(s => <option key={s}>{s}</option>)}
                </Select>
              </div>
              <div>
                <Label>CR</Label>
                <Select value={draft.cr} onChange={e => set('cr', e.target.value)}>
                  {CR_VALUES.map(cr => <option key={cr} value={cr}>CR {cr} ({crToXP(cr)} XP)</option>)}
                </Select>
              </div>
              <div>
                <Label>Alignment</Label>
                <Input value={draft.alignment ?? ''} onChange={e => set('alignment', e.target.value)} placeholder="neutral evil" />
              </div>
            </FormRow>
          </section>

          {/* Core Stats */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Core Stats</h3>
            <FormRow className="grid-cols-3">
              <div>
                <Label>HP</Label>
                <Input type="number" value={draft.hp} onChange={e => set('hp', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <Label>HP Dice</Label>
                <Input value={draft.hpDice ?? ''} placeholder="2d8+4" onChange={e => set('hpDice', e.target.value)} />
              </div>
              <div>
                <Label>AC</Label>
                <Input type="number" value={draft.ac} onChange={e => set('ac', parseInt(e.target.value) || 10)} />
              </div>
            </FormRow>
            <FormRow className="grid-cols-4 mt-3">
              <div>
                <Label>Speed (ft)</Label>
                <Input type="number" value={draft.speed} onChange={e => set('speed', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Fly (ft)</Label>
                <Input type="number" value={draft.flySpeed ?? ''} placeholder="—" onChange={e => set('flySpeed', parseInt(e.target.value) || undefined)} />
              </div>
              <div>
                <Label>Swim (ft)</Label>
                <Input type="number" value={draft.swimSpeed ?? ''} placeholder="—" onChange={e => set('swimSpeed', parseInt(e.target.value) || undefined)} />
              </div>
              <div>
                <Label>Climb (ft)</Label>
                <Input type="number" value={draft.climbSpeed ?? ''} placeholder="—" onChange={e => set('climbSpeed', parseInt(e.target.value) || undefined)} />
              </div>
            </FormRow>
          </section>

          {/* Ability Scores */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ability Scores</h3>
            <AbilityScoreGrid
              scores={draft.abilityScores}
              onChange={scores => set('abilityScores', scores)}
            />
          </section>

          {/* Defenses */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Defenses & Traits</h3>
            <FormRow className="grid-cols-1">
              <div>
                <Label>Damage Resistances</Label>
                <Input
                  value={(draft.damageResistances ?? []).join(', ')}
                  onChange={e => set('damageResistances', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="fire, cold, bludgeoning"
                />
              </div>
            </FormRow>
            <FormRow className="grid-cols-1 mt-3">
              <div>
                <Label>Damage Immunities</Label>
                <Input
                  value={(draft.damageImmunities ?? []).join(', ')}
                  onChange={e => set('damageImmunities', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="poison, necrotic"
                />
              </div>
            </FormRow>
            <FormRow className="grid-cols-2 mt-3">
              <div>
                <Label>Senses</Label>
                <Input value={draft.senses ?? ''} onChange={e => set('senses', e.target.value)} placeholder="darkvision 60 ft., passive Perception 12" />
              </div>
              <div>
                <Label>Languages</Label>
                <Input value={draft.languages ?? ''} onChange={e => set('languages', e.target.value)} placeholder="Common, Goblin" />
              </div>
            </FormRow>
          </section>

          {/* Actions */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Actions</h3>
            <ActionEditor actions={draft.actions} onChange={a => set('actions', a)} />
          </section>

          {/* Traits & Special Abilities */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Traits & Special Abilities</h3>
            <div className="space-y-2">
              {(draft.traits || []).map((trait, i) => (
                <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={trait.name}
                      onChange={e => {
                        const traits = [...(draft.traits || [])];
                        traits[i] = { ...traits[i], name: e.target.value };
                        set('traits', traits);
                      }}
                      placeholder="Trait name (e.g. Pack Tactics)"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                    <button onClick={() => set('traits', (draft.traits || []).filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 p-1"><X size={12} /></button>
                  </div>
                  <textarea
                    value={trait.description}
                    onChange={e => {
                      const traits = [...(draft.traits || [])];
                      traits[i] = { ...traits[i], description: e.target.value };
                      set('traits', traits);
                    }}
                    placeholder="Description…"
                    rows={2}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              ))}
              <button
                onClick={() => set('traits', [...(draft.traits || []), { name: '', description: '' }])}
                className="w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-600 hover:border-amber-500/60 text-slate-500 hover:text-amber-400 rounded-lg py-2 text-xs transition-colors"
              >
                <Plus size={12} /> Add Trait / Special Ability
              </button>
            </div>
          </section>

          {/* Description & Notes */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Description & Notes</h3>
            <div className="space-y-3">
              <div>
                <Label>Lore / Description</Label>
                <Textarea value={draft.description ?? ''} onChange={e => set('description', e.target.value)} rows={3} placeholder="Background and flavor text…" />
              </div>
              <div>
                <Label>DM Notes (private)</Label>
                <Textarea value={draft.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Private notes visible only to you…" />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Check size={15} /> Save Monster
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── SPELL EDITOR ─────────────────────────────────────────────────────────────

function SpellEditor({ spell, onSave, onCancel }: { spell: HomebrewSpell; onSave: (s: HomebrewSpell) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<HomebrewSpell>({ ...spell });
  const set = (field: string, value: any) => setDraft(prev => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <span className="font-bold text-slate-100">{spell.name === 'New Spell' ? 'Create Spell' : `Edit: ${spell.name}`}</span>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <FormRow className="grid-cols-2">
            <div><Label>Spell Name</Label><Input value={draft.name} onChange={e => set('name', e.target.value)} /></div>
            <div><Label>Source</Label>
              <Select value={draft.source} onChange={e => set('source', e.target.value)}>
                {SOURCE_TAGS.map(t => <option key={t}>{t}</option>)}
              </Select>
            </div>
          </FormRow>
          <ImagePicker value={draft.imageUrl} onChange={val => set('imageUrl', val)} label="Spell Icon / Art" />
          <FormRow className="grid-cols-3">
            <div>
              <Label>Level</Label>
              <Select value={draft.level} onChange={e => set('level', parseInt(e.target.value))}>
                <option value={0}>Cantrip</option>
                {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{l}{l === 1 ? 'st' : l === 2 ? 'nd' : l === 3 ? 'rd' : 'th'} Level</option>)}
              </Select>
            </div>
            <div>
              <Label>School</Label>
              <Select value={draft.school} onChange={e => set('school', e.target.value)}>
                {SPELL_SCHOOLS.map(s => <option key={s}>{s}</option>)}
              </Select>
            </div>
            <div>
              <Label>Casting Time</Label>
              <Input value={draft.castingTime} onChange={e => set('castingTime', e.target.value)} placeholder="1 action" />
            </div>
          </FormRow>
          <FormRow className="grid-cols-3">
            <div><Label>Range</Label><Input value={draft.range} onChange={e => set('range', e.target.value)} placeholder="60 feet" /></div>
            <div><Label>Components</Label><Input value={draft.components} onChange={e => set('components', e.target.value)} placeholder="V, S" /></div>
            <div><Label>Duration</Label><Input value={draft.duration} onChange={e => set('duration', e.target.value)} placeholder="Instantaneous" /></div>
          </FormRow>
          <FormRow className="grid-cols-4">
            <div><Label>Damage Dice</Label><Input value={draft.damageDice ?? ''} onChange={e => set('damageDice', e.target.value)} placeholder="2d6" /></div>
            <div><Label>Damage Type</Label><Input value={draft.damageType ?? ''} onChange={e => set('damageType', e.target.value)} placeholder="fire" /></div>
            <div><Label>Save</Label><Input value={draft.savingThrow ?? ''} onChange={e => set('savingThrow', e.target.value)} placeholder="DEX" /></div>
            <div className="flex flex-col gap-2">
              <Label>Flags</Label>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={draft.concentration} onChange={e => set('concentration', e.target.checked)}
                    className="accent-amber-500" />
                  Concentration
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={draft.ritual} onChange={e => set('ritual', e.target.checked)}
                    className="accent-amber-500" />
                  Ritual
                </label>
              </div>
            </div>
          </FormRow>
          <div><Label>Classes</Label>
            <Input value={draft.classes.join(', ')} onChange={e => set('classes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Wizard, Sorcerer" />
          </div>
          <div><Label>Description</Label><Textarea value={draft.description} onChange={e => set('description', e.target.value)} rows={4} /></div>
          <div><Label>At Higher Levels</Label><Textarea value={draft.higherLevels ?? ''} onChange={e => set('higherLevels', e.target.value)} rows={2} placeholder="When you cast this spell using a slot of 2nd level or higher…" /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
          <button onClick={() => onSave(draft)} className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold">
            <Check size={15} /> Save Spell
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── ITEM EDITOR ──────────────────────────────────────────────────────────────

function ItemEditor({ item, onSave, onCancel }: { item: HomebrewItem; onSave: (i: HomebrewItem) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<HomebrewItem>({ ...item });
  const set = (field: string, value: any) => setDraft(prev => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-amber-400" />
            <span className="font-bold text-slate-100">{item.name === 'New Item' ? 'Create Item' : `Edit: ${item.name}`}</span>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <FormRow className="grid-cols-2">
            <div><Label>Name</Label><Input value={draft.name} onChange={e => set('name', e.target.value)} /></div>
            <div><Label>Source</Label>
              <Select value={draft.source} onChange={e => set('source', e.target.value)}>
                {SOURCE_TAGS.map(t => <option key={t}>{t}</option>)}
              </Select>
            </div>
          </FormRow>
          <ImagePicker value={draft.imageUrl} onChange={val => set('imageUrl', val)} label="Item Image" />
          <FormRow className="grid-cols-2">
            <div><Label>Type</Label>
              <Select value={draft.type} onChange={e => set('type', e.target.value)}>
                {['Weapon','Armor','Shield','Tool','Gear','Consumable','Wondrous','Ring','Rod','Staff','Wand','Other'].map(t => <option key={t}>{t}</option>)}
              </Select>
            </div>
            <div><Label>Rarity</Label>
              <Select value={draft.rarity} onChange={e => set('rarity', e.target.value)}>
                {['Common','Uncommon','Rare','Very Rare','Legendary','Artifact'].map(r => <option key={r}>{r}</option>)}
              </Select>
            </div>
          </FormRow>
          {(draft.type === 'Weapon') && (
            <FormRow className="grid-cols-3">
              <div><Label>Damage Dice</Label><Input value={draft.damageDice ?? ''} onChange={e => set('damageDice', e.target.value)} placeholder="1d8" /></div>
              <div><Label>Damage Type</Label><Input value={draft.damageType ?? ''} onChange={e => set('damageType', e.target.value)} placeholder="slashing" /></div>
              <div><Label>Attack Bonus</Label><Input type="number" value={draft.attackBonus ?? 0} onChange={e => set('attackBonus', parseInt(e.target.value) || 0)} /></div>
            </FormRow>
          )}
          {(draft.type === 'Armor' || draft.type === 'Shield') && (
            <FormRow className="grid-cols-3">
              <div><Label>AC Base</Label><Input type="number" value={draft.acBase ?? 12} onChange={e => set('acBase', parseInt(e.target.value) || 0)} /></div>
              <div><Label>AC Bonus</Label><Input type="number" value={draft.acBonus ?? 0} onChange={e => set('acBonus', parseInt(e.target.value) || 0)} /></div>
              <div className="flex items-center gap-2 pt-5">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={draft.stealthDisadvantage ?? false} onChange={e => set('stealthDisadvantage', e.target.checked)} className="accent-amber-500" />
                  Stealth Disadv.
                </label>
              </div>
            </FormRow>
          )}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={draft.requiresAttunement} onChange={e => set('requiresAttunement', e.target.checked)} className="accent-amber-500" />
              Requires Attunement
            </label>
          </div>
          <div><Label>Description / Properties</Label><Textarea value={draft.description} onChange={e => set('description', e.target.value)} rows={4} /></div>
          <div><Label>Notes</Label><Textarea value={draft.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
          <button onClick={() => onSave(draft)} className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold">
            <Check size={15} /> Save Item
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── SIMPLE EDITOR (Condition / Ability) ─────────────────────────────────────

function SimpleEditor<T extends HomebrewCondition | HomebrewAbility>({
  item,
  title,
  icon,
  extraFields,
  onSave,
  onCancel,
}: {
  item: T;
  title: string;
  icon: React.ReactNode;
  extraFields?: React.ReactNode;
  onSave: (i: T) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<T>({ ...item });
  const set = (field: string, value: any) => setDraft(prev => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">{icon}<span className="font-bold text-slate-100">{title}</span></div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <FormRow className="grid-cols-2">
            <div><Label>Name</Label><Input value={draft.name} onChange={e => set('name', e.target.value)} /></div>
            <div><Label>Source</Label>
              <Select value={draft.source} onChange={e => set('source', e.target.value)}>
                {SOURCE_TAGS.map(t => <option key={t}>{t}</option>)}
              </Select>
            </div>
          </FormRow>
          {extraFields}
          <div><Label>Description</Label><Textarea value={draft.description} onChange={e => set('description', e.target.value)} rows={4} /></div>
          <div><Label>Notes</Label><Textarea value={draft.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
          <button onClick={() => onSave(draft)} className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold">
            <Check size={15} /> Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── IMPORT / EXPORT PANEL ────────────────────────────────────────────────────

function ImportExportPanel({ onExport, onImport, onClose }: {
  onExport: () => string;
  onImport: (json: string, merge: boolean) => { ok: boolean; error?: string };
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [merge, setMerge] = useState(true);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const exportText = onExport();

  const handleImport = () => {
    const res = onImport(importText, merge);
    setResult(res);
    if (res.ok) setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <span className="font-bold text-slate-100">Import / Export Homebrew</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            {(['export', 'import'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize
                  ${mode === m ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                {m}
              </button>
            ))}
          </div>

          {mode === 'export' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Copy this JSON to back up or share your homebrew content.</p>
              <Textarea value={exportText} readOnly rows={10} className="font-mono text-xs" />
              <button
                onClick={() => navigator.clipboard.writeText(exportText)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
              >
                <Copy size={14} /> Copy to Clipboard
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Paste previously exported homebrew JSON below to import it.</p>
              <Textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                rows={10}
                className="font-mono text-xs"
                placeholder='{ "monsters": [...], "spells": [...], ... }'
              />
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={merge} onChange={e => setMerge(e.target.checked)} className="accent-amber-500" />
                Merge with existing (recommended) — uncheck to replace all
              </label>
              {result && (
                <div className={`text-xs px-3 py-2 rounded-lg ${result.ok ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                  {result.ok ? '✓ Import successful!' : `✗ Error: ${result.error}`}
                </div>
              )}
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <Upload size={14} /> Import
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── MAIN HOMEBREW MANAGER ────────────────────────────────────────────────────

type TabId = 'monsters' | 'spells' | 'items' | 'conditions' | 'abilities';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'monsters', label: 'Monsters', icon: <Swords size={15} /> },
  { id: 'spells', label: 'Spells', icon: <Sparkles size={15} /> },
  { id: 'items', label: 'Items', icon: <Shield size={15} /> },
  { id: 'conditions', label: 'Conditions', icon: <Zap size={15} /> },
  { id: 'abilities', label: 'Abilities', icon: <BookOpen size={15} /> },
];

export default function HomebrewManager() {
  const hb = useHomebrew();
  const [activeTab, setActiveTab] = useState<TabId>('monsters');
  const [search, setSearch] = useState('');

  // Editors
  const [editingMonster, setEditingMonster] = useState<HomebrewMonster | null>(null);
  const [editingSpell, setEditingSpell] = useState<HomebrewSpell | null>(null);
  const [editingItem, setEditingItem] = useState<HomebrewItem | null>(null);
  const [editingCondition, setEditingCondition] = useState<HomebrewCondition | null>(null);
  const [editingAbility, setEditingAbility] = useState<HomebrewAbility | null>(null);
  const [showIO, setShowIO] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const counts = {
    monsters: hb.monsters.length,
    spells: hb.spells.length,
    items: hb.items.length,
    conditions: hb.conditions.length,
    abilities: hb.abilities.length,
  };

  const q = search.toLowerCase();

  const filteredMonsters = hb.monsters.filter(m =>
    m.name.toLowerCase().includes(q) || m.type.toLowerCase().includes(q) || m.cr.includes(q)
  );
  const filteredSpells = hb.spells.filter(s =>
    s.name.toLowerCase().includes(q) || s.school.toLowerCase().includes(q)
  );
  const filteredItems = hb.items.filter(i =>
    i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q) || i.rarity.toLowerCase().includes(q)
  );
  const filteredConditions = hb.conditions.filter(c =>
    c.name.toLowerCase().includes(q)
  );
  const filteredAbilities = hb.abilities.filter(a =>
    a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Page Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <FlaskConical size={22} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Homebrew Workshop</h1>
              <p className="text-xs text-slate-400">Create & override monsters, spells, items, conditions, and abilities</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIO(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
            >
              <Download size={14} /> Import / Export
            </button>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Delete all homebrew?</span>
                <button onClick={() => { hb.clearAll(); setConfirmClear(false); }}
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold">Confirm</button>
                <button onClick={() => setConfirmClear(false)} className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="Clear All Homebrew">
                <RefreshCw size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 flex items-end gap-1 border-t border-slate-800/60 mt-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              {tab.icon}
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${activeTab === tab.id ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Search + Add Row */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}…`}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100
                placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
          </div>
          <button
            onClick={() => {
              if (activeTab === 'monsters') setEditingMonster(newHomebrewMonster());
              else if (activeTab === 'spells') setEditingSpell(newHomebrewSpell());
              else if (activeTab === 'items') setEditingItem(newHomebrewItem());
              else if (activeTab === 'conditions') setEditingCondition(newHomebrewCondition());
              else if (activeTab === 'abilities') setEditingAbility(newHomebrewAbility());
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={16} /> New {activeTab.slice(0, -1).replace(/^./, c => c.toUpperCase())}
          </button>
        </div>

        {/* ── MONSTERS ── */}
        {activeTab === 'monsters' && (
          <AnimatePresence>
            {filteredMonsters.length === 0 ? (
              <EmptyState
                icon={<Swords size={32} className="text-slate-600" />}
                title={search ? 'No monsters match your search' : 'No homebrew monsters yet'}
                subtitle={search ? 'Try a different query' : 'Create custom monsters or override official stat blocks'}
                onAdd={() => setEditingMonster(newHomebrewMonster())}
                addLabel="Create Monster"
              />
            ) : (
              <div className="space-y-3">
                {filteredMonsters.map(m => (
                  <MonsterCard
                    key={m.id}
                    monster={m}
                    onEdit={() => setEditingMonster(m)}
                    onDelete={() => hb.deleteMonster(m.id)}
                    onDuplicate={() => hb.upsertMonster({
                      ...m,
                      id: `hb-monster-${Date.now()}`,
                      name: `${m.name} (Copy)`,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    })}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        )}

        {/* ── SPELLS ── */}
        {activeTab === 'spells' && (
          <AnimatePresence>
            {filteredSpells.length === 0 ? (
              <EmptyState
                icon={<Sparkles size={32} className="text-slate-600" />}
                title={search ? 'No spells match your search' : 'No homebrew spells yet'}
                subtitle="Add custom spells with full mechanics"
                onAdd={() => setEditingSpell(newHomebrewSpell())}
                addLabel="Create Spell"
              />
            ) : (
              <div className="space-y-3">
                {filteredSpells.map(s => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-slate-800/60 border border-slate-700 hover:border-slate-600 rounded-xl p-4 group flex items-start justify-between gap-4">
                    {s.imageUrl && (
                      <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0 bg-cover bg-center"
                           style={{ backgroundImage: `url(${s.imageUrl})` }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100">{s.name}</span>
                        <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-700/40 px-1.5 py-0.5 rounded">
                          {s.level === 0 ? 'Cantrip' : `Level ${s.level}`}
                        </span>
                        <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{s.school}</span>
                        {s.concentration && <span className="text-xs bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded">Conc.</span>}
                        {s.ritual && <span className="text-xs bg-green-900/30 text-green-300 px-1.5 py-0.5 rounded">Ritual</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 space-x-3">
                        <span>{s.castingTime}</span>
                        <span>{s.range}</span>
                        <span>{s.duration}</span>
                        {s.classes.length > 0 && <span className="text-slate-500">{s.classes.join(', ')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingSpell(s)} className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => hb.deleteSpell(s.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}

        {/* ── ITEMS ── */}
        {activeTab === 'items' && (
          <AnimatePresence>
            {filteredItems.length === 0 ? (
              <EmptyState
                icon={<Shield size={32} className="text-slate-600" />}
                title={search ? 'No items match your search' : 'No homebrew items yet'}
                subtitle="Create weapons, armor, wondrous items, and more"
                onAdd={() => setEditingItem(newHomebrewItem())}
                addLabel="Create Item"
              />
            ) : (
              <div className="space-y-3">
                {filteredItems.map(item => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-slate-800/60 border border-slate-700 hover:border-slate-600 rounded-xl p-4 group flex items-start justify-between gap-4">
                    {item.imageUrl && (
                      <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0 bg-cover bg-center"
                           style={{ backgroundImage: `url(${item.imageUrl})` }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100">{item.name}</span>
                        <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{item.type}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${
                          item.rarity === 'Legendary' || item.rarity === 'Artifact' ? 'bg-amber-900/30 text-amber-300 border-amber-700/30' :
                          item.rarity === 'Very Rare' ? 'bg-purple-900/30 text-purple-300 border-purple-700/30' :
                          item.rarity === 'Rare' ? 'bg-blue-900/30 text-blue-300 border-blue-700/30' :
                          item.rarity === 'Uncommon' ? 'bg-green-900/30 text-green-300 border-green-700/30' :
                          'bg-slate-700/50 text-slate-400 border-slate-600'
                        }`}>{item.rarity}</span>
                        {item.requiresAttunement && <span className="text-xs text-amber-400">Requires Attunement</span>}
                      </div>
                      {item.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingItem(item)} className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => hb.deleteItem(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}

        {/* ── CONDITIONS ── */}
        {activeTab === 'conditions' && (
          <AnimatePresence>
            {filteredConditions.length === 0 ? (
              <EmptyState
                icon={<Zap size={32} className="text-slate-600" />}
                title={search ? 'No conditions match your search' : 'No homebrew conditions yet'}
                subtitle="Define custom status effects for your campaign"
                onAdd={() => setEditingCondition(newHomebrewCondition())}
                addLabel="Create Condition"
              />
            ) : (
              <div className="space-y-3">
                {filteredConditions.map(c => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-slate-800/60 border border-slate-700 hover:border-slate-600 rounded-xl p-4 group flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{c.name}</span>
                        <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{c.source}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingCondition(c)} className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => hb.deleteCondition(c.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}

        {/* ── ABILITIES ── */}
        {activeTab === 'abilities' && (
          <AnimatePresence>
            {filteredAbilities.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={32} className="text-slate-600" />}
                title={search ? 'No abilities match your search' : 'No homebrew abilities yet'}
                subtitle="Create custom feats, class features, and racial traits"
                onAdd={() => setEditingAbility(newHomebrewAbility())}
                addLabel="Create Ability"
              />
            ) : (
              <div className="space-y-3">
                {filteredAbilities.map(a => (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-slate-800/60 border border-slate-700 hover:border-slate-600 rounded-xl p-4 group flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100">{a.name}</span>
                        <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{a.type}</span>
                        {a.prerequisite && <span className="text-xs text-slate-500">Req: {a.prerequisite}</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingAbility(a)} className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => hb.deleteAbility(a.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── EDITORS ── */}
      <AnimatePresence>
        {editingMonster && (
          <MonsterEditor
            monster={editingMonster}
            onSave={m => { hb.upsertMonster(m); setEditingMonster(null); }}
            onCancel={() => setEditingMonster(null)}
          />
        )}
        {editingSpell && (
          <SpellEditor
            spell={editingSpell}
            onSave={s => { hb.upsertSpell(s); setEditingSpell(null); }}
            onCancel={() => setEditingSpell(null)}
          />
        )}
        {editingItem && (
          <ItemEditor
            item={editingItem}
            onSave={i => { hb.upsertItem(i); setEditingItem(null); }}
            onCancel={() => setEditingItem(null)}
          />
        )}
        {editingCondition && (
          <SimpleEditor
            item={editingCondition}
            title="Edit Condition"
            icon={<Zap size={18} className="text-amber-400" />}
            onSave={c => { hb.upsertCondition(c as HomebrewCondition); setEditingCondition(null); }}
            onCancel={() => setEditingCondition(null)}
          />
        )}
        {editingAbility && (
          <SimpleEditor
            item={editingAbility}
            title="Edit Ability"
            icon={<BookOpen size={18} className="text-amber-400" />}
            extraFields={
              <FormRow className="grid-cols-2">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={editingAbility.type}
                    onChange={e => setEditingAbility(prev => prev ? { ...prev, type: e.target.value as any } : prev)}
                  >
                    {['Feat', 'Class Feature', 'Species Trait', 'Background Feature', 'General'].map(t => <option key={t}>{t}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Prerequisite</Label>
                  <Input
                    value={editingAbility.prerequisite ?? ''}
                    onChange={e => setEditingAbility(prev => prev ? { ...prev, prerequisite: e.target.value } : prev)}
                    placeholder="e.g. STR 13 or higher"
                  />
                </div>
              </FormRow>
            }
            onSave={a => { hb.upsertAbility(a as HomebrewAbility); setEditingAbility(null); }}
            onCancel={() => setEditingAbility(null)}
          />
        )}
        {showIO && (
          <ImportExportPanel
            onExport={hb.exportStore}
            onImport={hb.importStore}
            onClose={() => setShowIO(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({
  icon, title, subtitle, onAdd, addLabel,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      {icon}
      <div>
        <p className="text-slate-300 font-medium">{title}</p>
        <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors mt-2"
      >
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  );
}
