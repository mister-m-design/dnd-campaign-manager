
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CombatantState, Action, CombatMode } from '@/types';
import { RulesEngine } from '@/engines/RulesEngine';
import { Target, Zap, Shield, Heart, ChevronRight, ChevronDown, X, Dices, Minus, Plus } from 'lucide-react';


// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RollStep =
  | 'TARGET_SELECT'
  | 'ATTACK_ROLL'
  | 'ATTACK_RESULT'
  | 'SAVE_PROMPT'
  | 'SAVE_RESULT'
  | 'DAMAGE_ROLL'
  | 'DAMAGE_RESULT'
  | 'HEAL_ROLL'
  | 'HEAL_RESULT'
  | 'CHECK_ROLL'
  | 'CHECK_RESULT'
  | 'DONE';

export interface ActionResolution {
  attacker: CombatantState;
  target?: CombatantState;
  action: Action;
  hit: boolean;
  isCrit: boolean;
  damage?: number;
  damageType?: string;
  healing?: number;
  saveRoll?: number;
  savePassed?: boolean;
  log: string;
}

interface BonusGroup {
  id: string;
  qty: number;
  sides: number;
  label?: string; // e.g. "Bless", "Bardic"
}

interface BonusRollGroup {
  id: string;
  sides: number;
  rolls: number[];
  label?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: ActionResolution) => void;
  attacker: CombatantState;
  action: Action;
  initialTarget: CombatantState | null;
  availableTargets: CombatantState[];
  combatMode: CombatMode;
  onStepChange?: (step: RollStep, formula: string | null, label: string | null) => void;
  confirmedRoll?: { value: number; id: string } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function parseDice(formula: string): { count: number; sides: number; mod: number } {
  const m = formula.match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!m) return { count: 1, sides: 6, mod: 0 };
  return { count: parseInt(m[1]), sides: parseInt(m[2]), mod: parseInt(m[3] || '0') };
}

function rollDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
}

function rollFormula(formula: string, doubled = false): { rolls: number[]; mod: number; total: number } {
  const { count, sides, mod } = parseDice(formula);
  const actualCount = doubled ? count * 2 : count;
  const rolls = rollDice(actualCount, sides);
  const total = rolls.reduce((a, b) => a + b, 0) + mod;
  return { rolls, mod, total };
}

function getSaveBonus(target: CombatantState, saveType: string): number {
  const scores = target.abilityScores;
  const map: Record<string, number> = {
    STR: scores.STR, DEX: scores.DEX, CON: scores.CON,
    INT: scores.INT, WIS: scores.WIS, CHA: scores.CHA,
  };
  const score = map[saveType] ?? 10;
  return Math.floor((score - 10) / 2);
}

function getAttackBonus(action: Action): number {
  return action.attackBonus ?? action.toHitBonus ?? 0;
}

function calculateDistance(p1: { x: number; y: number } | undefined, p2: { x: number; y: number } | undefined): number {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.round((Math.sqrt(dx * dx + dy * dy) / 50) * 5);
}

function getRangeValue(range?: string): number {
  if (!range || range.toLowerCase() === 'self' || range.toLowerCase() === 'touch') return 5;
  const m = range.match(/(\d+)/);
  return m ? parseInt(m[1]) : 5;
}

/**
 * Derive the initial advantage/disadvantage mode from the attacker's conditions
 * and optional target's conditions. Per 5e: if both apply they cancel → 'normal'.
 */
function deriveInitialAdvMode(
  attacker: CombatantState,
  target?: CombatantState | null,
): 'normal' | 'advantage' | 'disadvantage' {
  const ac = attacker.conditions ?? [];
  const attackerAdv = attacker.forceAdvantage === true || ac.includes('Advantage') || ac.includes('Hidden') || ac.includes('Invisible');
  const attackerDis = attacker.forceDisadvantage === true || ac.includes('Disadvantage') || ac.includes('Blinded') || ac.includes('Frightened') || ac.includes('Poisoned') || ac.includes('Restrained');
  const tc = target?.conditions ?? [];
  const targetGivesAdv = tc.includes('Blinded') || tc.includes('Paralyzed') || tc.includes('Unconscious') || tc.includes('Restrained') || tc.includes('Stunned') || tc.includes('Prone');
  const targetGivesDis = tc.includes('Dodge');
  const hasAdv = attackerAdv || targetGivesAdv;
  const hasDis = attackerDis || targetGivesDis;
  if (hasAdv && hasDis) return 'normal';
  if (hasAdv) return 'advantage';
  if (hasDis) return 'disadvantage';
  return 'normal';
}

/**
 * Auto-detect bonus dice groups that should be pre-added from active conditions.
 * Returns groups with labels so the reason text explains them.
 */
function deriveAutoBonusGroups(
  attacker: CombatantState,
  step: RollStep,
): BonusGroup[] {
  const groups: BonusGroup[] = [];
  const ac = attacker.conditions ?? [];
  if ((step === 'ATTACK_ROLL' || step === 'SAVE_PROMPT') && ac.includes('Blessed')) {
    groups.push({ id: 'blessed-bonus', qty: 1, sides: 4, label: 'Bless' });
  }
  if (step === 'DAMAGE_ROLL' && ac.includes('HuntersMarked')) {
    groups.push({ id: 'hunters-mark', qty: 1, sides: 6, label: "Hunter's Mark" });
  }
  return groups;
}

/**
 * Produce human-readable reasons explaining the pre-selected configuration.
 * Only returns text for things that actually apply.
 */
function deriveRollReasons(
  attacker: CombatantState,
  step: RollStep,
  advMode: 'normal' | 'advantage' | 'disadvantage',
  target: CombatantState | null,
  bonusPool: BonusGroup[],
): string[] {
  const reasons: string[] = [];
  const ac = attacker.conditions ?? [];
  const tc = target?.conditions ?? [];
  const tName = target?.name ?? 'target';

  const isRollStep = step === 'ATTACK_ROLL' || step === 'SAVE_PROMPT';
  const isDamageStep = step === 'DAMAGE_ROLL' || step === 'HEAL_ROLL';

  if (isRollStep) {
    // Check for adv/dis reasons
    const attackerAdv = attacker.forceAdvantage || ac.includes('Advantage') || ac.includes('Hidden') || ac.includes('Invisible');
    const attackerDis = attacker.forceDisadvantage || ac.includes('Disadvantage') || ac.includes('Blinded') || ac.includes('Frightened') || ac.includes('Poisoned') || ac.includes('Restrained');
    const targetAdv = tc.includes('Blinded') || tc.includes('Paralyzed') || tc.includes('Unconscious') || tc.includes('Restrained') || tc.includes('Stunned') || tc.includes('Prone');
    const targetDis = tc.includes('Dodge');
    const hasAdv = attackerAdv || targetAdv;
    const hasDis = attackerDis || targetDis;

    if (hasAdv && hasDis) {
      reasons.push('Advantage and disadvantage cancel out — rolling normally.');
    } else if (advMode === 'advantage') {
      if (attacker.forceAdvantage) reasons.push('Rolling with advantage (DM granted).');
      else if (ac.includes('Hidden')) reasons.push('Rolling with advantage — you are Hidden.');
      else if (ac.includes('Invisible')) reasons.push('Rolling with advantage — you are Invisible.');
      else if (ac.includes('Advantage')) reasons.push('Rolling with advantage from the Advantage condition.');
      else if (tc.includes('Unconscious')) reasons.push(`Rolling with advantage — ${tName} is Unconscious.`);
      else if (tc.includes('Paralyzed')) reasons.push(`Rolling with advantage — ${tName} is Paralyzed.`);
      else if (tc.includes('Stunned')) reasons.push(`Rolling with advantage — ${tName} is Stunned.`);
      else if (tc.includes('Blinded')) reasons.push(`Rolling with advantage — ${tName} is Blinded.`);
      else if (tc.includes('Prone')) reasons.push(`Rolling with advantage — ${tName} is Prone (melee).`);
      else if (tc.includes('Restrained')) reasons.push(`Rolling with advantage — ${tName} is Restrained.`);
    } else if (advMode === 'disadvantage') {
      if (attacker.forceDisadvantage) reasons.push('Rolling with disadvantage (DM imposed).');
      else if (ac.includes('Blinded')) reasons.push('Rolling with disadvantage — you are Blinded.');
      else if (ac.includes('Poisoned')) reasons.push('Rolling with disadvantage — you are Poisoned.');
      else if (ac.includes('Frightened')) reasons.push('Rolling with disadvantage — you are Frightened.');
      else if (ac.includes('Restrained')) reasons.push('Rolling with disadvantage — you are Restrained.');
      else if (ac.includes('Disadvantage')) reasons.push('Rolling with disadvantage from the Disadvantage condition.');
      else if (tc.includes('Dodge')) reasons.push(`Rolling with disadvantage — ${tName} took the Dodge action.`);
    }
  }

  // Bonus dice reasons
  for (const group of bonusPool) {
    if (group.label === 'Bless') reasons.push('Adding 1d4 because Bless is active.');
    else if (group.label === "Hunter's Mark") reasons.push("Adding 1d6 because Hunter's Mark is active.");
    else if (group.label) reasons.push(`Adding ${group.qty}d${group.sides} (${group.label}).`);
  }

  // Rage damage bonus note (can't be represented as dice)
  if (isDamageStep && ac.includes('Rage')) {
    reasons.push('Raging — remember to add your Rage damage bonus.');
  }

  return reasons;
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE DICE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const DIE_SIZES = [4, 6, 8, 10, 12, 20];

const DIE_SVG_SHAPES: Record<number, React.ReactNode> = {
  4:  <polygon points="12,2 22,20 2,20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  6:  <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />,
  8:  <polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  10: <polygon points="12,2 22,9 18,21 6,21 2,9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  12: <polygon points="12,2 20,6 22,15 17,21 7,21 2,15 4,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  20: <polygon points="12,2 21,8 21,16 12,22 3,16 3,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
};

function DieSvg({ sides, className }: { sides: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'}>
      {DIE_SVG_SHAPES[sides] ?? <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function StepHeader({ step, action }: { step: RollStep; action: Action }) {
  const labels: Partial<Record<RollStep, { icon: React.ReactNode; label: string; color: string }>> = {
    TARGET_SELECT: { icon: <Target className="w-5 h-5" />, label: 'Select Target', color: 'text-sky-400' },
    ATTACK_ROLL:   { icon: <Dices className="w-5 h-5" />, label: 'Attack Roll', color: 'text-amber-400' },
    ATTACK_RESULT: { icon: <Zap className="w-5 h-5" />, label: 'Roll Result', color: 'text-amber-400' },
    SAVE_PROMPT:   { icon: <Shield className="w-5 h-5" />, label: 'Saving Throw', color: 'text-violet-400' },
    SAVE_RESULT:   { icon: <Shield className="w-5 h-5" />, label: 'Save Result', color: 'text-violet-400' },
    DAMAGE_ROLL:   { icon: <Zap className="w-5 h-5" />, label: 'Damage Roll', color: 'text-red-400' },
    DAMAGE_RESULT: { icon: <Zap className="w-5 h-5" />, label: 'Damage Applied', color: 'text-red-400' },
    HEAL_ROLL:     { icon: <Heart className="w-5 h-5" />, label: 'Healing Roll', color: 'text-emerald-400' },
    HEAL_RESULT:   { icon: <Heart className="w-5 h-5" />, label: 'Healing Applied', color: 'text-emerald-400' },
    DONE:          { icon: <ChevronRight className="w-5 h-5" />, label: 'Complete', color: 'text-slate-400' },
  };
  const info = labels[step] ?? { icon: <Dices className="w-5 h-5" />, label: step, color: 'text-slate-400' };
  return (
    <div className="flex items-center gap-3 mb-1">
      <span className={info.color}>{info.icon}</span>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{action.name}</p>
        <p className={`text-[14px] font-black uppercase tracking-wide ${info.color}`}>{info.label}</p>
      </div>
    </div>
  );
}

function FormulaTag({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${highlight ? 'bg-amber-500/15 border-amber-500/30' : 'bg-white/5 border-white/8'}`}>
      <span className="text-[7px] font-black uppercase tracking-widest text-slate-600">{label}</span>
      <span className={`text-[13px] font-black tabular-nums ${highlight ? 'text-amber-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function ResultBanner({ type, title, subtitle }: { type: 'hit' | 'crit' | 'miss' | 'success' | 'fail' | 'half'; title: string; subtitle?: string }) {
  const styles = {
    hit:     'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    crit:    'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse',
    miss:    'bg-red-500/10 border-red-500/30 text-red-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    fail:    'bg-red-500/10 border-red-500/30 text-red-400',
    half:    'bg-amber-500/10 border-amber-500/30 text-amber-400',
  };
  return (
    <div className={`px-5 py-4 rounded-2xl border text-center ${styles[type]}`}>
      <p className="text-[22px] font-black uppercase tracking-tight">{title}</p>
      {subtitle && <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-1">{subtitle}</p>}
    </div>
  );
}

function ManualEntryFallback({ formula, modifier, onEnter }: { formula: string; modifier?: string; onEnter: (val: number) => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="border-t border-white/5 pt-3 space-y-2">
      <p className="text-[7px] font-black uppercase tracking-widest text-slate-700">Or enter total manually</p>
      <div className="flex gap-2">
        <input
          type="number"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && val) onEnter(parseInt(val)); }}
          placeholder={`${formula}${modifier ? ` ${modifier}` : ''}`}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[16px] font-black text-white text-center placeholder:text-slate-800 outline-none focus:border-white/20 tabular-nums"
        />
        {val && (
          <button onClick={() => onEnter(parseInt(val))} className="px-4 rounded-xl bg-white/10 border border-white/15 text-slate-300 text-[9px] font-black uppercase tracking-widest hover:bg-white/15 transition-all">
            OK
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK-ADD BONUS PRESETS
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_BONUS: Array<{ qty: number; sides: number; label: string; tip: string }> = [
  { qty: 1, sides: 4,  label: '+d4',  tip: 'Bless / Guidance' },
  { qty: 1, sides: 6,  label: '+d6',  tip: 'Bardic / Hex' },
  { qty: 2, sides: 6,  label: '+2d6', tip: 'Sneak Atk' },
  { qty: 1, sides: 8,  label: '+d8',  tip: 'Smite' },
  { qty: 2, sides: 8,  label: '+2d8', tip: 'Smite+' },
  { qty: 1, sides: 10, label: '+d10', tip: 'Insp.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────

export default function CombatActionModal({
  isOpen, onClose, onComplete,
  attacker, action, initialTarget, availableTargets, combatMode,
  onStepChange, confirmedRoll,
}: Props) {
  const [step, setStep] = useState<RollStep>('TARGET_SELECT');
  const [target, setTarget] = useState<CombatantState | null>(initialTarget);
  const [d20Roll, setD20Roll] = useState<number | null>(null);
  const [isCrit, setIsCrit] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const [attackRollBreakdown, setAttackRollBreakdown] = useState<string>('');
  const [damageRoll, setDamageRoll] = useState<{ rolls: number[]; mod: number; total: number } | null>(null);
  const [saveRoll, setSaveRoll] = useState<number | null>(null);
  const [savePassed, setSavePassed] = useState<boolean | null>(null);
  const [attackAdvMode, setAttackAdvMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [droppedD20, setDroppedD20] = useState<number | null>(null);

  // Base dice state
  const [modalDieSides, setModalDieSides] = useState(20);
  const [modalDieQty, setModalDieQty] = useState(1);

  // Bonus dice pool — extra dice groups on top of the base roll
  const [bonusPool, setBonusPool] = useState<BonusGroup[]>([]);
  const [showBonusSection, setShowBonusSection] = useState(false);
  const [bonusStageSides, setBonusStageSides] = useState(4);
  const [bonusStageQty, setBonusStageQty] = useState(1);
  // Per-group roll results (stored after a roll so DAMAGE_RESULT can show the breakdown)
  const [bonusRollResults, setBonusRollResults] = useState<BonusRollGroup[]>([]);

  const processedRollIdRef = useRef<string | null>(null);

  // ── Determine flow type ───────────────────────────────────────────────────
  const isSaveAction = action.attackType === 'Save' || !!action.saveDC;
  const isHealAction = action.actionType === 'Heal' || action.isHealing === true;
  const needsTarget = action.requiresTarget !== false && !action.targetSelf && !isHealAction;
  const isAutoMode = combatMode === 'AUTO_RESOLUTION' || combatMode === 'FULL_GAME';

  // ── Reset when opened ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTarget(initialTarget);
      setD20Roll(null);
      setDroppedD20(null);
      setIsCrit(false);
      setIsHit(false);
      setAttackRollBreakdown('');
      setDamageRoll(null);
      setSaveRoll(null);
      setSavePassed(null);

      const derivedAdvMode = deriveInitialAdvMode(attacker, initialTarget);
      setAttackAdvMode(derivedAdvMode);

      if (!needsTarget || initialTarget) {
        if (isHealAction) {
          if (isAutoMode) { doAutoHeal(); }
          else { setStep('HEAL_ROLL'); }
        } else if (isSaveAction) {
          if (isAutoMode) { doAutoSave(initialTarget); }
          else { setStep('SAVE_PROMPT'); }
        } else {
          if (isAutoMode) { doAutoAttack(initialTarget, derivedAdvMode); }
          else { setStep('ATTACK_ROLL'); }
        }
      } else {
        setStep('TARGET_SELECT');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTarget?.instanceId]);

  // ── Sync base dice defaults + auto bonus pool when step changes ───────────
  useEffect(() => {
    // Reset bonus dice
    setBonusRollResults([]);
    setBonusStageSides(4);
    setBonusStageQty(1);

    // Auto-populate bonus groups from attacker conditions
    const autoBonusGroups = deriveAutoBonusGroups(attacker, step);
    setBonusPool(autoBonusGroups);
    setShowBonusSection(autoBonusGroups.length > 0);

    // Set base dice defaults
    if (step === 'ATTACK_ROLL' || step === 'SAVE_PROMPT') {
      setModalDieSides(20);
      setModalDieQty(1);
    } else if (step === 'DAMAGE_ROLL') {
      const p = parseDice(action.damageDice || '1d6');
      setModalDieSides(p.sides);
      setModalDieQty(isCrit ? p.count * 2 : p.count);
    } else if (step === 'HEAL_ROLL') {
      const p = parseDice(action.healingDice || action.damageDice || '1d4');
      setModalDieSides(p.sides);
      setModalDieQty(p.count);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Broadcast step so parent can preload dice tray if needed ─────────────
  useEffect(() => {
    if (!isOpen) return;
    const ROLL_STEPS: Partial<Record<RollStep, { formula: string; label: string }>> = {
      ATTACK_ROLL: { formula: '1d20', label: 'Attack Roll' },
      SAVE_PROMPT: { formula: '1d20', label: `${action.saveType ?? 'DEX'} Save` },
      DAMAGE_ROLL: { formula: action.damageDice || '1d6', label: `${action.name} Damage` },
      HEAL_ROLL:   { formula: action.healingDice || action.damageDice || '1d4', label: 'Healing Roll' },
    };
    const info = ROLL_STEPS[step];
    onStepChange?.(step, info?.formula ?? null, info?.label ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isOpen]);

  // ── Auto-confirm when a dice-tray roll arrives ────────────────────────────
  useEffect(() => {
    if (!confirmedRoll || confirmedRoll.id === processedRollIdRef.current) return;
    processedRollIdRef.current = confirmedRoll.id;
    const val = confirmedRoll.value;
    switch (step) {
      case 'ATTACK_ROLL':  handleAttackRollEnter(val);  break;
      case 'DAMAGE_ROLL':  handleDamageRollEnter(val);  break;
      case 'SAVE_PROMPT':  handleSaveRollEnter(val);    break;
      case 'HEAL_ROLL':
        setDamageRoll({ rolls: [val], mod: 0, total: val + (action.healingModifier ?? 0) });
        setStep('HEAL_RESULT');
        break;
      default: break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmedRoll]);

  // ── Auto-roll helpers ─────────────────────────────────────────────────────
  const doAutoAttack = useCallback((tgt: CombatantState | null, advMode: 'normal' | 'advantage' | 'disadvantage' = attackAdvMode) => {
    if (!tgt) return;
    const bonus = getAttackBonus(action);
    let natural: number;
    let dropped: number | null = null;
    if (advMode === 'normal') {
      natural = Math.floor(Math.random() * 20) + 1;
    } else {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      if (advMode === 'advantage') { natural = Math.max(roll1, roll2); dropped = Math.min(roll1, roll2); }
      else                         { natural = Math.min(roll1, roll2); dropped = Math.max(roll1, roll2); }
    }
    const total = natural + bonus;
    const crit = natural === 20;
    const hit = crit || (natural !== 1 && total >= tgt.ac);
    const advLabel = advMode !== 'normal' ? ` [${advMode === 'advantage' ? 'ADV' : 'DIS'}${dropped !== null ? `, dropped ${dropped}` : ''}]` : '';
    const breakdown = `d20(${natural}) + ${bonus} = ${total} vs AC ${tgt.ac}${advLabel}`;
    setD20Roll(natural);
    setDroppedD20(dropped);
    setIsCrit(crit);
    setIsHit(hit);
    setAttackRollBreakdown(breakdown);
    setStep('ATTACK_RESULT');
    if (hit) {
      const dmg = rollFormula(action.damageDice || '1d6', crit);
      setDamageRoll(dmg);
    }
  }, [action, attackAdvMode]);

  const doAutoSave = useCallback((tgt: CombatantState | null) => {
    if (!tgt || !action.saveDC) return;
    const bonus = getSaveBonus(tgt, action.saveType || 'DEX');
    const natural = Math.floor(Math.random() * 20) + 1;
    const total = natural + bonus;
    const passed = total >= action.saveDC;
    setSaveRoll(total);
    setSavePassed(passed);
    setStep('SAVE_RESULT');
    if (!passed || action.saveEffect === 'half') {
      const dmg = rollFormula(action.damageDice || '1d6');
      setDamageRoll(dmg);
    }
  }, [action]);

  const doAutoHeal = useCallback(() => {
    const healed = rollFormula(action.healingDice || action.damageDice || '1d4');
    const total = healed.total + (action.healingModifier ?? 0);
    setDamageRoll({ ...healed, total });
    setStep('HEAL_RESULT');
  }, [action]);

  // ── Inline roll helpers ───────────────────────────────────────────────────

  /** Roll bonus pool groups, update state, return total bonus sum */
  const rollBonusPool = (): number => {
    if (bonusPool.length === 0) { setBonusRollResults([]); return 0; }
    const results: BonusRollGroup[] = bonusPool.map(g => ({
      id: g.id,
      sides: g.sides,
      label: g.label,
      rolls: Array.from({ length: g.qty }, () => Math.floor(Math.random() * g.sides) + 1),
    }));
    setBonusRollResults(results);
    return results.reduce((s, g) => s + g.rolls.reduce((a, b) => a + b, 0), 0);
  };

  const handleInlineAttackRoll = () => {
    if (!target) return;
    const bonus = getAttackBonus(action);
    const rollOne = () => Math.floor(Math.random() * modalDieSides) + 1;
    let natural: number;
    let dropped: number | null = null;
    if (attackAdvMode === 'normal') {
      const rolls = Array.from({ length: modalDieQty }, rollOne);
      natural = rolls.reduce((a, b) => a + b, 0);
    } else {
      const rollsA = Array.from({ length: modalDieQty }, rollOne);
      const rollsB = Array.from({ length: modalDieQty }, rollOne);
      const sumA = rollsA.reduce((a, b) => a + b, 0);
      const sumB = rollsB.reduce((a, b) => a + b, 0);
      if (attackAdvMode === 'advantage') { natural = Math.max(sumA, sumB); dropped = Math.min(sumA, sumB); }
      else { natural = Math.min(sumA, sumB); dropped = Math.max(sumA, sumB); }
    }
    const total = natural + bonus;
    const crit    = modalDieSides === 20 && modalDieQty === 1 && natural === 20;
    const fumble  = modalDieSides === 20 && modalDieQty === 1 && natural === 1;
    const hit     = crit || (!fumble && total >= target.ac);
    const advLabel = attackAdvMode !== 'normal' ? ` [${attackAdvMode === 'advantage' ? 'ADV' : 'DIS'}${dropped !== null ? `, dropped ${dropped}` : ''}]` : '';
    const breakdown = `d${modalDieSides}(${natural}) + ${bonus} = ${total} vs AC ${target.ac}${advLabel}`;
    setD20Roll(natural);
    setDroppedD20(dropped);
    setIsCrit(crit);
    setIsHit(hit);
    setAttackRollBreakdown(breakdown);
    setStep('ATTACK_RESULT');
    if (hit) {
      const dmg = rollFormula(action.damageDice || '1d6', crit);
      setDamageRoll(dmg);
    }
  };

  const handleInlineDamageRoll = () => {
    const baseRolls = Array.from({ length: modalDieQty }, () => Math.floor(Math.random() * modalDieSides) + 1);
    const { mod } = parseDice(action.damageDice || '1d6');
    const baseSum = baseRolls.reduce((a, b) => a + b, 0);
    const bonusSum = rollBonusPool();
    setDamageRoll({ rolls: baseRolls, mod, total: baseSum + bonusSum + mod });
    setStep('DAMAGE_RESULT');
  };

  const handleInlineSaveRoll = () => {
    if (!target || !action.saveDC) return;
    const bonus = getSaveBonus(target, action.saveType || 'DEX');
    const rolls = Array.from({ length: modalDieQty }, () => Math.floor(Math.random() * modalDieSides) + 1);
    const natural = rolls.reduce((a, b) => a + b, 0);
    const total = natural + bonus;
    const passed = total >= action.saveDC;
    setSaveRoll(total);
    setSavePassed(passed);
    setStep('SAVE_RESULT');
    if (!passed || action.saveEffect === 'half') {
      const dmg = rollFormula(action.damageDice || '1d6');
      setDamageRoll(dmg);
    }
  };

  const handleInlineHealRoll = () => {
    const baseRolls = Array.from({ length: modalDieQty }, () => Math.floor(Math.random() * modalDieSides) + 1);
    const baseSum = baseRolls.reduce((a, b) => a + b, 0);
    const bonusSum = rollBonusPool();
    const total = baseSum + bonusSum + (action.healingModifier ?? 0);
    setDamageRoll({ rolls: baseRolls, mod: action.healingModifier ?? 0, total });
    setStep('HEAL_RESULT');
  };

  // ── Step handlers ─────────────────────────────────────────────────────────

  const handleTargetSelect = (t: CombatantState) => {
    setTarget(t);
    const derivedAdvMode = deriveInitialAdvMode(attacker, t);
    setAttackAdvMode(derivedAdvMode);
    if (isHealAction) {
      if (isAutoMode) { doAutoHeal(); }
      else setStep('HEAL_ROLL');
    } else if (isSaveAction) {
      if (isAutoMode) { doAutoSave(t); }
      else setStep('SAVE_PROMPT');
    } else {
      if (isAutoMode) { doAutoAttack(t, derivedAdvMode); }
      else setStep('ATTACK_ROLL');
    }
  };

  const handleAttackRollEnter = (val: number) => {
    if (!target) return;
    const bonus = getAttackBonus(action);
    const natural = val <= 20 ? val : val - bonus;
    const total = natural <= 20 ? natural + bonus : val;
    const crit = natural === 20;
    const hit = crit || (natural !== 1 && total >= target.ac);
    const breakdown = natural <= 20
      ? `d20(${natural}) + ${bonus} = ${total} vs AC ${target.ac}`
      : `Total ${val} vs AC ${target.ac}`;
    setD20Roll(natural <= 20 ? natural : val);
    setIsCrit(crit);
    setIsHit(hit);
    setAttackRollBreakdown(breakdown);
    setStep('ATTACK_RESULT');
  };

  const handleDamageRollEnter = (val: number) => {
    const { mod } = parseDice(action.damageDice || '1d6');
    setDamageRoll({ rolls: [val], mod: damageRoll?.mod ?? mod, total: Math.max(0, val) });
    setStep(isHealAction ? 'HEAL_RESULT' : 'DAMAGE_RESULT');
  };

  const handleSaveRollEnter = (val: number) => {
    if (!target || !action.saveDC) return;
    const passed = val >= action.saveDC;
    setSaveRoll(val);
    setSavePassed(passed);
    setStep('SAVE_RESULT');
    if (!passed || action.saveEffect === 'half') {
      if (isAutoMode) {
        const dmg = rollFormula(action.damageDice || '1d6');
        setDamageRoll(dmg);
      }
    }
  };

  const handleComplete = () => {
    if (!target && needsTarget) return;
    const dmg = damageRoll?.total;
    let finalDmg = dmg;
    if (isSaveAction && savePassed && action.saveEffect === 'half') finalDmg = Math.floor((dmg ?? 0) / 2);
    if (isSaveAction && savePassed && action.saveEffect === 'negated') finalDmg = 0;

    const logParts: string[] = [`${attacker.name} → ${action.name}`];
    if (target) logParts.push(`targets ${target.name}`);
    if (attackRollBreakdown) logParts.push(attackRollBreakdown);
    if (!isHit && !isSaveAction) logParts.push('→ MISS');
    if (isCrit) logParts.push('→ CRITICAL HIT!');
    if (saveRoll !== null) logParts.push(`Save: ${saveRoll} vs DC ${action.saveDC} → ${savePassed ? 'PASS' : 'FAIL'}`);
    if (finalDmg !== undefined) logParts.push(`→ ${finalDmg} ${action.damageType ?? 'damage'}`);

    onComplete({
      attacker, target: target ?? undefined, action,
      hit: isHit || (isSaveAction && !savePassed),
      isCrit,
      damage: isHealAction ? undefined : finalDmg,
      healing: isHealAction ? finalDmg : undefined,
      damageType: action.damageType,
      saveRoll: saveRoll ?? undefined,
      savePassed: savePassed ?? undefined,
      log: logParts.join(' '),
    });
  };

  if (!isOpen) return null;

  const atk = getAttackBonus(action);
  const damageDice = action.damageDice || '1d6';
  const healDice = action.healingDice || action.damageDice || '1d4';

  // ── Roll context reasons ──────────────────────────────────────────────────
  const rollReasons = deriveRollReasons(attacker, step, attackAdvMode, target, bonusPool);

  // ── Bonus pool formula label ──────────────────────────────────────────────
  const bonusFormula = bonusPool.map(g => `+${g.qty}d${g.sides}`).join('');

  // ── Shared die selector row ───────────────────────────────────────────────
  const dieSelectorRow = (activeColor: string) => (
    <div className="grid grid-cols-6 gap-1">
      {DIE_SIZES.map(s => (
        <button
          key={s}
          onClick={() => setModalDieSides(s)}
          className={`py-2 rounded-xl border text-[7px] font-black flex flex-col items-center gap-0.5 transition-all active:scale-90 ${
            modalDieSides === s ? activeColor : 'bg-white/[0.03] border-white/8 text-slate-600 hover:text-slate-400 hover:border-white/15'
          }`}
        >
          <DieSvg sides={s} className="w-4 h-4" />
          d{s}
        </button>
      ))}
    </div>
  );

  // ── Shared quantity row ───────────────────────────────────────────────────
  const qtyRow = () => (
    <div className="flex items-center gap-3">
      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex-1">Quantity</span>
      <button onClick={() => setModalDieQty(v => Math.max(1, v - 1))} className="size-7 rounded-lg bg-white/5 border border-white/8 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-[14px] font-black tabular-nums text-white">{modalDieQty}</span>
      <button onClick={() => setModalDieQty(v => v + 1)} className="size-7 rounded-lg bg-white/5 border border-white/8 text-slate-500 hover:text-emerald-400 flex items-center justify-center transition-all">
        <Plus className="w-3 h-3" />
      </button>
      <span className="text-[10px] font-black text-slate-600 font-mono">{modalDieQty}d{modalDieSides}</span>
    </div>
  );

  // ── Bonus dice section (collapsible) ─────────────────────────────────────
  const bonusDiceSection = () => (
    <div className="border-t border-white/[0.06] pt-3">
      <button
        onClick={() => setShowBonusSection(v => !v)}
        className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors w-full"
      >
        <Plus className="w-3 h-3" />
        Bonus Dice
        {bonusPool.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[7px] font-black">
            {bonusFormula}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 ml-auto transition-transform duration-150 ${showBonusSection ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {showBonusSection && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">

              {/* Current pool */}
              {bonusPool.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  {bonusPool.map(g => (
                    <div key={g.id} className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-purple-500/15 border border-purple-500/25 text-[9px] font-black text-purple-300">
                      <span>+{g.qty}d{g.sides}{g.label ? ` (${g.label})` : ''}</span>
                      <button
                        onClick={() => setBonusPool(p => p.filter(x => x.id !== g.id))}
                        className="size-4 rounded flex items-center justify-center text-purple-600 hover:text-red-400 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setBonusPool([])}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/8 text-[8px] font-black text-slate-600 hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Quick-add presets */}
              <div>
                <p className="text-[7px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Quick Add</p>
                <div className="flex flex-wrap gap-1">
                  {QUICK_BONUS.map(q => (
                    <button
                      key={`${q.qty}d${q.sides}`}
                      onClick={() => setBonusPool(p => [...p, { id: Math.random().toString(36).slice(2), qty: q.qty, sides: q.sides }])}
                      className="flex flex-col items-center px-2 py-1.5 rounded-xl border border-purple-500/20 bg-purple-500/8 text-[7px] font-black text-purple-400 hover:bg-purple-500/20 transition-all active:scale-90"
                    >
                      <span>{q.label}</span>
                      <span className="text-[6px] text-purple-700">{q.tip}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom die picker */}
              <div>
                <p className="text-[7px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Custom</p>
                <div className="grid grid-cols-6 gap-1 mb-2">
                  {DIE_SIZES.map(s => (
                    <button
                      key={s}
                      onClick={() => setBonusStageSides(s)}
                      className={`py-1.5 rounded-xl border text-[7px] font-black flex flex-col items-center gap-0.5 transition-all active:scale-90 ${
                        bonusStageSides === s
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-white/[0.03] border-white/8 text-slate-600 hover:text-slate-400 hover:border-white/15'
                      }`}
                    >
                      <DieSvg sides={s} className="w-3.5 h-3.5" />
                      d{s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setBonusStageQty(v => Math.max(1, v - 1))} className="size-6 rounded-lg bg-white/5 border border-white/8 text-slate-600 hover:text-red-400 flex items-center justify-center transition-all">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-[12px] font-black tabular-nums text-slate-400">{bonusStageQty}</span>
                  <button onClick={() => setBonusStageQty(v => v + 1)} className="size-6 rounded-lg bg-white/5 border border-white/8 text-slate-600 hover:text-emerald-400 flex items-center justify-center transition-all">
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="text-[9px] font-black text-purple-500 font-mono flex-1">+{bonusStageQty}d{bonusStageSides}</span>
                  <button
                    onClick={() => setBonusPool(p => [...p, { id: Math.random().toString(36).slice(2), qty: bonusStageQty, sides: bonusStageSides }])}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[8px] font-black uppercase tracking-widest hover:bg-purple-500/30 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Roll reason banner ────────────────────────────────────────────────────
  const reasonBanner = () => rollReasons.length > 0 ? (
    <div className="px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.05] space-y-0.5">
      {rollReasons.map((r, i) => (
        <p key={i} className="text-[9px] text-slate-500 italic leading-snug">{r}</p>
      ))}
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      {/* Card — taller on roll steps to fit full dice UI */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        className="relative w-full max-w-sm bg-[#13151A] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90dvh] flex flex-col"
      >
        {/* Top accent */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Header */}
          <div className="flex items-start justify-between">
            <StepHeader step={step} action={action} />
            <button onClick={onClose} className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all ml-4 shrink-0 mt-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Attacker context */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Acting:</span>
            <span className="text-[10px] font-black text-slate-300">{attacker.name}</span>
            {target && <>
              <ChevronRight className="w-3 h-3 text-slate-700" />
              <span className="text-[10px] font-black text-sky-300">{target.name}</span>
            </>}
          </div>

          <AnimatePresence mode="wait">

            {/* ── TARGET SELECT ── */}
            {step === 'TARGET_SELECT' && (
              <motion.div key="target" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Choose a target</p>
                {availableTargets.filter(t => t.instanceId !== attacker.instanceId).map(t => {
                  const dist = calculateDistance(attacker.position, t.position);
                  const outOfRange = dist > getRangeValue(action.range);
                  return (
                    <button
                      key={t.instanceId}
                      onClick={() => handleTargetSelect(t)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all hover:scale-[1.01] ${
                        outOfRange ? 'opacity-60 bg-slate-900 border-white/5' :
                        t.side === 'Enemy' ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-[12px] font-black uppercase text-white">{t.name}</p>
                        <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">
                          {t.side} · HP {t.currentHP}/{t.maxHP} · AC {t.ac}
                          <span className={`ml-2 px-1 rounded ${outOfRange ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-400'}`}>
                            {dist} ft {outOfRange ? '(OUT OF RANGE)' : ''}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* ── ATTACK ROLL ── */}
            {step === 'ATTACK_ROLL' && (
              <motion.div key="atk-roll" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Context tags */}
                <div className="flex gap-2">
                  <FormulaTag label="Die" value={`${modalDieQty}d${modalDieSides}`} />
                  <FormulaTag label="Bonus" value={atk >= 0 ? `+${atk}` : String(atk)} highlight />
                  {target && <FormulaTag label="Target AC" value={String(target.ac)} />}
                </div>

                {/* Reasons */}
                {reasonBanner()}

                {/* Die type */}
                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-slate-600 mb-2">Die Type</p>
                  {dieSelectorRow('bg-amber-500/20 border-amber-500/40 text-amber-300')}
                </div>

                {/* Quantity */}
                {qtyRow()}

                {/* Adv / Dis */}
                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-slate-600 mb-2">Roll Mode</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      ['disadvantage', '↓ Disadv', 'bg-red-500/20 border-red-500/40 text-red-300'],
                      ['normal',       'Normal',   'bg-white/10 border-white/20 text-slate-200'],
                      ['advantage',    '↑ Adv',    'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'],
                    ] as const).map(([mode, label, activeClass]) => (
                      <button
                        key={mode}
                        onClick={() => setAttackAdvMode(mode)}
                        className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-wide transition-all ${
                          attackAdvMode === mode ? activeClass : 'bg-white/5 border-white/8 text-slate-600 hover:text-slate-300 hover:border-white/15'
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* Roll button */}
                <button
                  onClick={handleInlineAttackRoll}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 text-black text-[13px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Dices className="w-5 h-5" />
                  Roll {modalDieQty}d{modalDieSides}{atk !== 0 ? (atk > 0 ? ` + ${atk}` : ` - ${Math.abs(atk)}`) : ''}
                  {attackAdvMode !== 'normal' ? ` (${attackAdvMode === 'advantage' ? 'ADV' : 'DIS'})` : ''}
                </button>

                <ManualEntryFallback formula="1d20" modifier={atk >= 0 ? `+${atk}` : String(atk)} onEnter={handleAttackRollEnter} />
              </motion.div>
            )}

            {/* ── ATTACK RESULT ── */}
            {step === 'ATTACK_RESULT' && (
              <motion.div key="atk-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {droppedD20 !== null && (
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-[8px] font-black uppercase ${attackAdvMode === 'advantage' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Kept</span>
                      <span className={`px-2 py-0.5 rounded-lg border font-black text-[11px] ${attackAdvMode === 'advantage' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>{d20Roll}</span>
                    </div>
                    <span className="text-slate-700">vs</span>
                    <div className="flex items-center gap-1.5 opacity-40">
                      <span className="text-slate-500">Dropped</span>
                      <span className="px-2 py-0.5 rounded-lg border border-white/10 bg-white/5 text-slate-500 font-black text-[11px] line-through">{droppedD20}</span>
                    </div>
                    <span className="ml-auto tracking-widest">{attackAdvMode === 'advantage' ? '↑ Advantage' : '↓ Disadvantage'}</span>
                  </div>
                )}
                <ResultBanner
                  type={isCrit ? 'crit' : isHit ? 'hit' : 'miss'}
                  title={isCrit ? 'Critical Hit!' : isHit ? 'Hit!' : 'Miss'}
                  subtitle={attackRollBreakdown}
                />
                {isHit ? (
                  <>
                    {isAutoMode && damageRoll ? (
                      <div className="space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Auto damage rolled</p>
                        <div className="flex gap-2 flex-wrap">
                          {damageRoll.rolls.map((r, i) => <FormulaTag key={i} label={`Die ${i+1}`} value={String(r)} />)}
                          {damageRoll.mod !== 0 && <FormulaTag label="Mod" value={damageRoll.mod > 0 ? `+${damageRoll.mod}` : String(damageRoll.mod)} />}
                          <FormulaTag label="Total" value={String(damageRoll.total)} highlight />
                        </div>
                        <button onClick={() => setStep('DAMAGE_RESULT')} className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all">
                          Apply {damageRoll.total} {action.damageType} Damage →
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setStep('DAMAGE_ROLL')} className="w-full py-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/25 transition-all flex items-center justify-center gap-2">
                        <Dices className="w-4 h-4" /> Roll Damage
                      </button>
                    )}
                  </>
                ) : (
                  <button onClick={onClose} className="w-full py-3 rounded-xl bg-white/5 border border-white/8 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:bg-white/8 transition-all">
                    Missed — Return to Combat
                  </button>
                )}
              </motion.div>
            )}

            {/* ── SAVE PROMPT ── */}
            {step === 'SAVE_PROMPT' && target && action.saveDC && (
              <motion.div key="save-prompt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex gap-2">
                  <FormulaTag label="Save Type" value={action.saveType ?? 'DEX'} highlight />
                  <FormulaTag label="DC" value={String(action.saveDC)} />
                  <FormulaTag label="Target Mod" value={`+${getSaveBonus(target, action.saveType ?? 'DEX')}`} />
                </div>
                {action.saveEffect === 'half' && (
                  <p className="text-[9px] text-amber-500/70 font-black uppercase tracking-widest">Half damage on successful save</p>
                )}
                {reasonBanner()}

                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-slate-600 mb-2">Die Type</p>
                  {dieSelectorRow('bg-violet-500/20 border-violet-500/40 text-violet-300')}
                </div>
                {qtyRow()}

                <button
                  onClick={handleInlineSaveRoll}
                  className="w-full py-3.5 rounded-2xl bg-violet-500 text-white text-[13px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Dices className="w-5 h-5" />
                  Roll {modalDieQty}d{modalDieSides} Save
                </button>
                <ManualEntryFallback formula="1d20" modifier={`+${getSaveBonus(target, action.saveType ?? 'DEX')}`} onEnter={handleSaveRollEnter} />
              </motion.div>
            )}

            {/* ── SAVE RESULT ── */}
            {step === 'SAVE_RESULT' && (
              <motion.div key="save-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <ResultBanner
                  type={savePassed ? (action.saveEffect === 'half' ? 'half' : 'success') : 'fail'}
                  title={savePassed ? (action.saveEffect === 'half' ? 'Half Damage' : 'Save Passed') : 'Save Failed'}
                  subtitle={`Rolled ${saveRoll} vs DC ${action.saveDC}`}
                />
                {(!savePassed || action.saveEffect === 'half') ? (
                  <>
                    {isAutoMode && damageRoll ? (
                      <div className="space-y-2">
                        <div className="flex gap-2 flex-wrap">
                          {damageRoll.rolls.map((r, i) => <FormulaTag key={i} label={`Die ${i+1}`} value={String(r)} />)}
                          <FormulaTag label="Total" value={String(savePassed ? Math.floor(damageRoll.total / 2) : damageRoll.total)} highlight />
                        </div>
                        <button onClick={() => setStep('DAMAGE_RESULT')} className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all">
                          Apply Damage →
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setStep('DAMAGE_ROLL')} className="w-full py-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/25 transition-all flex items-center justify-center gap-2">
                        <Dices className="w-4 h-4" /> Roll Damage
                      </button>
                    )}
                  </>
                ) : (
                  <button onClick={onClose} className="w-full py-3 rounded-xl bg-white/5 border border-white/8 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:bg-white/8 transition-all">
                    No Damage — Return to Combat
                  </button>
                )}
              </motion.div>
            )}

            {/* ── DAMAGE ROLL ── */}
            {step === 'DAMAGE_ROLL' && (
              <motion.div key="dmg-roll" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex gap-2">
                  <FormulaTag label="Base" value={`${modalDieQty}d${modalDieSides}${bonusPool.length > 0 ? bonusFormula : ''}`} highlight />
                  {isCrit && <FormulaTag label="Crit" value="×2 dice" />}
                  <FormulaTag label="Type" value={action.damageType ?? '—'} />
                </div>

                {reasonBanner()}

                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-slate-600 mb-2">Die Type</p>
                  {dieSelectorRow('bg-red-500/20 border-red-500/40 text-red-300')}
                </div>
                {qtyRow()}
                {bonusDiceSection()}

                <button
                  onClick={handleInlineDamageRoll}
                  className="w-full py-3.5 rounded-2xl bg-red-500 text-white text-[13px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Dices className="w-5 h-5" />
                  Roll {modalDieQty}d{modalDieSides}{bonusFormula} Damage
                </button>
                <ManualEntryFallback
                  formula={isCrit ? `${parseDice(damageDice).count * 2}d${parseDice(damageDice).sides}` : damageDice}
                  modifier={parseDice(damageDice).mod !== 0 ? (parseDice(damageDice).mod > 0 ? `+${parseDice(damageDice).mod}` : String(parseDice(damageDice).mod)) : undefined}
                  onEnter={handleDamageRollEnter}
                />
              </motion.div>
            )}

            {/* ── DAMAGE RESULT ── */}
            {step === 'DAMAGE_RESULT' && damageRoll && target && (
              <motion.div key="dmg-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Per-group breakdown */}
                <div className="bg-black/30 border border-white/8 rounded-2xl p-4 space-y-2">
                  {/* Base dice */}
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest w-16 shrink-0">{modalDieQty}d{modalDieSides}</span>
                    <div className="flex gap-1 flex-wrap flex-1">
                      {damageRoll.rolls.map((r, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-300 tabular-nums">{r}</span>
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 tabular-nums shrink-0">= {damageRoll.rolls.reduce((a, b) => a + b, 0)}</span>
                  </div>

                  {/* Bonus groups */}
                  {bonusRollResults.map(g => (
                    <div key={g.id} className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest w-16 shrink-0">
                        +{g.rolls.length}d{g.sides}{g.label ? ` (${g.label})` : ''}
                      </span>
                      <div className="flex gap-1 flex-wrap flex-1">
                        {g.rolls.map((r, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 tabular-nums">{r}</span>
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-purple-500 tabular-nums shrink-0">= {g.rolls.reduce((a, b) => a + b, 0)}</span>
                    </div>
                  ))}

                  {/* Modifier */}
                  {damageRoll.mod !== 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest w-16 shrink-0">Mod</span>
                      <span className="flex-1 text-[10px] font-black text-slate-500 tabular-nums">
                        {damageRoll.mod > 0 ? `+${damageRoll.mod}` : damageRoll.mod}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest">Total</span>
                    <span className="text-[30px] font-black text-amber-400 tabular-nums leading-none">
                      {savePassed && action.saveEffect === 'half' ? Math.floor(damageRoll.total / 2) : damageRoll.total}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/15">
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60">Result</p>
                  <p className="text-[13px] font-black text-red-300">
                    {target.name} takes {savePassed && action.saveEffect === 'half' ? Math.floor(damageRoll.total / 2) : damageRoll.total} {action.damageType ?? ''} damage
                  </p>
                  <p className="text-[8px] text-slate-600 mt-0.5">{target.currentHP} HP → {Math.max(0, target.currentHP - (savePassed && action.saveEffect === 'half' ? Math.floor(damageRoll.total / 2) : damageRoll.total))} HP</p>
                </div>
                <button onClick={handleComplete} className="w-full py-3 rounded-xl bg-amber-500 text-black text-[11px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">
                  Apply & Continue →
                </button>
              </motion.div>
            )}

            {/* ── HEAL ROLL ── */}
            {step === 'HEAL_ROLL' && (
              <motion.div key="heal-roll" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex gap-2">
                  <FormulaTag label="Formula" value={`${modalDieQty}d${modalDieSides}${bonusFormula}`} highlight />
                  {action.healingModifier && action.healingModifier > 0 && <FormulaTag label="Bonus" value={`+${action.healingModifier}`} />}
                </div>

                {reasonBanner()}

                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-slate-600 mb-2">Die Type</p>
                  {dieSelectorRow('bg-emerald-500/20 border-emerald-500/40 text-emerald-300')}
                </div>
                {qtyRow()}
                {bonusDiceSection()}

                <button
                  onClick={handleInlineHealRoll}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 text-black text-[13px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Dices className="w-5 h-5" />
                  Roll {modalDieQty}d{modalDieSides}{bonusFormula} Healing
                </button>
                <ManualEntryFallback
                  formula={healDice}
                  modifier={action.healingModifier ? `+${action.healingModifier}` : undefined}
                  onEnter={(val) => {
                    setDamageRoll({ rolls: [val], mod: 0, total: val + (action.healingModifier ?? 0) });
                    setStep('HEAL_RESULT');
                  }}
                />
              </motion.div>
            )}

            {/* ── HEAL RESULT ── */}
            {step === 'HEAL_RESULT' && damageRoll && (
              <motion.div key="heal-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Per-group breakdown if bonus dice were used */}
                {bonusRollResults.length > 0 ? (
                  <div className="bg-black/30 border border-white/8 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest w-16 shrink-0">{modalDieQty}d{modalDieSides}</span>
                      <div className="flex gap-1 flex-wrap flex-1">
                        {damageRoll.rolls.map((r, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-300 tabular-nums">{r}</span>
                        ))}
                      </div>
                    </div>
                    {bonusRollResults.map(g => (
                      <div key={g.id} className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest w-16 shrink-0">+{g.rolls.length}d{g.sides}</span>
                        <div className="flex gap-1 flex-wrap flex-1">
                          {g.rolls.map((r, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 tabular-nums">{r}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-white/5 pt-2">
                      <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">Total</span>
                      <span className="text-[30px] font-black text-emerald-400 tabular-nums leading-none">+{damageRoll.total}</span>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-[30px] font-black text-emerald-400 tabular-nums">+{damageRoll.total}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Healing</p>
                  </div>
                )}
                <button onClick={handleComplete} className="w-full py-3 rounded-xl bg-emerald-500 text-black text-[11px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">
                  Apply Healing →
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Step progress dots */}
        <div className="pb-6 flex justify-center gap-1.5 shrink-0">
          {(['TARGET_SELECT','ATTACK_ROLL','ATTACK_RESULT','DAMAGE_ROLL','DAMAGE_RESULT'] as RollStep[])
            .filter(s => !needsTarget && s === 'TARGET_SELECT' ? false : true)
            .map(s => (
              <div key={s} className={`h-1 rounded-full transition-all ${s === step ? 'w-4 bg-amber-500' : 'w-1 bg-white/10'}`} />
            ))}
        </div>
      </motion.div>
    </div>
  );
}
