import React, { useState } from 'react';
import { Character, Ability } from '@/types';
import { calculateModifier } from '@/lib/rules';

interface ReviewStepProps {
    char: Character;
    calculatedChar: Character;
    updateIdentity: (field: keyof Character, value: any) => void;
    updateAbility: (ability: Ability, value: number) => void;
    updateOverride: (field: keyof NonNullable<Character['overrides']>, value: number | undefined) => void;
    onSave?: () => void;
}

const StatCard = ({ 
    label, 
    value, 
    calculatedValue, 
    isOverridden, 
    onToggle, 
    onChange 
}: { 
    label: string, 
    value: number, 
    calculatedValue: number, 
    isOverridden: boolean, 
    onToggle: () => void, 
    onChange: (val: number) => void 
}) => (
    <div className={`p-4 rounded-2xl border transition-all ${isOverridden ? 'bg-amber-500/10 border-amber-500/50' : 'bg-gray-800/40 border-gray-700'}`}>
        <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider font-mono">{label}</span>
            <button 
                onClick={onToggle}
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                    isOverridden 
                        ? 'bg-amber-500 text-black hover:bg-amber-400' 
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
            >
                {isOverridden ? 'MANUAL' : 'AUTO'}
            </button>
        </div>
        
        <div className="flex items-center gap-3">
            <input 
                type="number" 
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                disabled={!isOverridden}
                className={`bg-transparent text-3xl font-black w-20 outline-none transition-opacity ${!isOverridden ? 'opacity-50' : 'opacity-100'}`}
            />
            {!isOverridden && (
                <div className="text-xs text-gray-500 border-l border-gray-700 pl-3">
                    Rules Based: <span className="font-bold text-gray-400">{calculatedValue}</span>
                </div>
            )}
        </div>
    </div>
);

export default function ReviewStep({ char, calculatedChar, updateIdentity, updateAbility, updateOverride, onSave }: ReviewStepProps) {
    const [editingAbilities, setEditingAbilities] = useState(false);

    return (
        <div className="space-y-8 pb-32">
            <div className="flex justify-between items-end border-b border-gray-800 pb-6">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">Review & Refine</h2>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Sanity Check & Manual Overrides</p>
                </div>
                {onSave && (
                    <button 
                        onClick={onSave}
                        className="bg-emerald-500 text-black px-6 py-2 rounded-lg font-black uppercase tracking-tighter hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                    >
                        Save Character
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Identity & Stats */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Identity Bar */}
                    <section className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800 flex flex-wrap gap-8 items-center">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-500">Name</label>
                            <input 
                                value={char.name} 
                                onChange={(e) => updateIdentity('name', e.target.value)}
                                className="bg-transparent border-b border-gray-800 focus:border-emerald-500 outline-none text-xl font-black transition-colors w-full"
                            />
                        </div>
                        <div className="space-y-1 w-20">
                            <label className="text-[9px] font-black uppercase text-gray-500">Level</label>
                            <input 
                                type="number"
                                min={1}
                                max={20}
                                value={char.level} 
                                onChange={(e) => updateIdentity('level', parseInt(e.target.value) || 1)}
                                className="bg-transparent border-b border-gray-800 focus:border-emerald-500 outline-none text-xl font-black transition-colors w-full"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-500">Class</label>
                            <div className="text-xl font-black text-emerald-400">{char.class}</div>
                        </div>
                    </section>

                    {/* Attribute Grid */}
                    <section className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Ability Scores</h3>
                            <button 
                                onClick={() => setEditingAbilities(!editingAbilities)}
                                className={`text-[10px] font-black px-3 py-1 rounded transition-all ${editingAbilities ? 'bg-emerald-500 text-black' : 'hover:bg-gray-800 text-gray-500'}`}
                            >
                                {editingAbilities ? 'FINISH EDITING' : 'EDIT STATS'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as Ability[]).map(ab => {
                                const score = char.abilityScores[ab];
                                const mod = calculateModifier(score);
                                return (
                                    <div key={ab} className={`p-4 rounded-2xl border transition-all ${editingAbilities ? 'bg-gray-800 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-black/40 border-gray-800'}`}>
                                        <div className="text-[10px] font-black text-gray-500 mb-1">{ab}</div>
                                        <div className="flex items-center justify-between">
                                            {editingAbilities ? (
                                                <input 
                                                    type="number"
                                                    value={score}
                                                    onChange={(e) => updateAbility(ab, parseInt(e.target.value) || 0)}
                                                    className="bg-transparent text-2xl font-black w-full outline-none"
                                                />
                                            ) : (
                                                <span className="text-2xl font-black">{score}</span>
                                            )}
                                            <span className={`text-sm font-black ${mod >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {mod >= 0 ? `+${mod}` : mod}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                    
                    {/* Equipment & Features Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Equipment</h3>
                            <div className="space-y-2">
                                {(char.resources?.inventory || []).map((item: any) => (
                                    <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-800/50">
                                        <span className="font-bold">{item.name}</span>
                                        <span className="text-gray-500 text-xs italic">{item.type}</span>
                                    </div>
                                ))}
                                {(!char.resources?.inventory || char.resources.inventory.length === 0) && (
                                    <div className="text-gray-600 italic text-sm py-2">No equipment selected.</div>
                                )}
                            </div>
                        </section>
                        
                        <section className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Spells</h3>
                            <div className="space-y-2">
                                {(char.magic?.spells || []).map((spellId: string) => (
                                    <div key={spellId} className="text-sm font-bold py-1 px-2 bg-gray-800/50 rounded flex justify-between">
                                        {spellId}
                                    </div>
                                ))}
                                {(!char.magic?.spells || char.magic.spells.length === 0) && (
                                    <div className="text-gray-600 italic text-sm py-2">No spells selected.</div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Column 2: Manual Overrides Panel */}
                <div className="space-y-6">
                    <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-700/50 shadow-2xl space-y-6">
                        <div className="border-b border-gray-800 pb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">Combat Overrides</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manual Controls</p>
                        </div>
                        
                        <div className="space-y-4">
                            <StatCard 
                                label="Armor Class"
                                value={calculatedChar.defense?.armorClass || 10}
                                calculatedValue={calculatedChar.ac || 10}
                                isOverridden={char.overrides?.armorClass !== undefined}
                                onToggle={() => updateOverride('armorClass', char.overrides?.armorClass === undefined ? calculatedChar.ac : undefined)}
                                onChange={(val) => updateOverride('armorClass', val)}
                            />
                            
                            <StatCard 
                                label="Hit Points"
                                value={calculatedChar.defense?.hitPoints?.max || 10}
                                calculatedValue={calculatedChar.maxHP || 10}
                                isOverridden={char.overrides?.maxHP !== undefined}
                                onToggle={() => updateOverride('maxHP', char.overrides?.maxHP === undefined ? calculatedChar.maxHP : undefined)}
                                onChange={(val) => updateOverride('maxHP', val)}
                            />
                            
                            <StatCard 
                                label="Movement Speed"
                                value={calculatedChar.speed || 30}
                                calculatedValue={30}
                                isOverridden={char.overrides?.speed !== undefined}
                                onToggle={() => updateOverride('speed', char.overrides?.speed === undefined ? 30 : undefined)}
                                onChange={(val) => updateOverride('speed', val)}
                            />
                            
                            <StatCard 
                                label="Initiative"
                                value={calculatedChar.derived?.initiativeBonus || 0}
                                calculatedValue={calculatedChar.derived?.abilityModifiers?.DEX || 0}
                                isOverridden={char.overrides?.initiative !== undefined}
                                onToggle={() => updateOverride('initiative', char.overrides?.initiative === undefined ? calculatedChar.derived?.abilityModifiers?.DEX : undefined)}
                                onChange={(val) => updateOverride('initiative', val)}
                            />
                        </div>
                        
                        <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800/50">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black uppercase text-gray-500">Spell Save DC</span>
                                <span className="font-black text-xl">
                                    {char.overrides?.spellSaveDC || calculatedChar.derived?.spellSaveDC || 8}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-gray-500">Spell Attack</span>
                                <span className="font-black text-xl text-emerald-400">
                                    +{char.overrides?.spellAttackBonus || calculatedChar.derived?.spellAttackBonus || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10">
                        <h4 className="text-[10px] font-black uppercase text-amber-500/80 tracking-widest mb-2">DM's Final Word</h4>
                        <p className="text-xs text-amber-500/60 leading-relaxed italic">
                            The rules engine handles 5e SRD standards (Leather Armor = 11 + Dex). Use manual mode if your DM provides custom items or special bonuses not covered by standard rules.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
