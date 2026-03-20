
export interface SimpleItem {
    id: string;
    name: string;
    type: 'Armor' | 'Weapon' | 'Shield' | 'Focus' | 'Other';
    category?: 'Light' | 'Medium' | 'Heavy' | 'Simple' | 'Martial';
    description?: string;
    
    // Armor properties
    acFormula?: string;
    acBase?: number;
    dexCap?: number;
    stealthDisadvantage?: boolean;
    strengthRequired?: number;
    
    // Weapon properties
    damageDice?: string;
    damageType?: string;
    properties?: string[];
    range?: string;
    
    // Requirements
    authorizedClasses?: string[];
}

export const EQUIPMENT_LIST: SimpleItem[] = [
    // --- ARMOR ---
    { id: 'leather', name: 'Leather Armor', type: 'Armor', category: 'Light', acBase: 11, dexCap: 99 },
    { id: 'studded-leather', name: 'Studded Leather', type: 'Armor', category: 'Light', acBase: 12, dexCap: 99 },
    
    { id: 'hide', name: 'Hide Armor', type: 'Armor', category: 'Medium', acBase: 12, dexCap: 2 },
    { id: 'scale-mail', name: 'Scale Mail', type: 'Armor', category: 'Medium', acBase: 14, dexCap: 2, stealthDisadvantage: true },
    { id: 'breastplate', name: 'Breastplate', type: 'Armor', category: 'Medium', acBase: 14, dexCap: 2 },
    { id: 'half-plate', name: 'Half Plate', type: 'Armor', category: 'Medium', acBase: 15, dexCap: 2, stealthDisadvantage: true },

    { id: 'ring-mail', name: 'Ring Mail', type: 'Armor', category: 'Heavy', acBase: 14, dexCap: 0 },
    { id: 'chain-mail', name: 'Chain Mail', type: 'Armor', category: 'Heavy', acBase: 16, dexCap: 0, strengthRequired: 13, stealthDisadvantage: true },
    { id: 'splint', name: 'Splint Armor', type: 'Armor', category: 'Heavy', acBase: 17, dexCap: 0, strengthRequired: 15, stealthDisadvantage: true },
    { id: 'plate', name: 'Plate Armor', type: 'Armor', category: 'Heavy', acBase: 18, dexCap: 0, strengthRequired: 15, stealthDisadvantage: true },
    
    // --- SHIELDS ---
    { id: 'shield', name: 'Shield', type: 'Shield', acBase: 2, authorizedClasses: ['Fighter', 'Paladin', 'Cleric', 'Druid', 'Ranger', 'Barbarian'] },
    
    // --- WEAPONS (Simple — Melee) ---
    { id: 'club', name: 'Club', type: 'Weapon', category: 'Simple', damageDice: '1d4', damageType: 'bludgeoning', properties: ['Light'] },
    { id: 'dagger', name: 'Dagger', type: 'Weapon', category: 'Simple', damageDice: '1d4', damageType: 'piercing', properties: ['Finesse', 'Light', 'Thrown'] },
    { id: 'greatclub', name: 'Greatclub', type: 'Weapon', category: 'Simple', damageDice: '1d8', damageType: 'bludgeoning', properties: ['Two-handed'] },
    { id: 'handaxe', name: 'Handaxe', type: 'Weapon', category: 'Simple', damageDice: '1d6', damageType: 'slashing', properties: ['Light', 'Thrown'] },
    { id: 'javelin', name: 'Javelin', type: 'Weapon', category: 'Simple', damageDice: '1d6', damageType: 'piercing', properties: ['Thrown'] },
    { id: 'mace', name: 'Mace', type: 'Weapon', category: 'Simple', damageDice: '1d6', damageType: 'bludgeoning' },
    { id: 'quarterstaff', name: 'Quarterstaff', type: 'Weapon', category: 'Simple', damageDice: '1d6', damageType: 'bludgeoning', properties: ['Versatile (1d8)'] },
    { id: 'sickle', name: 'Sickle', type: 'Weapon', category: 'Simple', damageDice: '1d4', damageType: 'slashing', properties: ['Light'] },
    { id: 'spear', name: 'Spear', type: 'Weapon', category: 'Simple', damageDice: '1d6', damageType: 'piercing', properties: ['Thrown', 'Versatile (1d8)'] },

    // --- WEAPONS (Simple — Ranged) ---
    { id: 'shortbow', name: 'Shortbow', type: 'Weapon', category: 'Simple', damageDice: '1d6', damageType: 'piercing', range: '80/320', properties: ['Two-handed', 'Ammunition'] },
    { id: 'light-crossbow', name: 'Light Crossbow', type: 'Weapon', category: 'Simple', damageDice: '1d8', damageType: 'piercing', range: '80/320', properties: ['Ammunition', 'Loading', 'Two-handed'] },
    { id: 'dart', name: 'Dart', type: 'Weapon', category: 'Simple', damageDice: '1d4', damageType: 'piercing', range: '20/60', properties: ['Finesse', 'Thrown'] },
    { id: 'sling', name: 'Sling', type: 'Weapon', category: 'Simple', damageDice: '1d4', damageType: 'bludgeoning', range: '30/120', properties: ['Ammunition'] },

    // --- WEAPONS (Martial — Melee) ---
    { id: 'battleaxe', name: 'Battleaxe', type: 'Weapon', category: 'Martial', damageDice: '1d8', damageType: 'slashing', properties: ['Versatile (1d10)'] },
    { id: 'flail', name: 'Flail', type: 'Weapon', category: 'Martial', damageDice: '1d8', damageType: 'bludgeoning' },
    { id: 'glaive', name: 'Glaive', type: 'Weapon', category: 'Martial', damageDice: '1d10', damageType: 'slashing', properties: ['Heavy', 'Reach', 'Two-handed'] },
    { id: 'greataxe', name: 'Greataxe', type: 'Weapon', category: 'Martial', damageDice: '1d12', damageType: 'slashing', properties: ['Heavy', 'Two-handed'] },
    { id: 'greatsword', name: 'Greatsword', type: 'Weapon', category: 'Martial', damageDice: '2d6', damageType: 'slashing', properties: ['Heavy', 'Two-handed'] },
    { id: 'halberd', name: 'Halberd', type: 'Weapon', category: 'Martial', damageDice: '1d10', damageType: 'slashing', properties: ['Heavy', 'Reach', 'Two-handed'] },
    { id: 'longsword', name: 'Longsword', type: 'Weapon', category: 'Martial', damageDice: '1d8', damageType: 'slashing', properties: ['Versatile (1d10)'] },
    { id: 'maul', name: 'Maul', type: 'Weapon', category: 'Martial', damageDice: '2d6', damageType: 'bludgeoning', properties: ['Heavy', 'Two-handed'] },
    { id: 'morningstar', name: 'Morningstar', type: 'Weapon', category: 'Martial', damageDice: '1d8', damageType: 'piercing' },
    { id: 'rapier', name: 'Rapier', type: 'Weapon', category: 'Martial', damageDice: '1d8', damageType: 'piercing', properties: ['Finesse'] },
    { id: 'scimitar', name: 'Scimitar', type: 'Weapon', category: 'Martial', damageDice: '1d6', damageType: 'slashing', properties: ['Finesse', 'Light'] },
    { id: 'shortsword', name: 'Shortsword', type: 'Weapon', category: 'Martial', damageDice: '1d6', damageType: 'piercing', properties: ['Finesse', 'Light'] },
    { id: 'trident', name: 'Trident', type: 'Weapon', category: 'Martial', damageDice: '1d6', damageType: 'piercing', properties: ['Thrown', 'Versatile (1d8)'] },
    { id: 'warhammer', name: 'Warhammer', type: 'Weapon', category: 'Martial', damageDice: '1d8', damageType: 'bludgeoning', properties: ['Versatile (1d10)'] },
    { id: 'whip', name: 'Whip', type: 'Weapon', category: 'Martial', damageDice: '1d4', damageType: 'slashing', properties: ['Finesse', 'Reach'] },

    // --- WEAPONS (Martial — Ranged) ---
    { id: 'longbow', name: 'Longbow', type: 'Weapon', category: 'Martial', damageDice: '1d8', damageType: 'piercing', range: '150/600', properties: ['Heavy', 'Two-handed', 'Ammunition'] },
    { id: 'hand-crossbow', name: 'Hand Crossbow', type: 'Weapon', category: 'Martial', damageDice: '1d6', damageType: 'piercing', range: '30/120', properties: ['Ammunition', 'Light', 'Loading'] },
    { id: 'heavy-crossbow', name: 'Heavy Crossbow', type: 'Weapon', category: 'Martial', damageDice: '1d10', damageType: 'piercing', range: '100/400', properties: ['Ammunition', 'Heavy', 'Loading', 'Two-handed'] },
    
    // --- FOCUS ---
    { id: 'holy-symbol', name: 'Holy Symbol', type: 'Focus', authorizedClasses: ['Cleric', 'Paladin'] },
    { id: 'arcane-focus', name: 'Arcane Focus', type: 'Focus', authorizedClasses: ['Wizard', 'Sorcerer', 'Warlock'] },
    { id: 'druidic-focus', name: 'Druidic Focus', type: 'Focus', authorizedClasses: ['Druid', 'Ranger'] }
];
