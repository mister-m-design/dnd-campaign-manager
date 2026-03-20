export interface ClassAbility {
    id: string;
    name: string;
    class: string;
    minLevel: number;
    type: 'Active' | 'Passive' | 'Reaction' | 'Bonus Action';
    actionEconomy: 'Action' | 'Bonus Action' | 'Reaction' | 'Passive' | 'Special';
    description: string;
    recharge?: 'Short Rest' | 'Long Rest' | 'Daily' | 'Turn';
    charges?: string; // e.g. "proficiency bonus" or "3 + WIS mod"
}

export const CLASS_ABILITIES: ClassAbility[] = [
    // ══════════════════════════════════════════
    // BARBARIAN
    // ══════════════════════════════════════════
    { id: 'barb-rage', name: 'Rage', class: 'Barbarian', minLevel: 1, type: 'Active', actionEconomy: 'Bonus Action',
      description: 'Enter a rage as a bonus action. Lasts 1 minute. You gain advantage on STR checks and saving throws, bonus damage on melee STR weapon attacks, and resistance to bludgeoning, piercing, and slashing damage.',
      recharge: 'Long Rest', charges: '2 (scales with level)' },
    { id: 'barb-unarmored-defense', name: 'Unarmored Defense', class: 'Barbarian', minLevel: 1, type: 'Passive', actionEconomy: 'Passive',
      description: 'While you are not wearing any armor, your AC equals 10 + DEX modifier + CON modifier. You can use a shield and still gain this benefit.' },
    { id: 'barb-reckless-attack', name: 'Reckless Attack', class: 'Barbarian', minLevel: 2, type: 'Active', actionEconomy: 'Action',
      description: 'Before making an attack roll, choose to attack recklessly. Gain advantage on melee weapon attack rolls using STR during this turn, but attack rolls against you have advantage until your next turn.' },
    { id: 'barb-danger-sense', name: 'Danger Sense', class: 'Barbarian', minLevel: 2, type: 'Passive', actionEconomy: 'Passive',
      description: 'You have advantage on DEX saving throws against effects you can see, such as traps and spells. This benefit is denied if you are blinded, deafened, or incapacitated.' },
    { id: 'barb-extra-attack', name: 'Extra Attack', class: 'Barbarian', minLevel: 5, type: 'Passive', actionEconomy: 'Passive',
      description: 'Beginning at 5th level, you can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    { id: 'barb-fast-movement', name: 'Fast Movement', class: 'Barbarian', minLevel: 5, type: 'Passive', actionEconomy: 'Passive',
      description: 'Your speed increases by 10 feet while you aren\'t wearing heavy armor.' },
    { id: 'barb-feral-instinct', name: 'Feral Instinct', class: 'Barbarian', minLevel: 7, type: 'Passive', actionEconomy: 'Passive',
      description: 'Your instincts are so honed that you have advantage on initiative rolls. Additionally, if you are surprised at the beginning of combat and aren\'t incapacitated, you can act normally on your first turn, but only if you enter your rage before doing anything else.' },
    { id: 'barb-brutal-critical', name: 'Brutal Critical', class: 'Barbarian', minLevel: 9, type: 'Passive', actionEconomy: 'Passive',
      description: 'You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack (scales with level).' },
    { id: 'barb-relentless-rage', name: 'Relentless Rage', class: 'Barbarian', minLevel: 11, type: 'Passive', actionEconomy: 'Passive',
      description: 'If you drop to 0 hit points while you\'re raging and don\'t die outright, you can make a DC 10 CON saving throw. On a success, you drop to 1 hit point instead.' },
    { id: 'barb-persistent-rage', name: 'Persistent Rage', class: 'Barbarian', minLevel: 15, type: 'Passive', actionEconomy: 'Passive',
      description: 'Your rage is so fierce that it ends early only if you fall unconscious or if you choose to end it.' },
    { id: 'barb-primal-champion', name: 'Primal Champion', class: 'Barbarian', minLevel: 20, type: 'Passive', actionEconomy: 'Passive',
      description: 'You embody the power of the wilds. Your STR and CON scores increase by 4. Your maximum for those scores is now 24.' },

    // ══════════════════════════════════════════
    // BARD
    // ══════════════════════════════════════════
    { id: 'bard-bardic-inspiration', name: 'Bardic Inspiration', class: 'Bard', minLevel: 1, type: 'Active', actionEconomy: 'Bonus Action',
      description: 'You can inspire others through stirring words or music. As a bonus action, choose one creature other than yourself within 60 feet who can hear you. That creature gains a Bardic Inspiration die (d6, scaling with level).',
      recharge: 'Long Rest', charges: 'CHA modifier (min 1)' },
    { id: 'bard-jack-of-all-trades', name: 'Jack of All Trades', class: 'Bard', minLevel: 2, type: 'Passive', actionEconomy: 'Passive',
      description: 'Starting at 2nd level, you can add half your proficiency bonus, rounded down, to any ability check you make that doesn\'t already include your proficiency bonus.' },
    { id: 'bard-song-of-rest', name: 'Song of Rest', class: 'Bard', minLevel: 2, type: 'Active', actionEconomy: 'Special',
      description: 'You can use soothing music or oration to help revitalize your wounded allies during a short rest. If you or any friendly creatures who can hear your performance regain hit points at the end of the short rest, each of those creatures regains an extra 1d6 hit points.' },
    { id: 'bard-expertise', name: 'Expertise', class: 'Bard', minLevel: 3, type: 'Passive', actionEconomy: 'Passive',
      description: 'At 3rd level, choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.' },
    { id: 'bard-font-of-inspiration', name: 'Font of Inspiration', class: 'Bard', minLevel: 5, type: 'Passive', actionEconomy: 'Passive',
      description: 'Beginning when you reach 5th level, you regain all of your expended uses of Bardic Inspiration when you finish a short or long rest.' },
    { id: 'bard-countercharm', name: 'Countercharm', class: 'Bard', minLevel: 6, type: 'Active', actionEconomy: 'Action',
      description: 'You gain the ability to use musical notes or words of power to disrupt mind-influencing effects. As an action, you can start a performance that lasts until the end of your next turn. During that time, you and any friendly creatures within 30 feet of you have advantage on saving throws against being frightened or charmed.' },
    { id: 'bard-magical-secrets', name: 'Magical Secrets', class: 'Bard', minLevel: 10, type: 'Passive', actionEconomy: 'Passive',
      description: 'By 10th level, you have plundered magical knowledge from a wide spectrum of disciplines. Choose two spells from any class, including this one. A spell you choose must be of a level you can cast.' },
    { id: 'bard-superior-inspiration', name: 'Superior Inspiration', class: 'Bard', minLevel: 20, type: 'Passive', actionEconomy: 'Passive',
      description: 'At 20th level, when you roll initiative and have no uses of Bardic Inspiration left, you regain one use.' },

    // ══════════════════════════════════════════
    // CLERIC
    // ══════════════════════════════════════════
    { id: 'cleric-channel-divinity', name: 'Channel Divinity', class: 'Cleric', minLevel: 2, type: 'Active', actionEconomy: 'Action',
      description: 'You gain the ability to channel divine energy directly from your deity, using that energy to fuel magical effects. When you use your Channel Divinity, you choose which effect to create.',
      recharge: 'Short Rest', charges: '1 (scales with level)' },
    { id: 'cleric-turn-undead', name: 'Turn Undead', class: 'Cleric', minLevel: 2, type: 'Active', actionEconomy: 'Action',
      description: 'As an action, you present your holy symbol and speak a prayer censuring the undead. Each undead that can see or hear you within 30 feet of you must make a WIS save. If the creature fails its saving throw, it is turned for 1 minute.' },
    { id: 'cleric-destroy-undead', name: 'Destroy Undead', class: 'Cleric', minLevel: 5, type: 'Passive', actionEconomy: 'Passive',
      description: 'Starting at 5th level, when an undead fails its saving throw against your Turn Undead feature, the creature is instantly destroyed if its challenge rating is at or below a certain threshold.' },
    { id: 'cleric-divine-intervention', name: 'Divine Intervention', class: 'Cleric', minLevel: 10, type: 'Active', actionEconomy: 'Action',
      description: 'You can call on your deity to intervene on your behalf when your need is great. As an action, describe the assistance you seek and roll percentile dice. If you roll a number equal to or lower than your cleric level, your deity intervenes.',
      recharge: 'Long Rest' },
    { id: 'cleric-improved-divine-intervention', name: 'Improved Divine Intervention', class: 'Cleric', minLevel: 20, type: 'Passive', actionEconomy: 'Passive',
      description: 'At 20th level, your call for intervention succeeds automatically, no roll required.' },

    // ══════════════════════════════════════════
    // DRUID
    // ══════════════════════════════════════════
    { id: 'druid-wild-shape', name: 'Wild Shape', class: 'Druid', minLevel: 2, type: 'Active', actionEconomy: 'Action',
      description: 'You can use your action to magically assume the shape of a beast that you have seen before. You can use this feature twice, and you regain expended uses when you finish a short or long rest.',
      recharge: 'Short Rest', charges: '2' },
    { id: 'druid-timeless-body', name: 'Timeless Body', class: 'Druid', minLevel: 18, type: 'Passive', actionEconomy: 'Passive',
      description: 'Starting at 18th level, the primal magic that you wield causes you to age more slowly. For every 10 years that pass, your body ages only 1 year.' },
    { id: 'druid-beast-spells', name: 'Beast Spells', class: 'Druid', minLevel: 18, type: 'Passive', actionEconomy: 'Passive',
      description: 'Beginning at 18th level, you can cast many of your druid spells in any shape you assume using Wild Shape. You can perform the somatic and verbal components of a druid spell while in a beast shape.' },
    { id: 'druid-archdruid', name: 'Archdruid', class: 'Druid', minLevel: 20, type: 'Passive', actionEconomy: 'Passive',
      description: 'At 20th level, you can use your Wild Shape an unlimited number of times.' },

    // ══════════════════════════════════════════
    // FIGHTER
    // ══════════════════════════════════════════
    { id: 'fighter-action-surge', name: 'Action Surge', class: 'Fighter', minLevel: 2, type: 'Active', actionEconomy: 'Special',
      description: 'Starting at 2nd level, you can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action on top of your regular action and a possible bonus action.',
      recharge: 'Short Rest', charges: '1 (2 at level 17)' },
    { id: 'fighter-second-wind', name: 'Second Wind', class: 'Fighter', minLevel: 1, type: 'Active', actionEconomy: 'Bonus Action',
      description: 'You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level.',
      recharge: 'Short Rest' },
    { id: 'fighter-extra-attack', name: 'Extra Attack', class: 'Fighter', minLevel: 5, type: 'Passive', actionEconomy: 'Passive',
      description: 'Beginning at 5th level, you can attack twice, instead of once, whenever you take the Attack action on your turn. The number of attacks increases at 11th level (3 attacks) and 20th level (4 attacks).' },
    { id: 'fighter-indomitable', name: 'Indomitable', class: 'Fighter', minLevel: 9, type: 'Active', actionEconomy: 'Reaction',
      description: 'Beginning at 9th level, you can reroll a saving throw that you fail. If you do so, you must use the new roll, and you can\'t use this feature again until you finish a long rest.',
      recharge: 'Long Rest', charges: '1 (2 at 13, 3 at 17)' },

    // ══════════════════════════════════════════
    // MONK
    // ══════════════════════════════════════════
    { id: 'monk-flurry-of-blows', name: 'Flurry of Blows', class: 'Monk', minLevel: 2, type: 'Active', actionEconomy: 'Bonus Action',
      description: 'Immediately after you take the Attack action on your turn, you can spend 1 ki point to make two unarmed strikes as a bonus action.' },
    { id: 'monk-ki', name: 'Ki', class: 'Monk', minLevel: 2, type: 'Active', actionEconomy: 'Special',
      description: 'Your training allows you to harness the mystic energy of ki. Your access to this energy is represented by a number of ki points equal to your monk level.',
      recharge: 'Short Rest', charges: 'Monk level' },
    { id: 'monk-unarmored-movement', name: 'Unarmored Movement', class: 'Monk', minLevel: 2, type: 'Passive', actionEconomy: 'Passive',
      description: 'Your speed increases by 10 feet while you are not wearing armor or wielding a shield. This bonus increases when you reach certain monk levels.' },
    { id: 'monk-deflect-missiles', name: 'Deflect Missiles', class: 'Monk', minLevel: 3, type: 'Reaction', actionEconomy: 'Reaction',
      description: 'You can use your reaction to deflect or catch the missile when you are hit by a ranged weapon attack. When you do so, the damage you take from the attack is reduced by 1d10 + DEX modifier + monk level.' },
    { id: 'monk-slow-fall', name: 'Slow Fall', class: 'Monk', minLevel: 4, type: 'Reaction', actionEconomy: 'Reaction',
      description: 'You can use your reaction when you fall to reduce any falling damage you take by an amount equal to five times your monk level.' },
    { id: 'monk-stunning-strike', name: 'Stunning Strike', class: 'Monk', minLevel: 5, type: 'Active', actionEconomy: 'Special',
      description: 'You can interfere with the flow of ki in an opponent\'s body. When you hit another creature with a melee weapon attack, you can spend 1 ki point to attempt a stunning strike. The target must make a CON save or be stunned until the end of your next turn.' },
    { id: 'monk-extra-attack', name: 'Extra Attack', class: 'Monk', minLevel: 5, type: 'Passive', actionEconomy: 'Passive',
      description: 'Beginning at 5th level, you can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    { id: 'monk-evasion', name: 'Evasion', class: 'Monk', minLevel: 7, type: 'Passive', actionEconomy: 'Passive',
      description: 'Your instinctive agility lets you dodge out of the way of certain area effects. When you are subjected to an effect that allows you to make a DEX save to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.' },
    { id: 'monk-empty-body', name: 'Empty Body', class: 'Monk', minLevel: 18, type: 'Active', actionEconomy: 'Action',
      description: 'You can use your action to spend 4 ki points to become invisible for 1 minute. During that time, you also have resistance to all damage but force damage.',
      recharge: 'Turn' },
    { id: 'monk-perfect-self', name: 'Perfect Self', class: 'Monk', minLevel: 20, type: 'Passive', actionEconomy: 'Passive',
      description: 'When you roll for initiative and have no ki points remaining, you regain 4 ki points.' },

    // ══════════════════════════════════════════
    // PALADIN
    // ══════════════════════════════════════════
    { id: 'paladin-lay-on-hands', name: 'Lay on Hands', class: 'Paladin', minLevel: 1, type: 'Active', actionEconomy: 'Action',
      description: 'Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you take a long rest. With that pool, you can restore a total number of hit points equal to your paladin level × 5.',
      recharge: 'Long Rest', charges: 'Level × 5 HP pool' },
    { id: 'paladin-divine-smite', name: 'Divine Smite', class: 'Paladin', minLevel: 2, type: 'Active', actionEconomy: 'Special',
      description: 'When you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target. The extra damage is 2d8 for a 1st-level slot, plus 1d8 for each spell level above 1st.' },
    { id: 'paladin-divine-health', name: 'Divine Health', class: 'Paladin', minLevel: 3, type: 'Passive', actionEconomy: 'Passive',
      description: 'By 3rd level, the divine magic flowing through you makes you immune to disease.' },
    { id: 'paladin-extra-attack', name: 'Extra Attack', class: 'Paladin', minLevel: 5, type: 'Passive', actionEconomy: 'Passive',
      description: 'Beginning at 5th level, you can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    { id: 'paladin-aura-of-protection', name: 'Aura of Protection', class: 'Paladin', minLevel: 6, type: 'Passive', actionEconomy: 'Passive',
      description: 'Whenever you or a friendly creature within 10 feet of you must make a saving throw, the creature gains a bonus to the saving throw equal to your CHA modifier (minimum +1).' },
    { id: 'paladin-aura-of-courage', name: 'Aura of Courage', class: 'Paladin', minLevel: 10, type: 'Passive', actionEconomy: 'Passive',
      description: 'You and friendly creatures within 10 feet of you can\'t be frightened while you are conscious.' },
    { id: 'paladin-cleansing-touch', name: 'Cleansing Touch', class: 'Paladin', minLevel: 14, type: 'Active', actionEconomy: 'Action',
      description: 'You can use your action to end one spell on yourself or on one willing creature that you touch. You can use this feature a number of times equal to your CHA modifier (minimum 1).',
      recharge: 'Long Rest' },

    // ══════════════════════════════════════════
    // RANGER
    // ══════════════════════════════════════════
    { id: 'ranger-favored-enemy', name: 'Favored Enemy', class: 'Ranger', minLevel: 1, type: 'Passive', actionEconomy: 'Passive',
      description: 'Beginning at 1st level, you have significant experience studying, tracking, hunting, and even talking to a certain type of enemy. Choose a type of favored enemy. You have advantage on Survival checks to track your favored enemies, as well as on Intelligence checks to recall information about them.' },
    { id: 'ranger-natural-explorer', name: 'Natural Explorer', class: 'Ranger', minLevel: 1, type: 'Passive', actionEconomy: 'Passive',
      description: 'You are a master of navigating the natural world. When you make an Intelligence or Wisdom check related to your favored terrain, your proficiency bonus is doubled if you are using a skill that you\'re proficient in.' },
    { id: 'ranger-primeval-awareness', name: 'Primeval Awareness', class: 'Ranger', minLevel: 3, type: 'Active', actionEconomy: 'Action',
      description: 'You can use your action and expend one ranger spell slot to focus your awareness on the region around you. For 1 minute per spell level, you can sense whether certain types of creatures are present within 1 mile.' },
    { id: 'ranger-extra-attack', name: 'Extra Attack', class: 'Ranger', minLevel: 5, type: 'Passive', actionEconomy: 'Passive',
      description: 'Beginning at 5th level, you can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    { id: 'ranger-land-stride', name: "Land's Stride", class: 'Ranger', minLevel: 8, type: 'Passive', actionEconomy: 'Passive',
      description: 'Moving through nonmagical difficult terrain costs you no extra movement. You can also pass through nonmagical plants without being slowed by them and without taking damage from them if they have thorns, spines, or a similar hazard.' },
    { id: 'ranger-hide-in-plain-sight', name: 'Hide in Plain Sight', class: 'Ranger', minLevel: 10, type: 'Active', actionEconomy: 'Action',
      description: 'You can spend 1 minute creating camouflage for yourself. You must have access to fresh mud, dirt, plants, soot, and other naturally occurring materials. Once you are camouflaged in this way, you can try to hide by pressing yourself up against a solid surface. You gain a +10 bonus to Dexterity (Stealth) checks.' },
    { id: 'ranger-vanish', name: 'Vanish', class: 'Ranger', minLevel: 14, type: 'Passive', actionEconomy: 'Passive',
      description: 'Starting at 14th level, you can use the Hide action as a bonus action on your turn. Also, you can\'t be tracked by nonmagical means, unless you choose to leave a trail.' },
    { id: 'ranger-feral-senses', name: 'Feral Senses', class: 'Ranger', minLevel: 18, type: 'Passive', actionEconomy: 'Passive',
      description: 'At 18th level, you gain preternatural senses that help you fight creatures you can\'t see. When you attack a creature you can\'t see, your inability to see it doesn\'t impose disadvantage on your attack rolls against it.' },

    // ══════════════════════════════════════════
    // ROGUE
    // ══════════════════════════════════════════
    { id: 'rogue-sneak-attack', name: 'Sneak Attack', class: 'Rogue', minLevel: 1, type: 'Passive', actionEconomy: 'Passive',
      description: 'Beginning at 1st level, you know how to strike subtly and exploit a foe\'s distraction. Once per turn, you can deal extra damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or ranged weapon. The extra damage scales with level (1d6 at level 1, +1d6 every 2 levels).' },
    { id: 'rogue-cunning-action', name: 'Cunning Action', class: 'Rogue', minLevel: 2, type: 'Active', actionEconomy: 'Bonus Action',
      description: 'Starting at 2nd level, your quick thinking and agility allow you to move and act quickly. You can take a bonus action on each of your turns in combat. This action can be used only to take the Dash, Disengage, or Hide action.' },
    { id: 'rogue-uncanny-dodge', name: 'Uncanny Dodge', class: 'Rogue', minLevel: 5, type: 'Reaction', actionEconomy: 'Reaction',
      description: 'Starting at 5th level, when an attacker that you can see hits you with an attack, you can use your reaction to halve the attack\'s damage against you.' },
    { id: 'rogue-evasion', name: 'Evasion', class: 'Rogue', minLevel: 7, type: 'Passive', actionEconomy: 'Passive',
      description: 'Beginning at 7th level, you can nimbly dodge out of the way of certain area effects. When you are subjected to an effect that allows you to make a DEX saving throw to take only half damage, you instead take no damage if you succeed on the save, and only half damage if you fail.' },
    { id: 'rogue-reliable-talent', name: 'Reliable Talent', class: 'Rogue', minLevel: 11, type: 'Passive', actionEconomy: 'Passive',
      description: 'By 11th level, you have refined your chosen skills until they approach perfection. Whenever you make an ability check that lets you add your proficiency bonus, you can treat a d20 roll of 9 or lower as a 10.' },
    { id: 'rogue-blindsense', name: 'Blindsense', class: 'Rogue', minLevel: 14, type: 'Passive', actionEconomy: 'Passive',
      description: 'Starting at 14th level, if you are able to hear, you are aware of the location of any hidden or invisible creature within 10 feet of you.' },
    { id: 'rogue-slippery-mind', name: 'Slippery Mind', class: 'Rogue', minLevel: 15, type: 'Passive', actionEconomy: 'Passive',
      description: 'By 15th level, you have acquired greater mental strength. You gain proficiency in WIS saving throws.' },
    { id: 'rogue-stroke-of-luck', name: 'Stroke of Luck', class: 'Rogue', minLevel: 20, type: 'Active', actionEconomy: 'Special',
      description: 'At 20th level, you have an uncanny knack for succeeding when you need to. If your attack misses a target within range, you can turn the miss into a hit. Alternatively, if you fail an ability check, you can treat the d20 roll as a 20.',
      recharge: 'Short Rest' },

    // ══════════════════════════════════════════
    // SORCERER
    // ══════════════════════════════════════════
    { id: 'sorc-font-of-magic', name: 'Font of Magic', class: 'Sorcerer', minLevel: 2, type: 'Active', actionEconomy: 'Special',
      description: 'You tap into a deep wellspring of magic within yourself. This source is represented by sorcery points, which allow you to create a variety of magical effects. You have sorcery points equal to your sorcerer level.',
      recharge: 'Long Rest' },
    { id: 'sorc-flexible-casting', name: 'Flexible Casting', class: 'Sorcerer', minLevel: 2, type: 'Active', actionEconomy: 'Special',
      description: 'You can use your sorcery points to gain additional spell slots, or sacrifice spell slots to gain additional sorcery points. You learn other ways to use your sorcery points as you reach higher levels.' },
    { id: 'sorc-metamagic', name: 'Metamagic', class: 'Sorcerer', minLevel: 3, type: 'Passive', actionEconomy: 'Passive',
      description: 'At 3rd level, you gain the ability to twist your spells to suit your needs. You gain two of the following Metamagic options: Careful, Distant, Empowered, Extended, Heightened, Quickened, Subtle, Twinned.' },
    { id: 'sorc-sorcerous-restoration', name: 'Sorcerous Restoration', class: 'Sorcerer', minLevel: 20, type: 'Active', actionEconomy: 'Special',
      description: 'At 20th level, you regain 4 expended sorcery points whenever you finish a short rest.' },

    // ══════════════════════════════════════════
    // WARLOCK
    // ══════════════════════════════════════════
    { id: 'lock-eldritch-invocations', name: 'Eldritch Invocations', class: 'Warlock', minLevel: 2, type: 'Passive', actionEconomy: 'Passive',
      description: 'In your study of occult lore, you have unearthed eldritch invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability. Choose 2 invocations (more as you level up). Examples: Agonizing Blast, Devil\'s Sight, Misty Visions, One with Shadows.' },
    { id: 'lock-pact-boon', name: 'Pact Boon', class: 'Warlock', minLevel: 3, type: 'Passive', actionEconomy: 'Passive',
      description: 'Your otherworldly patron bestows a gift upon you. Choose: Pact of the Chain (find familiar), Pact of the Blade (create magic weapon), or Pact of the Tome (book of shadows with three extra cantrips).' },
    { id: 'lock-mystic-arcanum', name: 'Mystic Arcanum', class: 'Warlock', minLevel: 11, type: 'Active', actionEconomy: 'Action',
      description: 'Your patron bestows upon you a magical secret called an arcanum. Choose one 6th-level spell from the warlock spell list as this arcanum. You can cast your arcanum spell once without expending a spell slot.',
      recharge: 'Long Rest' },
    { id: 'lock-eldritch-master', name: 'Eldritch Master', class: 'Warlock', minLevel: 20, type: 'Active', actionEconomy: 'Special',
      description: 'At 20th level, you can draw on your inner reserve of mystical power while entreating your patron to regain expended spell slots. Spend 1 minute entreating your patron. Regain all expended spell slots from your Pact Magic feature.',
      recharge: 'Long Rest' },

    // ══════════════════════════════════════════
    // WIZARD
    // ══════════════════════════════════════════
    { id: 'wiz-arcane-recovery', name: 'Arcane Recovery', class: 'Wizard', minLevel: 1, type: 'Active', actionEconomy: 'Special',
      description: 'You have learned to regain some of your magical energy by studying your spellbook. Once per day during a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher.',
      recharge: 'Daily' },
    { id: 'wiz-spell-mastery', name: 'Spell Mastery', class: 'Wizard', minLevel: 18, type: 'Passive', actionEconomy: 'Passive',
      description: 'At 18th level, you have achieved such mastery over certain spells that you can cast them at will. Choose a 1st-level and a 2nd-level spell from your spellbook. You can cast those spells at their lowest level without expending a spell slot when you have them prepared.' },
    { id: 'wiz-signature-spells', name: 'Signature Spells', class: 'Wizard', minLevel: 20, type: 'Passive', actionEconomy: 'Passive',
      description: 'When you reach 20th level, you gain mastery over two powerful spells and can cast them with little effort. Choose two 3rd-level wizard spells in your spellbook as your signature spells. You always have these spells prepared, they don\'t count against your number of prepared spells, and you can cast each of them once at 3rd level without expending a spell slot.' },
];

export const MONSTER_ABILITIES: ClassAbility[] = [
    { id: 'mon-frightful-presence', name: 'Frightful Presence', class: 'Monster', minLevel: 1, type: 'Active', actionEconomy: 'Action',
      description: 'Each creature of the monster\'s choice within 120 feet must succeed on a WIS save (DC varies) or be frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.' },
    { id: 'mon-legendary-resistance', name: 'Legendary Resistance', class: 'Monster', minLevel: 1, type: 'Active', actionEconomy: 'Reaction',
      description: 'If the monster fails a saving throw, it can choose to succeed instead. Usable 3 times per day.',
      recharge: 'Daily', charges: '3' },
    { id: 'mon-magic-resistance', name: 'Magic Resistance', class: 'Monster', minLevel: 1, type: 'Passive', actionEconomy: 'Passive',
      description: 'The monster has advantage on saving throws against spells and other magical effects.' },
    { id: 'mon-regeneration', name: 'Regeneration', class: 'Monster', minLevel: 1, type: 'Passive', actionEconomy: 'Passive',
      description: 'The monster regains a set number of hit points at the start of each of its turns. The monster dies only if it starts its turn with 0 hit points and doesn\'t regenerate.' },
    { id: 'mon-pack-tactics', name: 'Pack Tactics', class: 'Monster', minLevel: 1, type: 'Passive', actionEconomy: 'Passive',
      description: 'The monster has advantage on an attack roll against a creature if at least one of the monster\'s allies is adjacent to the creature and the ally isn\'t incapacitated.' },
    { id: 'mon-rampage', name: 'Rampage', class: 'Monster', minLevel: 1, type: 'Active', actionEconomy: 'Bonus Action',
      description: 'When the monster reduces a creature to 0 hit points with a melee attack on its turn, the monster can take a bonus action to move up to half its speed and make a bite attack.' },
];
