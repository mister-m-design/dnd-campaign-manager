import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, Zap, Shield, Swords, Wand2, Info } from 'lucide-react';
import monsterData from '../data/monsters.json';
import { CombatantState, Action } from '@/types';

interface DMAddElementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMonster: (monster: any) => void;
    onReplaceActions: (monster: any) => void;
    selectedCombatant?: CombatantState | null;
}

export const DMAddElementModal: React.FC<DMAddElementModalProps> = ({
    isOpen,
    onClose,
    onAddMonster,
    onReplaceActions,
    selectedCombatant
}) => {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('All');

    const monsterTypes = useMemo(() => {
        const types = new Set(monsterData.map(m => m.type));
        return ['All', ...Array.from(types)].sort();
    }, []);

    const filteredMonsters = useMemo(() => {
        return monsterData.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
            const matchesType = filterType === 'All' || m.type === filterType;
            return matchesSearch && matchesType;
        }).slice(0, 50); // Limit to 50 for performance
    }, [search, filterType]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-4xl h-[80vh] bg-slate-900 border border-purple-500/30 rounded-[2.5rem] shadow-[0_20px_50px_rgba(168,85,247,0.2)] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                            <Wand2 className="w-6 h-6 text-purple-400" />
                            Bestiary & DM Toolkit
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Summon creatures or borrow their powers</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 rounded-2xl hover:bg-white/5 transition-colors text-slate-400"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 bg-black/20 flex gap-4 border-b border-white/5">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input 
                            autoFocus
                            type="text"
                            placeholder="Search the Mythic Bestiary..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-slate-950 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
                        />
                    </div>
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-12 px-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500/50"
                    >
                        {monsterTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredMonsters.map(monster => (
                            <MonsterCard 
                                key={monster.id} 
                                monster={monster} 
                                onAdd={() => onAddMonster(monster)}
                                onReplace={() => onReplaceActions(monster)}
                                canReplace={!!selectedCombatant}
                            />
                        ))}
                    </div>
                    {filteredMonsters.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 py-20">
                            <Search className="w-12 h-12 opacity-20" />
                            <p className="text-lg">No creatures found matching your criteria</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const MonsterCard: React.FC<{ 
    monster: any; 
    onAdd: () => void; 
    onReplace: () => void;
    canReplace: boolean;
}> = ({ monster, onAdd, onReplace, canReplace }) => {
    return (
        <motion.div 
            whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.03)" }}
            className="p-5 rounded-3xl bg-white/[0.01] border border-white/5 flex flex-col gap-4 transition-all group"
        >
            <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden flex-shrink-0 border border-white/10">
                    <img src={monster.visualUrl} alt={monster.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white truncate">{monster.name}</h3>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-tighter">
                            CR {monster.cr}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">{monster.type}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-slate-500" /> {monster.ac} AC</span>
                        <span className="flex items-center gap-1"><Plus className="w-3 h-3 text-slate-500" /> {monster.hp} HP</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={onAdd}
                    className="flex-1 h-10 rounded-xl bg-purple-500 text-white text-xs font-black uppercase tracking-widest hover:bg-purple-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                    <Plus className="w-4 h-4" /> Summon
                </button>
                {canReplace && (
                    <button 
                        onClick={onReplace}
                        className="flex-1 h-10 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 border border-white/5"
                        title="Replace selected combatant's actions with this creature's"
                    >
                        <Zap className="w-4 h-4 text-amber-500" /> Borrow
                    </button>
                )}
            </div>
        </motion.div>
    );
};
