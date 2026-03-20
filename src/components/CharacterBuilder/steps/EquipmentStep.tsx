"use client";

import React, { useState } from 'react';
import { Character } from '@/types';
import { EQUIPMENT_LIST, SimpleItem } from '@/data/equipment';

interface EquipmentStepProps {
    char: Character;
    updateEquipment: (item: SimpleItem) => void;
    removeEquipment?: (itemId: string) => void;
    isDMMode?: boolean;
}

const EquipmentStep: React.FC<EquipmentStepProps> = ({ char, updateEquipment, removeEquipment, isDMMode = false }) => {
    const inventory: any[] = char.resources?.inventory || [];
    const [activeSection, setActiveSection] = useState<string>('Weapon');

    const types: SimpleItem['type'][] = ['Weapon', 'Armor', 'Shield', 'Focus'];
    const typeIcons: Record<string, string> = {
        Weapon: 'swords',
        Armor: 'shield',
        Shield: 'security',
        Focus: 'auto_fix_high',
    };
    const typeColors: Record<string, string> = {
        Weapon: 'text-red-400',
        Armor: 'text-blue-400',
        Shield: 'text-cyan-400',
        Focus: 'text-purple-400',
    };

    // For weapons: item may appear multiple times in inventory by id — check count
    const getItemCount = (id: string) => inventory.filter((i: any) => i.id === id).length;
    const isEquipped = (id: string) => inventory.some((i: any) => i.id === id);

    const UNIQUE_SLOT_TYPES = ['Armor', 'Shield'];

    const isProficient = (item: SimpleItem) => {
        if (char.buildMode === 'DM Flexible' || isDMMode) return true;
        if (item.type === 'Focus') return item.authorizedClasses?.includes(char.class) ?? false;
        if (item.type === 'Shield') {
            return ['Fighter', 'Paladin', 'Cleric', 'Druid', 'Ranger', 'Barbarian'].includes(char.class);
        }
        if (item.type === 'Armor') {
            if (item.category === 'Light') return !['Wizard', 'Sorcerer', 'Monk'].includes(char.class);
            if (item.category === 'Medium') return ['Fighter', 'Paladin', 'Cleric', 'Druid', 'Ranger', 'Barbarian'].includes(char.class);
            if (item.category === 'Heavy') return ['Fighter', 'Paladin', 'Cleric'].includes(char.class);
        }
        if (item.type === 'Weapon') {
            if (item.category === 'Simple') return true;
            if (item.category === 'Martial') return ['Fighter', 'Paladin', 'Ranger', 'Barbarian', 'Bard', 'Rogue'].includes(char.class);
        }
        return true;
    };

    const getNonProficientReason = (item: SimpleItem): string | null => {
        if (isDMMode || char.buildMode === 'DM Flexible') return null;
        if (item.type === 'Focus' && !(item.authorizedClasses?.includes(char.class))) {
            return `Requires: ${item.authorizedClasses?.join(', ') || 'specific class'}`;
        }
        if (item.type === 'Shield' && !['Fighter','Paladin','Cleric','Druid','Ranger','Barbarian'].includes(char.class)) {
            return `${char.class} lacks Shield proficiency`;
        }
        if (item.type === 'Armor') {
            if (item.category === 'Heavy' && !['Fighter','Paladin','Cleric'].includes(char.class)) return 'Heavy Armor not proficient';
            if (item.category === 'Medium' && ['Wizard','Sorcerer','Monk','Rogue','Warlock','Bard'].includes(char.class)) return 'Medium Armor not proficient';
        }
        if (item.type === 'Weapon' && item.category === 'Martial' && !['Fighter','Paladin','Ranger','Barbarian','Bard','Rogue'].includes(char.class)) {
            return `${char.class} lacks Martial Weapon proficiency`;
        }
        return null;
    };

    const currentType = activeSection as SimpleItem['type'];
    const visibleItems = isDMMode
        ? EQUIPMENT_LIST.filter(i => i.type === currentType)
        : EQUIPMENT_LIST.filter(i => i.type === currentType && isProficient(i));

    const weaponsCarried = inventory.filter((i: any) => i.type === 'Weapon');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Equip Your Hero</h2>
                    {isDMMode && (
                        <span className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[8px] font-black uppercase tracking-widest">
                            DM Mode — All Items Unlocked
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                    {isDMMode
                        ? 'All equipment available. You can carry multiple weapons simultaneously.'
                        : 'Choose starting gear. You can carry multiple weapons — just one armor set and shield.'}
                </p>
            </div>

            {/* Carrying summary — weapons belt */}
            {weaponsCarried.length > 0 && (
                <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-red-400">swords</span>
                        Weapons Carried ({weaponsCarried.length})
                        <span className="text-slate-600">— only one used per attack action</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {weaponsCarried.map((w: any, idx: number) => (
                            <div key={`${w.id}-${idx}`} className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                                <span className="text-xs font-bold text-red-300">{w.name}</span>
                                {w.damageDice && <span className="text-[10px] text-red-400/70">{w.damageDice}</span>}
                                {removeEquipment && (
                                    <button
                                        onClick={() => removeEquipment(w.id)}
                                        className="ml-1 text-red-500/50 hover:text-red-400 transition-colors"
                                        title="Remove from inventory"
                                    >
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Type tabs */}
            <div className="flex gap-2">
                {types.map(type => {
                    const count = inventory.filter((i: any) => i.type === type).length;
                    return (
                        <button
                            key={type}
                            onClick={() => setActiveSection(type)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
                                activeSection === type
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-sm ${activeSection === type ? 'text-primary' : typeColors[type]}`}>
                                {typeIcons[type]}
                            </span>
                            {type}
                            {count > 0 && (
                                <span className="size-4 rounded-full bg-primary text-black text-[9px] font-black flex items-center justify-center">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Item grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleItems.map(item => {
                    const count = getItemCount(item.id);
                    const active = isEquipped(item.id);
                    const isWeapon = item.type === 'Weapon';
                    const isUnique = UNIQUE_SLOT_TYPES.includes(item.type);
                    const nonProfReason = getNonProficientReason(item);

                    return (
                        <div
                            key={item.id}
                            className={`p-4 rounded-xl border transition-all ${
                                active && isUnique
                                    ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5'
                                    : count > 0 && isWeapon
                                        ? 'bg-red-500/10 border-red-500/30'
                                        : nonProfReason
                                            ? 'bg-red-500/5 border-red-500/20'
                                            : 'bg-gray-800/40 border-gray-700'
                            }`}
                        >
                            {/* Item name + badges */}
                            <div className="font-bold flex justify-between items-start text-sm gap-1 flex-wrap mb-2">
                                <span className="text-slate-100">{item.name}</span>
                                <div className="flex gap-1 flex-wrap">
                                    {isUnique && active && (
                                        <span className="text-[9px] bg-primary text-black px-1.5 py-0.5 rounded font-black uppercase">EQUIPPED</span>
                                    )}
                                    {isWeapon && count > 0 && (
                                        <span className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded font-black uppercase">
                                            ×{count} Carried
                                        </span>
                                    )}
                                    {nonProfReason && (
                                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded border text-amber-400 border-amber-500/30 bg-amber-500/10 uppercase">⚠ No Prof.</span>
                                    )}
                                </div>
                            </div>

                            {nonProfReason && (
                                <p className="text-[8px] text-red-400/70 mb-1.5">{nonProfReason}</p>
                            )}

                            {/* Stats */}
                            {isWeapon && (
                                <div className="text-xs text-gray-400 mb-3 flex gap-2 flex-wrap">
                                    {item.damageDice && <span className="bg-gray-700/50 px-2 py-0.5 rounded text-[10px] text-red-300 font-bold">{item.damageDice} {item.damageType}</span>}
                                    {item.category && <span className="bg-gray-700/50 px-2 py-0.5 rounded text-[10px] uppercase">{item.category}</span>}
                                    {item.properties?.slice(0, 2).map(p => (
                                        <span key={p} className="bg-gray-700/50 px-2 py-0.5 rounded text-[10px] uppercase">{p}</span>
                                    ))}
                                </div>
                            )}
                            {(item.type === 'Armor' || item.type === 'Shield') && (
                                <div className="text-xs text-blue-400 mb-3 font-bold">
                                    {item.type === 'Armor' ? `AC ${item.acBase}${item.dexCap === 0 ? '' : ' + DEX'}` : `+${item.acBase} AC`}
                                    {item.stealthDisadvantage && <span className="ml-2 text-[10px] text-red-400/80 font-normal">Stealth Disadv.</span>}
                                </div>
                            )}
                            {item.type === 'Focus' && (
                                <div className="text-[10px] text-purple-400 font-medium mb-3 uppercase">Spellcasting Focus</div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                {isWeapon ? (
                                    <>
                                        <button
                                            onClick={() => updateEquipment(item)}
                                            className="flex-1 text-[10px] font-black uppercase tracking-widest py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all"
                                        >
                                            + Add to Carry
                                        </button>
                                        {count > 0 && removeEquipment && (
                                            <button
                                                onClick={() => removeEquipment(item.id)}
                                                className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                                                title="Remove one"
                                            >
                                                <span className="material-symbols-outlined text-sm">remove</span>
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (active && removeEquipment) {
                                                removeEquipment(item.id);
                                            } else {
                                                updateEquipment(item);
                                            }
                                        }}
                                        className={`flex-1 text-[10px] font-black uppercase tracking-widest py-1.5 rounded-lg border transition-all ${
                                            active
                                                ? 'bg-primary/15 border-primary/40 text-primary hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                                                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-primary/10 hover:border-primary/30 hover:text-primary'
                                        }`}
                                    >
                                        {active ? 'Unequip' : 'Equip'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {visibleItems.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                    <span className="material-symbols-outlined text-4xl block mb-2">block</span>
                    <p className="text-sm font-bold uppercase">No proficient {activeSection.toLowerCase()} items</p>
                    <p className="text-xs mt-1">Enable DM Mode to see all items</p>
                </div>
            )}

            {/* AC summary footer */}
            <div className="mt-4 bg-gray-900/60 p-4 rounded-xl border border-gray-800/50 flex items-center justify-between">
                <div>
                    <div className="text-xs text-gray-500 uppercase font-black">Estimated Armor Class</div>
                    <div className="text-3xl font-black text-emerald-400">{char.ac}</div>
                </div>
                <div className="text-right text-xs text-gray-500 max-w-xs leading-relaxed italic">
                    Derived from {inventory.map((i: any) => i.name).join(', ') || 'Natural Armor'}. Use the Review page to override if the DM allows.
                </div>
            </div>
        </div>
    );
};

export default EquipmentStep;
