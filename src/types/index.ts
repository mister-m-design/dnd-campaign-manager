
export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

// ─── COMBAT MODES ─────────────────────────────────────────────────────────────
// DM_TABLE    – Enemies never act automatically. DM enters everything manually.
// ASSISTED    – System prompts before each roll (auto vs manual), enemies wait.
// AUTO_RESOLUTION – System auto-rolls when player triggers an action; enemies wait.
// FULL_GAME   – Full automation: enemy AI takes turns, auto-target, auto-roll.
export type CombatMode = 'DM_TABLE' | 'ASSISTED' | 'AUTO_RESOLUTION' | 'FULL_GAME';
export type InitiativeMode = 'Manual' | 'Assisted' | 'Auto';
export type GlobalRollMode = 'Manual' | 'Assisted' | 'Auto';

export interface CombatSetupConfig {
  mode: CombatMode;
  rollMode: GlobalRollMode;
  initiativeMode: InitiativeMode;
  manualInitiatives?: Record<string, number>; // keyed by temp combatant key for manual entry
}

export interface AbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface SpeciesTrait {
  name: string;
  description: string;
}

export interface Species {
  name: string;
  size: string;
  speed: number;
  traits: SpeciesTrait[];
}

export interface AbilityModifiers {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface Resource {
  id: string;
  name: string;
  max: number;
  current: number;
  reset: 'Short Rest' | 'Long Rest' | 'Turn Start';
}

/**
 * Unified Power / Action model.
 * Used by spells, class features, monster abilities, weapon attacks, reactions,
 * passives, and homebrew. All combat logic reads from this one schema.
 */
export interface Action {
  id: string;
  name: string;
  description: string;
  type: 'Action' | 'Bonus Action' | 'Reaction' | 'Passive' | 'Ability' | 'Spell';
  actionType?: 'Attack' | 'Spell' | 'Ability' | 'Heal' | 'Other';
  attackType?: 'Melee' | 'Ranged' | 'Spell' | 'Beast' | 'Save';

  // ── DAMAGE ───────────────────────────────────────────────────────────────
  damageRoll?: string;       // legacy compat
  damageDice?: string;       // e.g. "8d6"
  damageModifier?: number;
  damageType?: string;
  scalingDice?: string;      // extra dice per spell level above base, e.g. "+1d6"
  isSneakAttack?: boolean;

  // ── ATTACK ROLL ──────────────────────────────────────────────────────────
  toHitBonus?: number;
  attackBonus?: number;

  // ── SAVING THROW ─────────────────────────────────────────────────────────
  saveDC?: number;
  saveType?: Ability;
  saveEffect?: 'none' | 'half' | 'negated';

  // ── RANGE / REACH ────────────────────────────────────────────────────────
  range?: string;            // "60 feet", "Touch", "Self", etc.
  reach?: string;            // for melee reach weapons
  /** Structured range type for logic-driven decisions */
  rangeType?: 'self' | 'touch' | 'melee' | 'ranged' | 'sight' | 'unlimited' | 'special';

  // ── TARGETING ────────────────────────────────────────────────────────────
  targetType?: 'self' | 'single' | 'ally' | 'enemy' | 'area' | 'multiple' | 'none';
  requiresTarget?: boolean;  // false for self / untargeted
  targetSelf?: boolean;
  maxTargets?: number;       // for multi-target abilities

  // ── AoE SHAPE ────────────────────────────────────────────────────────────
  aoeShape?: 'cone' | 'line' | 'sphere' | 'cube' | 'cylinder';
  aoeSize?: number;          // feet — radius for sphere/cylinder, length for cone/line, side for cube
  aoeWidth?: number;         // feet — secondary dimension for line (width) or cylinder (height)
  aoeOrigin?: 'caster' | 'point' | 'target'; // where the AoE originates

  // ── HEALING ──────────────────────────────────────────────────────────────
  isHealing?: boolean;
  healingDice?: string;
  healingModifier?: number;

  // ── SPELL FIELDS ─────────────────────────────────────────────────────────
  spellLevel?: number;       // 0 = cantrip, 1-9 = uses spell slot of this level
  spellSchool?: string;      // 'Evocation', 'Conjuration', etc.
  concentration?: boolean;   // alias for requiresConcentration
  requiresConcentration?: boolean;
  duration?: string;         // "1 minute", "Instantaneous", "Concentration, up to 1 hour"
  ritual?: boolean;
  components?: string;       // "V, S, M (material)"
  classesAllowed?: string[]; // which classes can learn this spell

  // ── CLASS FEATURE FIELDS ─────────────────────────────────────────────────
  className?: string;        // class that grants this feature
  minimumClassLevel?: number; // minimum level required to use
  isPassive?: boolean;       // passive feature (always applies, not activated)
  classResourceType?: string; // 'rage', 'ki', 'sorcery points', etc.
  classResourceCost?: number;

  // ── RESOURCE CONSUMPTION ─────────────────────────────────────────────────
  limitedUses?: number;
  remainingUses?: number;
  rechargeRule?: 'shortRest' | 'longRest' | 'turn' | 'encounter';
  recharge?: string;         // monster recharge notation "5-6"

  // ── CONDITION / EFFECT APPLICATION ───────────────────────────────────────
  appliesCondition?: string; // condition name applied on hit/fail
  conditionDuration?: number; // rounds
  conditionSaveType?: Ability; // save to end condition

  // ── MULTIATTACK ───────────────────────────────────────────────────────────
  multiattack?: number;
  multiattackComponents?: string[]; // ids of component actions

  // ── MISC ─────────────────────────────────────────────────────────────────
  source?: 'Class' | 'Species' | 'Item' | 'Form' | 'Temp' | 'Monster' | 'Homebrew';
  average?: number;
  tags?: string[];
  isHomebrew?: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'Weapon' | 'Armor' | 'Shield' | 'Tool' | 'Gear' | 'Consumable' | 'Other';
  description?: string;
  weight?: number;
  cost?: string;
  equipped?: boolean;
  quantity: number;
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact';
  attunement?: boolean;
  attuned?: boolean;
  properties?: string[];
  // Armor specific
  acBase?: number;
  dexMax?: number;
  stealthDisadvantage?: boolean;
  strengthRequirement?: number;
  // Weapon specific
  damageDie?: string;
  damageType?: string;
  damage?: string;
  property?: string;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Identity {
  id: string;
  name: string;
  species: string;
  background: string;
  alignment: string;
  appearance: string;
  personality: string;
  portrait: string;
}

export interface Progression {
  class?: string;
  subclass?: string;
  level: number;
  experience?: number;
  proficiencyBonus?: number;
  xp?: number;
  nextLevelXP?: number;
}

export interface DerivedStats {
  abilityModifiers: AbilityModifiers;
  initiativeBonus: number;
  passivePerception: number;
  spellAttackBonus: number;
  spellSaveDC: number;
}

export interface DefenseStats {
  armorClass: number;
  armorFormulaSource: string;
  hitPoints: {
    current: number;
    max: number;
    temp: number;
  };
  hitDice: {
    current: number;
    max: number;
    dieType: string;
  };
  deathSaves: DeathSaves;
}

export interface MovementStats {
  speed: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
}

export interface CombatData {
  attacks: any[];
  weaponProficiencies: string[];
  armorProficiencies: string[];
  shieldEquipped: boolean;
  equippedArmorId?: string;
  equippedShieldId?: string;
  equippedWeapons: string[];
  conditions: string[];
  concentration: string | null;
  resources: {
      action: boolean;
      bonusAction: boolean;
      reaction: boolean;
      movementSpent: number;
      movementRemaining: number;
  };
}

export interface SkillsAndSaves {
  saves: string[];
  skillProficiencies: string[];
  expertise: string[];
}

export interface MagicData {
  spells?: string[];
  cantrips: any[];
  preparedSpells: any[];
  knownSpells: any[];
  spellSlots: Record<number, { current: number; max: number }>;
  ritualCasting: boolean;
  spellcastingAbility?: string;
}

export interface FeatureCategories {
  classFeatures: any[];
  subclassFeatures: any[];
  feats: any[];
  racialTraits: any[];
  backgroundFeatures: any[];
}

export interface CharacterItem {
  id: string;
  identity: Identity;
  progression: Progression;
  abilities: AbilityScores;
  derived: DerivedStats;
  defense: DefenseStats;
  movement: MovementStats;
  combat: CombatData;
  skillsAndSaves: SkillsAndSaves;
  magic: MagicData;
  featureCategories: FeatureCategories;
  features: any[];
  equipment: Equipment[];
  resources: Record<string, any>;
  notes: string;
  metadata: {
    campaignId?: string;
    ownerUserId?: string;
    createdAt: string;
    updatedAt: string;
  };
  transformation: {
    activeFormType: 'Normal' | 'WildShape' | 'Polymorph';
    activeFormId?: string;
    originalStats?: any;
  };
  buildMode?: 'Rules Guided' | 'DM Flexible';
  overrides?: {
    armorClass?: number;
    maxHP?: number;
    currentHP?: number;
    tempHP?: number;
    speed?: number;
    initiative?: number;
    proficiencyBonus?: number;
    spellSaveDC?: number;
    spellAttackBonus?: number;
  };
}

// Character is a more permissive version for UI and manual entries
export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  ac: number;
  baseAC: number;
  maxHP: number;
  proficiencyBonus: number;
  abilityScores: AbilityScores;
  abilityBonuses?: AbilityScores;
  speed: number;
  actions: Action[];
  skillProficiencies: string[];
  species: string;
  speciesTraits?: SpeciesTrait[];
  background?: string;
  alignment?: string;
  
  // Optional complex structures (required in CharacterItem but optional in UI Character)
  identity?: Partial<Identity>;
  progression?: Progression;
  abilities?: AbilityScores;
  derived?: Partial<DerivedStats>;
  defense?: Partial<DefenseStats>;
  movement?: Partial<MovementStats>;
  combat?: Partial<CombatData>;
  skillsAndSaves?: Partial<SkillsAndSaves>;
  magic?: Partial<MagicData>;
  featureCategories?: Partial<FeatureCategories>;
  features?: any[];
  equipment?: Equipment[];
  resources?: Record<string, any>;
  notes?: string;
  metadata?: any;
  transformation?: any;

  buildMode?: 'Rules Guided' | 'DM Flexible';
  overrides?: {
    armorClass?: number;
    maxHP?: number;
    currentHP?: number;
    tempHP?: number;
    speed?: number;
    initiative?: number;
    proficiencyBonus?: number;
    spellSaveDC?: number;
    spellAttackBonus?: number;
  };

  // Runtime aliases
  subclass?: string;
  currentHP?: number;
  tempHP?: number;
  portrait?: string | null;
  imageUrl?: string | null;
  status?: string[];
  conditions?: ConditionType[];
  inCombat?: boolean;
  side?: 'Ally' | 'Enemy';
  instanceId?: string;
  passivePerception?: number;
}

export type ConditionType =
  | 'Prone'
  | 'Poisoned'
  | 'Stunned'
  | 'Blinded'
  | 'Deafened'
  | 'Frightened'
  | 'Grappled'
  | 'Incapacitated'
  | 'Invisible'
  | 'Paralyzed'
  | 'Petrified'
  | 'Restrained'
  | 'Unconscious'
  | 'Concentrating'
  | 'Rage'
  | 'Dodge'
  | 'Advantage'       // DM-forced advantage on all attack rolls
  | 'Disadvantage'    // DM-forced disadvantage on all attack rolls
  | 'Hidden'          // Creature is fully hidden (attackers have disadvantage, creature has advantage)
  | 'PartialHidden'   // Partial cover / partially hidden (DM staging)
  | 'Blessed'         // +1d4 to attacks and saves
  | 'Cursed'          // -1d4 to attacks and saves
  | 'HuntersMarked';  // Target of Hunter's Mark (+1d6 damage from marker)

export interface CombatantState extends Omit<Character, 'resources'> {
  instanceId: string;
  sourceCharacterId?: string;
  type?: 'Player' | 'Enemy' | 'NPC';
  currentHP: number;
  tempHP: number;
  initiative: number;
  isWildShaped: boolean;
  wildShapeTempHP?: number;
  rollMode: 'Auto' | 'Manual' | 'Assisted';
  targetId?: string | null;
  // DM-controlled flags
  hidden?: boolean;           // fully hidden from players
  partialHidden?: boolean;    // partially visible / cover
  dmNotes?: string;           // DM-only notes for this combatant
  // per-combatant override roll flags (cleared at end of turn)
  forceAdvantage?: boolean;
  forceDisadvantage?: boolean;
  // recharge tracking for monster abilities (e.g. recharge on 5-6)
  rechargeAbilities?: Array<{ id: string; name: string; rechargeOn: number[]; used: boolean; recharge?: string }>;
  // DM-granted temporary session loadout (not persisted to character sheet)
  tempActions?: Action[];
  tempEquipment?: Equipment[];
  wildShapeData?: {
    originalStats: AbilityScores;
    originalHP: number;
    originalMaxHP: number;
    originalPortrait: string;
    originalAC: number;
    originalActions: Action[];
    originalSpeed: number;
    beastName: string;
  };
  resources: {
    action: boolean;
    actionUsed?: boolean;
    bonusAction: boolean;
    bonusActionUsed?: boolean;
    reaction: boolean;
    reactionUsed?: boolean;
    movementMax: number;
    movementSpent: number;
    movementRemaining: number;
    wildShapeCharges?: { current: number; max: number };
    rageCharges?: { current: number; max: number };
    spellSlots?: Record<number, { current: number; max: number }>;
  };
  legendaryActionsRemaining?: number;
  legendaryActionsMax?: number;
  hasLairActions?: boolean;
  isSurprised?: boolean;
  concentration: string | null;
  deathSaves: DeathSaves;
  inCombat: boolean;
  side: 'Ally' | 'Enemy';
  status: string[]; 
  conditions: ConditionType[];
  position?: { x: number; y: number };
}

export interface GameState {
  combatants: CombatantState[];
  activeCombatantId: string | null;
  round: number;
  log: LogEntry[];
  isDMMode: boolean;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'combat' | 'system' | 'narrative' | 'movement' | 'notes';
  timestamp: number;
}

export * from './homebrew';
