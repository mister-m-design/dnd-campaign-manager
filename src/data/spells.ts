export interface Spell {
    id: string;
    name: string;
    level: number;
    school: string;
    castingTime: string;
    range: string;
    duration: string;
    concentration: boolean;
    description: string;
    classes: string[];
    components?: string;
    ritual?: boolean;
    // ── Damage / Effect ─────────────────────────────────────────────────────
    damageType?: string;
    damageDice?: string;
    saveType?: string;
    saveEffect?: 'none' | 'half' | 'negated';
    scalingDice?: string;     // e.g. "+1d6" means add 1d6 per slot level above base
    isHealing?: boolean;
    healingDice?: string;
    // ── Targeting ───────────────────────────────────────────────────────────
    targetType?: 'self' | 'single' | 'ally' | 'enemy' | 'area' | 'multiple' | 'none';
    rangeType?: 'self' | 'touch' | 'melee' | 'ranged' | 'sight' | 'unlimited';
    maxTargets?: number;
    // ── AoE ─────────────────────────────────────────────────────────────────
    aoeShape?: 'sphere' | 'cone' | 'cube' | 'line' | 'cylinder';
    aoeSize?: number;         // feet — radius/side/length
    aoeWidth?: number;        // feet — line width or cylinder height
    aoeOrigin?: 'caster' | 'point' | 'target';
    // ── Condition ───────────────────────────────────────────────────────────
    appliesCondition?: string;
    conditionDuration?: number;
    // ── Tags ────────────────────────────────────────────────────────────────
    tags?: string[];
}

const ALL_FULL_CASTERS = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'];

export const SPELL_LIST: Spell[] = [
    // ══════════════════════════════════════════
    // CANTRIPS (Level 0)
    // ══════════════════════════════════════════
    {
        id: 'guidance', name: 'Guidance', level: 0, school: 'Divination',
        castingTime: '1 action', range: 'Touch', duration: '1 minute', concentration: true,
        description: 'Touch one willing creature. Once before the spell ends, the target can roll a d4 and add it to one ability check of its choice.',
        classes: ['Cleric', 'Druid'], components: 'V, S',
    },
    {
        id: 'fire-bolt', name: 'Fire Bolt', level: 0, school: 'Evocation',
        castingTime: '1 action', range: '120 feet', duration: 'Instantaneous', concentration: false,
        description: 'Hurl a mote of fire at a creature or object. Ranged spell attack. On a hit, the target takes 1d10 fire damage (2d10 at 5th, 3d10 at 11th, 4d10 at 17th).',
        classes: ['Wizard', 'Sorcerer'], components: 'V, S', damageType: 'fire', damageDice: '1d10',
    },
    {
        id: 'vicious-mockery', name: 'Vicious Mockery', level: 0, school: 'Enchantment',
        castingTime: '1 action', range: '60 feet', duration: '1 round', concentration: false,
        description: 'Hurl insults laced with enchantments at one creature you can see. WIS save or take 1d4 psychic damage and suffer disadvantage on the next attack roll it makes.',
        classes: ['Bard'], components: 'V', damageType: 'psychic', damageDice: '1d4', saveType: 'WIS',
    },
    {
        id: 'eldritch-blast', name: 'Eldritch Blast', level: 0, school: 'Evocation',
        castingTime: '1 action', range: '120 feet', duration: 'Instantaneous', concentration: false,
        description: 'A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack. On a hit, the target takes 1d10 force damage. Creates additional beams at 5th, 11th, and 17th level.',
        classes: ['Warlock'], components: 'V, S', damageType: 'force', damageDice: '1d10',
    },
    {
        id: 'toll-the-dead', name: 'Toll the Dead', level: 0, school: 'Necromancy',
        castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'Point at one creature you can see within range. WIS save or take 1d8 necrotic damage (1d12 if missing HP).',
        classes: ['Cleric', 'Warlock', 'Wizard'], components: 'V, S', damageType: 'necrotic', damageDice: '1d8', saveType: 'WIS',
    },
    {
        id: 'sacred-flame', name: 'Sacred Flame', level: 0, school: 'Evocation',
        castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'Flame-like radiance descends on a creature you can see within range. DEX save or take 1d8 radiant damage. Ignores cover.',
        classes: ['Cleric'], components: 'V, S', damageType: 'radiant', damageDice: '1d8', saveType: 'DEX',
    },
    {
        id: 'shillelagh', name: 'Shillelagh', level: 0, school: 'Transmutation',
        castingTime: '1 bonus action', range: 'Touch', duration: '1 minute', concentration: false,
        description: 'The wood of a club or quarterstaff you are holding is imbued with nature\'s power. You can use WIS for attack/damage rolls with it, and the damage die becomes a d8.',
        classes: ['Druid'], components: 'V, S, M',
    },
    {
        id: 'prestidigitation', name: 'Prestidigitation', level: 0, school: 'Transmutation',
        castingTime: '1 action', range: '10 feet', duration: '1 hour', concentration: false,
        description: 'Minor magical tricks: create a sensory effect, light or snuff a flame, clean or soil an object, chill/warm/flavor food, create a color/mark, or produce a small trinket.',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, S',
    },
    {
        id: 'mage-hand', name: 'Mage Hand', level: 0, school: 'Conjuration',
        castingTime: '1 action', range: '30 feet', duration: '1 minute', concentration: false,
        description: 'A spectral floating hand appears at a point within range. Can manipulate objects, open doors/containers, store/retrieve items up to 10 lb. Vanishes if more than 30 ft away.',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, S',
    },
    {
        id: 'minor-illusion', name: 'Minor Illusion', level: 0, school: 'Illusion',
        castingTime: '1 action', range: '30 feet', duration: '1 minute', concentration: false,
        description: 'Create a sound or image of an object within range. INT (Investigation) check reveals it as an illusion.',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'S, M',
    },
    {
        id: 'chill-touch', name: 'Chill Touch', level: 0, school: 'Necromancy',
        castingTime: '1 action', range: '120 feet', duration: '1 round', concentration: false,
        description: 'Create a ghostly skeletal hand. Ranged spell attack. On a hit, 1d8 necrotic damage and the target can\'t regain HP until the start of your next turn.',
        classes: ['Sorcerer', 'Warlock', 'Wizard'], components: 'V, S', damageType: 'necrotic', damageDice: '1d8',
    },
    {
        id: 'produce-flame', name: 'Produce Flame', level: 0, school: 'Conjuration',
        castingTime: '1 action', range: 'Self', duration: '10 minutes', concentration: false,
        description: 'A flickering flame appears in your hand, shedding bright light in a 10-ft radius. Can be hurled as a ranged spell attack for 1d8 fire damage (30 ft range).',
        classes: ['Druid'], components: 'V, S', damageType: 'fire', damageDice: '1d8',
    },
    {
        id: 'thunderclap', name: 'Thunderclap', level: 0, school: 'Evocation',
        castingTime: '1 action', range: '5 feet', duration: 'Instantaneous', concentration: false,
        description: 'You create a burst of thunderous sound. Each creature within range (other than you) must succeed on a CON save or take 1d6 thunder damage.',
        classes: ['Bard', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'], components: 'S', damageType: 'thunder', damageDice: '1d6', saveType: 'CON',
    },
    {
        id: 'blade-ward', name: 'Blade Ward', level: 0, school: 'Abjuration',
        castingTime: '1 action', range: 'Self', duration: '1 round', concentration: false,
        description: 'You trace a sigil of warding. Until the end of your next turn, you have resistance against bludgeoning, piercing, and slashing damage from weapon attacks.',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, S',
    },
    {
        id: 'true-strike', name: 'True Strike', level: 0, school: 'Divination',
        castingTime: '1 action', range: '30 feet', duration: 'Up to 1 round', concentration: true,
        description: 'You extend your hand and point a finger at a target in range. Your magic grants you a brief insight into the target\'s defenses. On your next turn, you gain advantage on your first attack roll against the target.',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'S',
    },
    {
        id: 'ray-of-frost', name: 'Ray of Frost', level: 0, school: 'Evocation',
        castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'A frigid beam of blue-white light streaks toward a creature within range. Ranged spell attack. On a hit, 1d8 cold damage and the target\'s speed is reduced by 10 feet until the start of your next turn.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S', damageType: 'cold', damageDice: '1d8',
    },

    // ══════════════════════════════════════════
    // LEVEL 1 SPELLS
    // ══════════════════════════════════════════
    {
        id: 'cure-wounds', name: 'Cure Wounds', level: 1, school: 'Evocation',
        castingTime: '1 action', range: 'Touch', duration: 'Instantaneous', concentration: false,
        description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.',
        classes: ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger'], components: 'V, S',
    },
    {
        id: 'magic-missile', name: 'Magic Missile', level: 1, school: 'Evocation',
        castingTime: '1 action', range: '120 feet', duration: 'Instantaneous', concentration: false,
        description: 'Create three glowing darts of magical force, each dealing 1d4+1 force damage. The darts all strike simultaneously and can hit one or multiple targets.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S', damageType: 'force', damageDice: '1d4',
    },
    {
        id: 'shield', name: 'Shield', level: 1, school: 'Abjuration',
        castingTime: '1 reaction', range: 'Self', duration: '1 round', concentration: false,
        description: 'An invisible barrier of magical force appears and protects you. +5 bonus to AC until the start of your next turn, including against the triggering attack. No damage from magic missile.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S',
    },
    {
        id: 'burning-hands', name: 'Burning Hands', level: 1, school: 'Evocation',
        castingTime: '1 action', range: 'Self (15-ft cone)', duration: 'Instantaneous', concentration: false,
        description: 'A thin sheet of flames shoots from your outstretched fingertips. Each creature in a 15-foot cone must make a DEX save. On a failed save, a creature takes 3d6 fire damage, or half on success.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S', damageType: 'fire', damageDice: '3d6', saveType: 'DEX',
        saveEffect: 'half', targetType: 'area', rangeType: 'self',
        aoeShape: 'cone', aoeSize: 15, aoeOrigin: 'caster', scalingDice: '+1d6', tags: ['damage', 'fire'],
    },
    {
        id: 'chromatic-orb', name: 'Chromatic Orb', level: 1, school: 'Evocation',
        castingTime: '1 action', range: '90 feet', duration: 'Instantaneous', concentration: false,
        description: 'Hurl a 4-inch sphere of energy at a creature. Ranged spell attack. Choose acid, cold, fire, lightning, poison, or thunder — on a hit, the target takes 3d8 damage of that type.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S, M', damageDice: '3d8',
    },
    {
        id: 'hex', name: 'Hex', level: 1, school: 'Enchantment',
        castingTime: '1 bonus action', range: '90 feet', duration: '1 hour', concentration: true,
        description: 'Curse a creature within range. You deal an extra 1d6 necrotic damage whenever you hit it with an attack. Also choose an ability — the target has disadvantage on ability checks with that ability.',
        classes: ['Warlock'], components: 'V, S, M', damageType: 'necrotic', damageDice: '1d6',
    },
    {
        id: 'healing-word', name: 'Healing Word', level: 1, school: 'Evocation',
        castingTime: '1 bonus action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier.',
        classes: ['Bard', 'Cleric', 'Druid'], components: 'V',
    },
    {
        id: 'bless', name: 'Bless', level: 1, school: 'Enchantment',
        castingTime: '1 action', range: '30 feet', duration: '1 minute', concentration: true,
        description: 'Bless up to three creatures. Whenever a target makes an attack roll or saving throw, the target can roll a d4 and add the number rolled to the result.',
        classes: ['Cleric', 'Paladin'], components: 'V, S, M',
    },
    {
        id: 'thunderwave', name: 'Thunderwave', level: 1, school: 'Evocation',
        castingTime: '1 action', range: 'Self (15-ft cube)', duration: 'Instantaneous', concentration: false,
        description: 'A wave of thunderous force sweeps out from you. Each creature in a 15-foot cube must make a CON save. On failure, 2d8 thunder damage and pushed 10 feet. Half damage, not pushed on success.',
        classes: ['Bard', 'Druid', 'Sorcerer', 'Wizard'], components: 'V, S', damageType: 'thunder', damageDice: '2d8', saveType: 'CON',
        saveEffect: 'half', targetType: 'area', rangeType: 'self',
        aoeShape: 'cube', aoeSize: 15, aoeOrigin: 'caster', scalingDice: '+1d8', tags: ['damage', 'thunder', 'push'],
    },
    {
        id: 'charm-person', name: 'Charm Person', level: 1, school: 'Enchantment',
        castingTime: '1 action', range: '30 feet', duration: '1 hour', concentration: false,
        description: 'You attempt to charm a humanoid you can see within range. WIS save or be charmed by you until the spell ends or until you harm the target.',
        classes: ['Bard', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, S', saveType: 'WIS',
    },
    {
        id: 'hunters-mark', name: "Hunter's Mark", level: 1, school: 'Divination',
        castingTime: '1 bonus action', range: '90 feet', duration: '1 hour', concentration: true,
        description: 'Choose a creature and mystically mark it as your quarry. Until the spell ends, you deal an extra 1d6 damage to the target whenever you hit it with a weapon attack.',
        classes: ['Ranger'], components: 'V', damageDice: '1d6',
    },
    {
        id: 'divine-smite', name: 'Divine Smite', level: 1, school: 'Evocation',
        castingTime: '1 bonus action', range: 'Self', duration: 'Instantaneous', concentration: false,
        description: 'When you hit a creature with a melee weapon attack, expend a spell slot to deal extra radiant damage: 2d8 for 1st-level slot, +1d8 per slot level above 1st (max 5d8). +1d8 against undead/fiends.',
        classes: ['Paladin'], components: 'V', damageType: 'radiant', damageDice: '2d8',
    },
    {
        id: 'sleep', name: 'Sleep', level: 1, school: 'Enchantment',
        castingTime: '1 action', range: '90 feet', duration: '1 minute', concentration: false,
        description: 'Roll 5d8; that total is how many HP of creatures this spell can affect. Starting with the lowest HP creature, each affected creature falls unconscious for the duration.',
        classes: ['Bard', 'Sorcerer', 'Wizard'], components: 'V, S, M',
    },
    {
        id: 'inflict-wounds', name: 'Inflict Wounds', level: 1, school: 'Necromancy',
        castingTime: '1 action', range: 'Touch', duration: 'Instantaneous', concentration: false,
        description: 'Make a melee spell attack against a creature you can reach. On a hit, the target takes 3d10 necrotic damage.',
        classes: ['Cleric'], components: 'V, S', damageType: 'necrotic', damageDice: '3d10',
    },
    {
        id: 'wrathful-smite', name: 'Wrathful Smite', level: 1, school: 'Evocation',
        castingTime: '1 bonus action', range: 'Self', duration: '1 minute', concentration: true,
        description: 'The next time you hit with a melee weapon attack, deal an extra 1d6 psychic damage. Additionally, the target must make a WIS save or be frightened of you until the spell ends.',
        classes: ['Paladin'], components: 'V', damageType: 'psychic', damageDice: '1d6', saveType: 'WIS',
    },
    {
        id: 'goodberry', name: 'Goodberry', level: 1, school: 'Transmutation',
        castingTime: '1 action', range: 'Touch', duration: 'Instantaneous', concentration: false,
        description: 'Up to ten berries appear in your hand, infused with magic. Eating a berry restores 1 hit point and provides a day\'s worth of nourishment.',
        classes: ['Druid', 'Ranger'], components: 'V, S, M',
    },
    {
        id: 'heroism', name: 'Heroism', level: 1, school: 'Enchantment',
        castingTime: '1 action', range: 'Touch', duration: '1 minute', concentration: true,
        description: 'A willing creature you touch is imbued with bravery. Until the spell ends, the creature is immune to being frightened and gains temporary hit points equal to your spellcasting modifier at the start of each of its turns.',
        classes: ['Bard', 'Paladin'], components: 'V, S',
    },
    {
        id: 'faerie-fire', name: 'Faerie Fire', level: 1, school: 'Evocation',
        castingTime: '1 action', range: '60 feet', duration: '1 minute', concentration: true,
        description: 'Each object in a 20-foot cube within range is outlined in blue, green, or violet light. Any creature in the area must make a DEX save or also be outlined in light. Attack rolls against an affected creature have advantage.',
        classes: ['Bard', 'Druid'], components: 'V', saveType: 'DEX',
    },
    {
        id: 'animal-friendship', name: 'Animal Friendship', level: 1, school: 'Enchantment',
        castingTime: '1 action', range: '30 feet', duration: '24 hours', concentration: false,
        description: 'This spell lets you convince a beast that you mean it no harm. Choose a beast that you can see within range. WIS save or be charmed by you for the spell\'s duration.',
        classes: ['Bard', 'Druid', 'Ranger'], components: 'V, S, M', saveType: 'WIS',
    },

    // ══════════════════════════════════════════
    // LEVEL 2 SPELLS
    // ══════════════════════════════════════════
    {
        id: 'shatter', name: 'Shatter', level: 2, school: 'Evocation',
        castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'A sudden loud ringing noise erupts from a point of your choice. Each creature in a 10-foot-radius sphere must make a CON save. Takes 3d8 thunder damage on failure, half on success.',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, S, M', damageType: 'thunder', damageDice: '3d8', saveType: 'CON',
        saveEffect: 'half', targetType: 'area', rangeType: 'ranged',
        aoeShape: 'sphere', aoeSize: 10, aoeOrigin: 'point', scalingDice: '+1d8', tags: ['damage', 'thunder'],
    },
    {
        id: 'spiritual-weapon', name: 'Spiritual Weapon', level: 2, school: 'Evocation',
        castingTime: '1 bonus action', range: '60 feet', duration: '1 minute', concentration: false,
        description: 'You create a floating spectral weapon. When cast, and as a bonus action each turn, make a melee spell attack against a creature within 5 feet of it. On a hit, 1d8 + spellcasting modifier force damage.',
        classes: ['Cleric'], components: 'V, S, M', damageType: 'force', damageDice: '1d8',
    },
    {
        id: 'misty-step', name: 'Misty Step', level: 2, school: 'Conjuration',
        castingTime: '1 bonus action', range: 'Self', duration: 'Instantaneous', concentration: false,
        description: 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space you can see.',
        classes: ['Sorcerer', 'Warlock', 'Wizard'], components: 'V',
    },
    {
        id: 'scorching-ray', name: 'Scorching Ray', level: 2, school: 'Evocation',
        castingTime: '1 action', range: '120 feet', duration: 'Instantaneous', concentration: false,
        description: 'Create three rays of fire and hurl them at targets within range. Make a separate ranged spell attack for each ray. On a hit, the target takes 2d6 fire damage.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S', damageType: 'fire', damageDice: '2d6',
    },
    {
        id: 'hold-person', name: 'Hold Person', level: 2, school: 'Enchantment',
        castingTime: '1 action', range: '60 feet', duration: '1 minute', concentration: true,
        description: 'Choose a humanoid that you can see within range. The target must succeed on a WIS save or be paralyzed for the duration. At end of each of its turns, the target can repeat the save.',
        classes: ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, S, M', saveType: 'WIS',
    },
    {
        id: 'invisibility', name: 'Invisibility', level: 2, school: 'Illusion',
        castingTime: '1 action', range: 'Touch', duration: '1 hour', concentration: true,
        description: 'A creature you touch becomes invisible until the spell ends. The spell ends for a target that attacks or casts a spell.',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, S, M',
    },
    {
        id: 'mirror-image', name: 'Mirror Image', level: 2, school: 'Illusion',
        castingTime: '1 action', range: 'Self', duration: '1 minute', concentration: false,
        description: 'Three illusory duplicates of yourself appear in your space. When a creature targets you with an attack, roll a d20 to determine whether the attack instead targets one of your duplicates.',
        classes: ['Sorcerer', 'Warlock', 'Wizard'], components: 'V, S',
    },
    {
        id: 'web', name: 'Web', level: 2, school: 'Conjuration',
        castingTime: '1 action', range: '60 feet', duration: '1 hour', concentration: true,
        description: 'You conjure a mass of thick, sticky webbing at a point within range filling a 20-foot cube. Each creature in that area must make a DEX save or be restrained.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S, M', saveType: 'DEX',
        saveEffect: 'negated', targetType: 'area', rangeType: 'ranged',
        aoeShape: 'cube', aoeSize: 20, aoeOrigin: 'point',
        appliesCondition: 'Restrained', tags: ['control', 'restrain'],
    },
    {
        id: 'moonbeam', name: 'Moonbeam', level: 2, school: 'Evocation',
        castingTime: '1 action', range: '120 feet', duration: '1 minute', concentration: true,
        description: 'A silvery beam of pale light shines down in a 5-ft-radius cylinder. Creatures that enter or start their turn there must make a CON save or take 2d10 radiant damage.',
        classes: ['Druid'], components: 'V, S, M', damageType: 'radiant', damageDice: '2d10', saveType: 'CON',
        saveEffect: 'half', targetType: 'area', rangeType: 'ranged',
        aoeShape: 'cylinder', aoeSize: 5, aoeWidth: 40, aoeOrigin: 'point', scalingDice: '+1d10', tags: ['damage', 'radiant'],
    },
    {
        id: 'prayer-of-healing', name: 'Prayer of Healing', level: 2, school: 'Evocation',
        castingTime: '10 minutes', range: '30 feet', duration: 'Instantaneous', concentration: false,
        description: 'Up to six creatures of your choice that you can see within range each regain hit points equal to 2d8 + your spellcasting ability modifier.',
        classes: ['Cleric'], components: 'V',
    },
    {
        id: 'silence', name: 'Silence', level: 2, school: 'Illusion',
        castingTime: '1 action', range: '120 feet', duration: '10 minutes', concentration: true,
        description: 'For the duration, no sound can be created within or pass through a 20-foot-radius sphere centered on a point you choose within range. Any creature or object entirely inside the sphere is immune to thunder damage.',
        classes: ['Bard', 'Cleric', 'Ranger'], components: 'V, S',
    },
    {
        id: 'suggestion', name: 'Suggestion', level: 2, school: 'Enchantment',
        castingTime: '1 action', range: '30 feet', duration: '8 hours', concentration: true,
        description: 'You suggest a course of activity (limited to a sentence or two) to a creature you can see within range that can hear and understand you. WIS save or the target must pursue the course of action.',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, M', saveType: 'WIS',
    },

    // ══════════════════════════════════════════
    // LEVEL 3 SPELLS
    // ══════════════════════════════════════════
    {
        id: 'fireball', name: 'Fireball', level: 3, school: 'Evocation',
        castingTime: '1 action', range: '150 feet', duration: 'Instantaneous', concentration: false,
        description: 'A bright streak flashes to a point you choose within range and blossoms into an explosion of flame. Each creature in a 20-foot-radius sphere must make a DEX save. A target takes 8d6 fire damage on a failed save, or half on success.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S, M', damageType: 'fire', damageDice: '8d6', saveType: 'DEX',
        saveEffect: 'half', targetType: 'area', rangeType: 'ranged',
        aoeShape: 'sphere', aoeSize: 20, aoeOrigin: 'point', scalingDice: '+1d6', tags: ['damage', 'fire'],
    },
    {
        id: 'lightning-bolt', name: 'Lightning Bolt', level: 3, school: 'Evocation',
        castingTime: '1 action', range: 'Self (100-ft line)', duration: 'Instantaneous', concentration: false,
        description: 'A stroke of lightning forms a line 100 feet long and 5 feet wide blasting from you. Each creature in the line must make a DEX save. A creature takes 8d6 lightning damage on a failed save, or half on success.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S, M', damageType: 'lightning', damageDice: '8d6', saveType: 'DEX',
        saveEffect: 'half', targetType: 'area', rangeType: 'self',
        aoeShape: 'line', aoeSize: 100, aoeWidth: 5, aoeOrigin: 'caster', scalingDice: '+1d6', tags: ['damage', 'lightning'],
    },
    {
        id: 'counterspell', name: 'Counterspell', level: 3, school: 'Abjuration',
        castingTime: '1 reaction', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'Attempt to interrupt a creature casting a spell of 3rd level or lower. Its spell fails. If casting a spell of 4th+ level, make a spellcasting ability check (DC 10 + spell level) to negate it.',
        classes: ['Sorcerer', 'Warlock', 'Wizard'], components: 'S',
    },
    {
        id: 'hypnotic-pattern', name: 'Hypnotic Pattern', level: 3, school: 'Illusion',
        castingTime: '1 action', range: '120 feet', duration: '1 minute', concentration: true,
        description: 'A twisting pattern of colors weaves through the air inside a 30-foot cube. Each creature in that area must make a WIS save. On a failed save, the creature becomes incapacitated and has a speed of 0.',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'S, M', saveType: 'WIS',
        saveEffect: 'negated', targetType: 'area', rangeType: 'ranged',
        aoeShape: 'cube', aoeSize: 30, aoeOrigin: 'point',
        appliesCondition: 'Incapacitated', conditionDuration: 10, tags: ['control', 'incapacitate'],
    },
    {
        id: 'animate-dead', name: 'Animate Dead', level: 3, school: 'Necromancy',
        castingTime: '1 minute', range: '10 feet', duration: '24 hours', concentration: false,
        description: 'Choose a pile of bones or a corpse of a Medium or Small humanoid within range. Your spell imbues the target with a foul mimicry of life, raising it as a zombie or skeleton.',
        classes: ['Cleric', 'Wizard'], components: 'V, S, M',
    },
    {
        id: 'spirit-guardians', name: 'Spirit Guardians', level: 3, school: 'Conjuration',
        castingTime: '1 action', range: 'Self (15-ft radius)', duration: '10 minutes', concentration: true,
        description: 'You call forth spirits to protect you. Creatures that enter or start their turn in a 15-foot aura must make a WIS save. On failure, 3d8 radiant (or necrotic) damage, half on success.',
        classes: ['Cleric'], components: 'V, S, M', damageType: 'radiant', damageDice: '3d8', saveType: 'WIS',
        saveEffect: 'half', targetType: 'area', rangeType: 'self',
        aoeShape: 'sphere', aoeSize: 15, aoeOrigin: 'caster', scalingDice: '+1d8', tags: ['damage', 'radiant', 'aura'],
    },
    {
        id: 'call-lightning', name: 'Call Lightning', level: 3, school: 'Conjuration',
        castingTime: '1 action', range: '120 feet', duration: '10 minutes', concentration: true,
        description: 'A storm cloud appears above you. Each turn as an action, you can call down lightning on a point below the cloud. Each creature within 5 feet of that point must make a DEX save or take 3d10 lightning damage.',
        classes: ['Druid'], components: 'V, S', damageType: 'lightning', damageDice: '3d10', saveType: 'DEX',
    },
    {
        id: 'hunger-of-hadar', name: 'Hunger of Hadar', level: 3, school: 'Conjuration',
        castingTime: '1 action', range: '150 feet', duration: '1 minute', concentration: true,
        description: 'You open a gateway to the void between stars. A 20-foot-radius sphere of blackness and bitter cold appears. Creatures that start their turn inside must make a DEX save or take 2d6 cold damage.',
        classes: ['Warlock'], components: 'V, S, M', damageType: 'cold', damageDice: '2d6', saveType: 'DEX',
        saveEffect: 'negated', targetType: 'area', rangeType: 'ranged',
        aoeShape: 'sphere', aoeSize: 20, aoeOrigin: 'point', tags: ['damage', 'cold', 'control', 'darkness'],
    },
    {
        id: 'plant-growth', name: 'Plant Growth', level: 3, school: 'Transmutation',
        castingTime: '1 action', range: '150 feet', duration: 'Instantaneous', concentration: false,
        description: 'Plants in a 100-foot radius centered on a point you choose become overgrown, creating difficult terrain. Each creature moving through must spend 4 feet of movement for every 1 foot it moves.',
        classes: ['Bard', 'Druid', 'Ranger'], components: 'V, S',
    },
    {
        id: 'speak-with-dead', name: 'Speak with Dead', level: 3, school: 'Necromancy',
        castingTime: '1 action', range: '10 feet', duration: '10 minutes', concentration: false,
        description: 'You grant the semblance of life and intelligence to a corpse within range, allowing it to answer up to five questions you pose.',
        classes: ['Bard', 'Cleric'], components: 'V, S, M',
    },
    {
        id: 'mass-healing-word', name: 'Mass Healing Word', level: 3, school: 'Evocation',
        castingTime: '1 bonus action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'As you call out words of restoration, up to six creatures of your choice that you can see within range regain hit points equal to 1d4 + your spellcasting ability modifier.',
        classes: ['Cleric'], components: 'V',
    },

    // ══════════════════════════════════════════
    // LEVEL 4 SPELLS
    // ══════════════════════════════════════════
    {
        id: 'banishment', name: 'Banishment', level: 4, school: 'Abjuration',
        castingTime: '1 action', range: '60 feet', duration: '1 minute', concentration: true,
        description: 'You attempt to send one creature that you can see within range to another plane of existence. The target must succeed on a CHA save or be banished.',
        classes: ['Cleric', 'Paladin', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, S, M', saveType: 'CHA',
    },
    {
        id: 'greater-invisibility', name: 'Greater Invisibility', level: 4, school: 'Illusion',
        castingTime: '1 action', range: 'Touch', duration: '1 minute', concentration: true,
        description: 'You or a creature you touch becomes invisible until the spell ends. Unlike Invisibility, the spell doesn\'t end if the target attacks or casts a spell.',
        classes: ['Bard', 'Sorcerer', 'Wizard'], components: 'V, S',
    },
    {
        id: 'polymorph', name: 'Polymorph', level: 4, school: 'Transmutation',
        castingTime: '1 action', range: '60 feet', duration: '1 hour', concentration: true,
        description: 'This spell transforms a creature into a new form. An unwilling creature must make a WIS save to avoid the effect. The transformation lasts for the duration, or until the target drops to 0 hit points.',
        classes: ['Bard', 'Druid', 'Sorcerer', 'Wizard'], components: 'V, S, M', saveType: 'WIS',
    },
    {
        id: 'ice-storm', name: 'Ice Storm', level: 4, school: 'Evocation',
        castingTime: '1 action', range: '300 feet', duration: 'Instantaneous', concentration: false,
        description: 'A hail of rock-hard ice pounds down in a 20-ft-radius, 40-ft-high cylinder. Each creature must make a DEX save. On failure: 2d8 bludgeoning + 4d6 cold damage. Half on success.',
        classes: ['Druid', 'Sorcerer', 'Wizard'], components: 'V, S, M', damageType: 'cold', damageDice: '4d6', saveType: 'DEX',
        saveEffect: 'half', targetType: 'area', rangeType: 'ranged',
        aoeShape: 'cylinder', aoeSize: 20, aoeWidth: 40, aoeOrigin: 'point', tags: ['damage', 'cold', 'bludgeoning'],
    },
    {
        id: 'dimension-door', name: 'Dimension Door', level: 4, school: 'Conjuration',
        castingTime: '1 action', range: '500 feet', duration: 'Instantaneous', concentration: false,
        description: 'You teleport from your current location to any other spot within range. You can also bring one willing creature with you (Medium or smaller).',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V',
    },
    {
        id: 'black-tentacles', name: "Evard's Black Tentacles", level: 4, school: 'Conjuration',
        castingTime: '1 action', range: '90 feet', duration: '1 minute', concentration: true,
        description: 'Squirming, ebony tentacles fill a 20-foot square on ground you can see within range. Each creature in that area must make a DEX save. On a failed save, the creature is restrained. Restrained creatures take 3d6 bludgeoning damage at the start of each of their turns.',
        classes: ['Wizard'], components: 'V, S, M', damageType: 'bludgeoning', damageDice: '3d6', saveType: 'DEX',
    },
    {
        id: 'guardian-of-faith', name: 'Guardian of Faith', level: 4, school: 'Conjuration',
        castingTime: '1 action', range: '30 feet', duration: '8 hours', concentration: false,
        description: 'A Large spectral guardian appears and hovers for the duration in an unoccupied space of your choice. The guardian occupies that space and is indistinct. Any creature hostile to you that moves within 10 feet must make a DEX save or take 20 radiant damage.',
        classes: ['Cleric'], components: 'V', damageType: 'radiant',
    },

    // ══════════════════════════════════════════
    // LEVEL 5 SPELLS
    // ══════════════════════════════════════════
    {
        id: 'cone-of-cold', name: 'Cone of Cold', level: 5, school: 'Evocation',
        castingTime: '1 action', range: 'Self (60-ft cone)', duration: 'Instantaneous', concentration: false,
        description: 'A blast of cold air erupts from your hands. Each creature in a 60-foot cone must make a CON save. A creature takes 8d8 cold damage on a failed save, or half on success.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S, M', damageType: 'cold', damageDice: '8d8', saveType: 'CON',
        saveEffect: 'half', targetType: 'area', rangeType: 'self',
        aoeShape: 'cone', aoeSize: 60, aoeOrigin: 'caster', scalingDice: '+1d8', tags: ['damage', 'cold'],
    },
    {
        id: 'hold-monster', name: 'Hold Monster', level: 5, school: 'Enchantment',
        castingTime: '1 action', range: '90 feet', duration: '1 minute', concentration: true,
        description: 'Choose a creature you can see within range. WIS save or be paralyzed for the duration. Affects any creature type (unlike Hold Person).',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, S, M', saveType: 'WIS',
    },
    {
        id: 'mass-cure-wounds', name: 'Mass Cure Wounds', level: 5, school: 'Evocation',
        castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'A wave of healing energy washes out. Choose up to 6 creatures in a 30-foot-radius sphere. Each target regains hit points equal to 3d8 + your spellcasting ability modifier.',
        classes: ['Bard', 'Cleric', 'Druid'], components: 'V, S',
    },
    {
        id: 'wall-of-force', name: 'Wall of Force', level: 5, school: 'Evocation',
        castingTime: '1 action', range: '120 feet', duration: '10 minutes', concentration: true,
        description: 'An invisible wall of force springs into existence. The wall blocks spells and magical effects. Nothing can physically pass through it.',
        classes: ['Wizard'], components: 'V, S, M',
    },
    {
        id: 'flame-strike', name: 'Flame Strike', level: 5, school: 'Evocation',
        castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'A vertical column of divine fire roars down in a 10-ft-radius, 40-ft-high cylinder. Each creature must make a DEX save. On failure: 4d6 fire + 4d6 radiant damage. Half on success.',
        classes: ['Cleric'], components: 'V, S, M', damageType: 'fire', damageDice: '4d6', saveType: 'DEX',
    },
    {
        id: 'dispel-evil-and-good', name: 'Dispel Evil and Good', level: 5, school: 'Abjuration',
        castingTime: '1 action', range: 'Self', duration: '1 minute', concentration: true,
        description: 'Shimmering energy surrounds and protects you from fey, undead, and creatures from outside the Material Plane. Those creatures have disadvantage on attack rolls against you.',
        classes: ['Cleric', 'Paladin'], components: 'V, S, M',
    },
    {
        id: 'destructive-wave', name: 'Destructive Wave', level: 5, school: 'Evocation',
        castingTime: '1 action', range: 'Self (30-ft radius)', duration: 'Instantaneous', concentration: false,
        description: 'You strike the ground creating a burst of divine energy that ripples outward. Each creature you choose within 30 feet must make a CON save. On failure: 5d6 thunder + 5d6 radiant or necrotic damage.',
        classes: ['Paladin'], components: 'V', damageType: 'thunder', damageDice: '5d6', saveType: 'CON',
    },

    // ══════════════════════════════════════════
    // LEVEL 6 SPELLS
    // ══════════════════════════════════════════
    {
        id: 'chain-lightning', name: 'Chain Lightning', level: 6, school: 'Evocation',
        castingTime: '1 action', range: '150 feet', duration: 'Instantaneous', concentration: false,
        description: 'You create a bolt of lightning that arcs toward a target. Three bolts then spring from that target, each striking a different target. All targets must make a DEX save or take 10d8 lightning damage, half on success.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S, M', damageType: 'lightning', damageDice: '10d8', saveType: 'DEX',
    },
    {
        id: 'true-seeing', name: 'True Seeing', level: 6, school: 'Divination',
        castingTime: '1 action', range: 'Touch', duration: '1 hour', concentration: false,
        description: 'You give the willing creature you touch the ability to see things as they actually are. The creature has truesight, notices secret doors, and can see into the Ethereal Plane, all out to a range of 120 feet.',
        classes: ['Bard', 'Cleric', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, S, M',
    },
    {
        id: 'disintegrate', name: 'Disintegrate', level: 6, school: 'Transmutation',
        castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'A thin green ray springs from your finger. The target must make a DEX save. On failure: 10d6+40 force damage. A creature reduced to 0 HP by this damage is completely disintegrated.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S, M', damageType: 'force', damageDice: '10d6', saveType: 'DEX',
    },
    {
        id: 'heal', name: 'Heal', level: 6, school: 'Evocation',
        castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'Choose a creature that you can see within range. A surge of positive energy washes through the creature, causing it to regain 70 hit points. This spell also ends blindness, deafness, and any diseases affecting the target.',
        classes: ['Cleric', 'Druid'], components: 'V, S',
    },

    // ══════════════════════════════════════════
    // LEVEL 7 SPELLS
    // ══════════════════════════════════════════
    {
        id: 'fire-storm', name: 'Fire Storm', level: 7, school: 'Evocation',
        castingTime: '1 action', range: '150 feet', duration: 'Instantaneous', concentration: false,
        description: 'A storm made up of sheets of roaring flame appears in up to ten 10-foot cubes. Each creature in the area must make a DEX save. A creature takes 7d10 fire damage on a failed save, or half on success.',
        classes: ['Cleric', 'Druid', 'Sorcerer'], components: 'V, S', damageType: 'fire', damageDice: '7d10', saveType: 'DEX',
    },
    {
        id: 'teleport', name: 'Teleport', level: 7, school: 'Conjuration',
        castingTime: '1 action', range: '10 feet', duration: 'Instantaneous', concentration: false,
        description: 'This spell instantly transports you and up to eight willing creatures to a destination you select. If you are very familiar with the destination, the arrival is near-perfect.',
        classes: ['Bard', 'Sorcerer', 'Wizard'], components: 'V',
    },
    {
        id: 'finger-of-death', name: 'Finger of Death', level: 7, school: 'Necromancy',
        castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'You send negative energy coursing through a creature you can see. CON save or take 7d8+30 necrotic damage, half on success. A humanoid killed by this spell rises as a zombie under your command.',
        classes: ['Sorcerer', 'Warlock', 'Wizard'], components: 'V, S', damageType: 'necrotic', damageDice: '7d8', saveType: 'CON',
    },
    {
        id: 'divine-word', name: 'Divine Word', level: 7, school: 'Evocation',
        castingTime: '1 bonus action', range: '30 feet', duration: 'Instantaneous', concentration: false,
        description: 'You utter a divine word, imbued with the power that shaped the world at the dawn of creation. Choose any number of creatures you can see within range. Each creature that can hear you must make a CHA save. On failure, effects based on remaining HP.',
        classes: ['Cleric'], components: 'V', saveType: 'CHA',
    },

    // ══════════════════════════════════════════
    // LEVEL 8 SPELLS
    // ══════════════════════════════════════════
    {
        id: 'incendiary-cloud', name: 'Incendiary Cloud', level: 8, school: 'Conjuration',
        castingTime: '1 action', range: '150 feet', duration: '1 minute', concentration: true,
        description: 'A swirling cloud of smoke shot through with white-hot embers fills a 20-foot-radius sphere. When the cloud appears and at the start of each of your turns, each creature in the cloud must make a DEX save. A creature takes 10d8 fire damage on a failed save, or half on success.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S', damageType: 'fire', damageDice: '10d8', saveType: 'DEX',
    },
    {
        id: 'dominate-monster', name: 'Dominate Monster', level: 8, school: 'Enchantment',
        castingTime: '1 action', range: '60 feet', duration: '1 hour', concentration: true,
        description: 'You attempt to beguile a creature you can see within range. WIS save or be charmed by you for the duration. While charmed, you have a telepathic link with it. You can command it to take specific actions.',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V, S', saveType: 'WIS',
    },
    {
        id: 'holy-aura', name: 'Holy Aura', level: 8, school: 'Abjuration',
        castingTime: '1 action', range: 'Self', duration: '1 minute', concentration: true,
        description: 'Divine light washes out from you and coalesces in a soft radiance in a 30-foot radius around you. Creatures of your choice in that radius have advantage on all saving throws and other creatures have disadvantage on attack rolls against them.',
        classes: ['Cleric'], components: 'V, S, M',
    },

    // ══════════════════════════════════════════
    // LEVEL 9 SPELLS
    // ══════════════════════════════════════════
    {
        id: 'wish', name: 'Wish', level: 9, school: 'Conjuration',
        castingTime: '1 action', range: 'Self', duration: 'Instantaneous', concentration: false,
        description: 'Wish is the mightiest spell a mortal creature can cast. By simply speaking aloud, you can alter the very foundations of reality in any way you can conceive.',
        classes: ALL_FULL_CASTERS, components: 'V',
    },
    {
        id: 'meteor-swarm', name: 'Meteor Swarm', level: 9, school: 'Evocation',
        castingTime: '1 action', range: '1 mile', duration: 'Instantaneous', concentration: false,
        description: 'Blazing orbs of fire plummet to four different points you can see. Each creature in a 40-foot-radius sphere centered on each impact point must make a DEX save. A creature takes 20d6 fire + 20d6 bludgeoning damage on a failed save, or half on success.',
        classes: ['Sorcerer', 'Wizard'], components: 'V, S', damageType: 'fire', damageDice: '20d6', saveType: 'DEX',
    },
    {
        id: 'true-resurrection', name: 'True Resurrection', level: 9, school: 'Necromancy',
        castingTime: '1 hour', range: 'Touch', duration: 'Instantaneous', concentration: false,
        description: 'You touch a creature that has been dead for no longer than 200 years and that died for any reason except old age. If the creature\'s soul is free and willing, the creature is restored to life with all its hit points.',
        classes: ['Cleric', 'Druid'], components: 'V, S, M',
    },
    {
        id: 'power-word-kill', name: 'Power Word Kill', level: 9, school: 'Enchantment',
        castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', concentration: false,
        description: 'You utter a word of power that can compel one creature you can see within range to die instantly. If the creature has 100 hit points or fewer, it dies. Otherwise, the spell has no effect.',
        classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'], components: 'V',
    },
    {
        id: 'time-stop', name: 'Time Stop', level: 9, school: 'Transmutation',
        castingTime: '1 action', range: 'Self', duration: 'Instantaneous', concentration: false,
        description: 'You briefly stop the flow of time for everyone but yourself. No time passes for other creatures, while you take 1d4+1 turns in a row, during which you can use actions and move as normal.',
        classes: ['Sorcerer', 'Wizard'], components: 'V',
    },
];
