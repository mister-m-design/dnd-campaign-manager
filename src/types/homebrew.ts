import type { Action, AbilityScores, Equipment } from './index';

// ─── HOMEBREW CONTENT TYPES ──────────────────────────────────────────────────

export type HomebrewSourceTag = 'Homebrew' | 'Custom' | 'Third Party' | 'Modified Official';

export interface HomebrewMonster {
  id: string;
  name: string;
  type: string;           // humanoid, undead, beast, etc.
  subtype?: string;
  size: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
  alignment?: string;
  cr: string;             // "0.25", "1", "13", etc.
  hp: number;
  hpDice?: string;        // e.g. "2d6+2"
  ac: number;
  acSource?: string;      // e.g. "natural armor", "chain mail"
  speed: number;
  flySpeed?: number;
  swimSpeed?: number;
  climbSpeed?: number;
  abilityScores: AbilityScores;
  savingThrows?: Partial<AbilityScores>;
  skills?: Record<string, number>;  // e.g. { Stealth: 4, Perception: 2 }
  damageImmunities?: string[];
  damageResistances?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses?: string;
  languages?: string;
  actions: Action[];
  legendaryActions?: Action[];
  reactions?: Action[];
  traits?: Array<{ name: string; description: string }>;
  lairActions?: string[];
  description?: string;
  imageUrl?: string;
  source: HomebrewSourceTag;
  overridesId?: string;   // official monster id being overridden
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomebrewSpell {
  id: string;
  name: string;
  level: number;          // 0 = cantrip
  school: string;         // Evocation, Illusion, etc.
  castingTime: string;    // '1 action', '1 bonus action', '1 reaction', '1 minute', etc.
  range: string;          // '60 feet', 'Self', 'Touch', etc.
  components: string;     // 'V, S, M (a pinch of sulfur)'
  duration: string;       // 'Instantaneous', 'Concentration, up to 1 minute', etc.
  concentration: boolean;
  ritual: boolean;
  classes: string[];      // wizard, cleric, etc.
  description: string;
  higherLevels?: string;  // At Higher Levels text
  damageType?: string;
  damageDice?: string;
  savingThrow?: string;
  attackBonus?: number;
  imageUrl?: string;
  source: HomebrewSourceTag;
  overridesId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomebrewItem {
  id: string;
  name: string;
  type: 'Weapon' | 'Armor' | 'Shield' | 'Tool' | 'Gear' | 'Consumable' | 'Wondrous' | 'Ring' | 'Rod' | 'Staff' | 'Wand' | 'Other';
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact';
  requiresAttunement: boolean;
  description: string;
  properties?: string[];
  // Weapon specific
  damageDice?: string;
  damageType?: string;
  attackBonus?: number;
  // Armor specific
  acBase?: number;
  acBonus?: number;
  stealthDisadvantage?: boolean;
  strengthRequirement?: number;
  dexMax?: number;
  weight?: number;
  cost?: string;
  imageUrl?: string;
  source: HomebrewSourceTag;
  overridesId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomebrewCondition {
  id: string;
  name: string;
  description: string;
  effects: string[];      // Bullet-point mechanical effects
  endCondition?: string;  // How it ends
  imageUrl?: string;
  source: HomebrewSourceTag;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomebrewAbility {
  id: string;
  name: string;
  type: 'Feat' | 'Class Feature' | 'Species Trait' | 'Background Feature' | 'General';
  prerequisite?: string;
  description: string;
  mechanicalEffect?: string;
  associatedAction?: Action;
  imageUrl?: string;
  source: HomebrewSourceTag;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── HOMEBREW STORE (all categories) ─────────────────────────────────────────

export interface HomebrewStore {
  monsters: HomebrewMonster[];
  spells: HomebrewSpell[];
  items: HomebrewItem[];
  conditions: HomebrewCondition[];
  abilities: HomebrewAbility[];
  version: number;
  lastUpdated: string;
}

export const EMPTY_HOMEBREW_STORE: HomebrewStore = {
  monsters: [],
  spells: [],
  items: [],
  conditions: [],
  abilities: [],
  version: 1,
  lastUpdated: new Date().toISOString(),
};

// ─── FACTORY HELPERS ──────────────────────────────────────────────────────────

export function newHomebrewMonster(overrides?: Partial<HomebrewMonster>): HomebrewMonster {
  const now = new Date().toISOString();
  return {
    id: `hb-monster-${Date.now()}`,
    name: 'New Monster',
    type: 'humanoid',
    size: 'Medium',
    cr: '1',
    hp: 20,
    ac: 12,
    speed: 30,
    abilityScores: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    actions: [],
    source: 'Homebrew',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function newHomebrewSpell(overrides?: Partial<HomebrewSpell>): HomebrewSpell {
  const now = new Date().toISOString();
  return {
    id: `hb-spell-${Date.now()}`,
    name: 'New Spell',
    level: 1,
    school: 'Evocation',
    castingTime: '1 action',
    range: '60 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    concentration: false,
    ritual: false,
    classes: [],
    description: '',
    source: 'Homebrew',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function newHomebrewItem(overrides?: Partial<HomebrewItem>): HomebrewItem {
  const now = new Date().toISOString();
  return {
    id: `hb-item-${Date.now()}`,
    name: 'New Item',
    type: 'Other',
    rarity: 'Common',
    requiresAttunement: false,
    description: '',
    source: 'Homebrew',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function newHomebrewCondition(overrides?: Partial<HomebrewCondition>): HomebrewCondition {
  const now = new Date().toISOString();
  return {
    id: `hb-condition-${Date.now()}`,
    name: 'New Condition',
    description: '',
    effects: [],
    source: 'Homebrew',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function newHomebrewAbility(overrides?: Partial<HomebrewAbility>): HomebrewAbility {
  const now = new Date().toISOString();
  return {
    id: `hb-ability-${Date.now()}`,
    name: 'New Ability',
    type: 'Feat',
    description: '',
    source: 'Homebrew',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
