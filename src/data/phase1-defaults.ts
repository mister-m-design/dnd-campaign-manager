
import { CombatantState } from '../types';

export const LEVEL_2_DRUID: CombatantState = {
  id: 'druid-1',
  instanceId: 'char-1-active',
  name: 'Fauna Natureheart',
  species: 'Wood Elf',
  class: 'Druid',
  subclass: 'Circle of the Moon',
  level: 2,
  abilityScores: {
    STR: 10,
    DEX: 14,
    CON: 14,
    INT: 12,
    WIS: 16,
    CHA: 10
  },
  baseAC: 13, // Leather (11) + Dex mod (2)
  maxHP: 18,
  currentHP: 18,
  tempHP: 0,
  speed: 35,
  proficiencyBonus: 2,
  initiative: 0,
  isWildShaped: false,
  rollMode: 'Auto',
  ac: 13,
  status: [],
  resources: {
    action: true,
    actionUsed: false,
    bonusAction: true,
    bonusActionUsed: false,
    reaction: true,
    reactionUsed: false,
    movementMax: 35,
    movementSpent: 0,
    movementRemaining: 35,
    wildShapeCharges: { current: 2, max: 2 },
    spellSlots: { 
        1: { current: 3, max: 3 }
    }
  },
  skillProficiencies: [],
  actions: [
    {
      id: 'attack-staff',
      name: 'Quarterstaff',
      description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 1d6 + 2 bludgeoning damage.',
      type: 'Action',
      actionType: 'Attack',
      attackBonus: 4,
      damageDice: '1d6',
      damageModifier: 2,
      damageType: 'bludgeoning',
      range: '5ft',
      source: 'Item'
    },
    {
        id: 'wild-shape',
        name: 'Wild Shape',
        description: 'As a bonus action, you can magically assume the shape of a beast that you have seen before.',
        type: 'Bonus Action',
        actionType: 'Ability',
        source: 'Class'
    }
  ],
  conditions: [],
  concentration: null,
  deathSaves: { successes: 0, failures: 0 },
  inCombat: true,
  side: 'Ally',
  portrait: null
};

export const GOBLIN: CombatantState = {
  id: 'monster-goblin',
  instanceId: 'monster-goblin-active',
  name: 'Goblin Scout',
  species: 'Goblinoid',
  class: 'Scout',
  level: 1,
  abilityScores: {
    STR: 10,
    DEX: 14,
    CON: 10,
    INT: 10,
    WIS: 10,
    CHA: 8
  },
  baseAC: 15,
  maxHP: 7,
  currentHP: 7,
  tempHP: 0,
  speed: 30,
  proficiencyBonus: 2,
  initiative: 0,
  isWildShaped: false,
  rollMode: 'Auto',
  ac: 15,
  status: [],
  resources: {
    action: true,
    actionUsed: false,
    bonusAction: true,
    bonusActionUsed: false,
    reaction: true,
    reactionUsed: false,
    movementMax: 30,
    movementSpent: 0,
    movementRemaining: 30,
    wildShapeCharges: { current: 0, max: 0 },
    spellSlots: {}
  },
  skillProficiencies: [],
  actions: [
    {
      id: 'atk-scimitar',
      name: 'Scimitar',
      description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 1d6 + 2 slashing damage.',
      type: 'Action',
      actionType: 'Attack',
      attackBonus: 4,
      damageDice: '1d6',
      damageModifier: 2,
      damageType: 'slashing',
      range: '5ft',
      source: 'Item'
    }
  ],
  conditions: [],
  concentration: null,
  deathSaves: { successes: 0, failures: 0 },
  inCombat: true,
  side: 'Enemy',
  portrait: null
};

export const BEAST_WOLF = {
    name: 'Wolf',
    ac: 13,
    hp: 11,
    stats: { STR: 12, DEX: 15, CON: 12 },
    actions: [
        {
            id: 'wolf-bite',
            name: 'Bite',
            description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 10 (2d4 + 2) piercing damage.',
            type: 'Action',
            actionType: 'Attack',
            attackBonus: 4,
            damageDice: '2d4',
            damageModifier: 2,
            damageType: 'piercing',
            source: 'Form'
        }
    ],
    visualUrl: null
};
