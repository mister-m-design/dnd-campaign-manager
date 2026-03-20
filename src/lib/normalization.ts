import { 
  Character, 
  AbilityScores, 
  Ability,
  AbilityModifiers
} from '../types/index';
import { calculateDerivedStats } from './rules';
import { generateSafeId } from './utils';

/**
 * Normalizes a character object to ensure it matches the current Character interface.
 * Handles legacy data formats and ensures all required fields are present.
 */
export function normalizeCharacter(data: any): Character {
  const defaultAbilityScores: AbilityScores = {
    STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10,
  };

  // 1. Handle legacy top-level ability scores
  let abilities = data.abilities || data.abilityScores || { ...defaultAbilityScores };
  if (!data.abilities && !data.abilityScores) {
    if (data.strength !== undefined) abilities.STR = data.strength;
    if (data.dexterity !== undefined) abilities.DEX = data.dexterity;
    if (data.constitution !== undefined) abilities.CON = data.constitution;
    if (data.intelligence !== undefined) abilities.INT = data.intelligence;
    if (data.wisdom !== undefined) abilities.WIS = data.wisdom;
    if (data.charisma !== undefined) abilities.CHA = data.charisma;
  }

  // 2. Extract components with defaults
  const identity = {
    id: data.identity?.id || data.id || generateSafeId(),
    name: data.identity?.name || data.name || 'Unnamed Adventurer',
    species: data.identity?.species || data.species || data.race || 'Unknown',
    background: data.identity?.background || data.background || '',
    alignment: data.identity?.alignment || data.alignment || '',
    appearance: data.identity?.appearance || '',
    personality: data.identity?.personality || '',
    portrait: data.identity?.portrait || data.portrait || '',
  };

  const progression = {
    class: data.progression?.class || data.class || 'Adventurer',
    subclass: data.progression?.subclass || data.subclass || '',
    level: data.progression?.level || data.level || 1,
    experience: data.progression?.experience || data.experience || 0,
    proficiencyBonus: data.progression?.proficiencyBonus || data.proficiencyBonus || 2,
  };

  const maxHP = data.defense?.maxHP || data.maxHP || data.hp || 10;
  const currentHP = data.defense?.currentHP !== undefined ? data.defense.currentHP : (data.currentHP !== undefined ? data.currentHP : maxHP);
  const tempHP = data.defense?.tempHP || data.tempHP || 0;

  const defense = {
    armorClass: data.defense?.armorClass || data.armorClass || 10,
    armorFormulaSource: data.defense?.armorFormulaSource || 'Base',
    hitPoints: {
      current: currentHP,
      max: maxHP,
      temp: tempHP,
    },
    hitDice: {
      current: data.defense?.hitDice?.current || data.level || 1,
      max: data.defense?.hitDice?.max || data.level || 1,
      dieType: data.defense?.hitDice?.dieType || data.hitDie || 'd8',
    },
    deathSaves: {
      successes: data.defense?.deathSaves?.successes || 0,
      failures: data.defense?.deathSaves?.failures || 0,
    },
  };

  const movement = {
    speed: data.movement?.speed || data.speed || 30,
    fly: data.movement?.fly,
    swim: data.movement?.swim,
    climb: data.movement?.climb,
    burrow: data.movement?.burrow,
  };

  const combat = {
    attacks: data.combat?.attacks || [],
    weaponProficiencies: data.combat?.weaponProficiencies || [],
    armorProficiencies: data.combat?.armorProficiencies || [],
    shieldEquipped: data.combat?.shieldEquipped || false,
    equippedArmorId: data.combat?.equippedArmorId || data.equippedArmorId,
    equippedShieldId: data.combat?.equippedShieldId || data.equippedShieldId,
    equippedWeapons: data.combat?.equippedWeapons || [],
    conditions: data.combat?.conditions || [],
    concentration: data.combat?.concentration || null,
    resources: data.combat?.resources || {
      action: false,
      bonusAction: false,
      reaction: false,
      movementSpent: 0,
      movementRemaining: data.movement?.speed || data.speed || 30
    }
  };

  const magic = {
    cantrips: data.magic?.cantrips || [],
    preparedSpells: data.magic?.preparedSpells || data.preparedSpells || data.spellcasting?.preparedSpells || [],
    knownSpells: data.magic?.knownSpells || data.knownSpells || data.spellcasting?.knownSpells || [],
    spellSlots: data.magic?.spellSlots || data.slots || data.spellcasting?.slots || {},
    ritualCasting: data.magic?.ritualCasting || false,
    spellcastingAbility: data.magic?.spellcastingAbility || data.spellcastingAbility || data.spellcasting?.ability,
  };

  const skillsAndSaves = {
    saves: data.skillsAndSaves?.saves || data.savingThrowProficiencies || data.saves || [],
    skillProficiencies: data.skillsAndSaves?.skillProficiencies || data.skillProficiencies || data.skills || [],
    expertise: data.skillsAndSaves?.expertise || data.expertise || [],
  };

  // 3. Construct normalized object
  const normalized: Character = {
    id: identity.id,
    name: identity.name,
    class: progression.class || '',
    level: progression.level || 1,
    ac: defense.armorClass || 10,
    baseAC: defense.armorClass || 10,
    maxHP: defense.hitPoints?.max || 10,
    proficiencyBonus: progression.proficiencyBonus || 2,
    abilityScores: abilities,
    speed: movement.speed || 30,
    actions: data.actions || [],
    skillProficiencies: skillsAndSaves.skillProficiencies || [],
    species: identity.species || '',
    background: identity.background || '',
    alignment: identity.alignment || '',
    identity,
    progression,
    abilities,
    derived: {
      abilityModifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      initiativeBonus: 0,
      passivePerception: 10,
      spellAttackBonus: 0,
      spellSaveDC: 8,
    },
    defense,
    movement,
    combat,
    skillsAndSaves,
    magic,
    resources: data.resources || {},
    featureCategories: {
      classFeatures: data.features?.classFeatures || [],
      subclassFeatures: data.features?.subclassFeatures || [],
      feats: data.features?.feats || [],
      racialTraits: data.features?.racialTraits || [],
      backgroundFeatures: data.features?.backgroundFeatures || [],
    },
    features: data.features && Array.isArray(data.features) ? data.features : [],
    transformation: data.transformation || { activeFormType: 'Normal' },
    notes: data.notes || '',
    metadata: {
      campaignId: data.metadata?.campaignId || data.campaignId,
      ownerUserId: data.metadata?.ownerUserId || data.ownerUserId,
      createdAt: data.metadata?.createdAt || data.createdAt || new Date().toISOString(),
      updatedAt: data.metadata?.updatedAt || data.updatedAt || new Date().toISOString(),
    }
  };

  // Calculate derived stats
  const charWithDerived = calculateDerivedStats(normalized);

  return charWithDerived;
}

/**
 * Normalizes an array of characters.
 */
export function normalizeCharacters(chars: any[]): Character[] {
  if (!Array.isArray(chars)) return [];
  return chars.map(normalizeCharacter);
}
