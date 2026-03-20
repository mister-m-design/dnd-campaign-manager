"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';
import { useHomebrew } from '@/hooks/useHomebrew';
import type { HomebrewMonster, HomebrewSpell, HomebrewItem, HomebrewAbility } from '@/types/homebrew';
import spellsRaw from '@/data/spells.json';
import equipmentRaw from '@/data/equipment.json';
import monstersRaw from '@/data/monsters.json';
import abilitiesRaw from '@/data/abilities.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Spell {
    id: string; name: string; level: number; school: string;
    time: string; range: string; components?: string; duration?: string;
    concentration?: boolean; ritual?: boolean;
    description: string; visualUrl?: string; webLink?: string; classes?: string[];
}
interface EquipItem {
    id: string; name: string; type: string; category?: string;
    ac?: number; base?: string; damage?: string; weight?: string;
    description?: string; properties?: string[]; cost?: string;
    visualUrl?: string;
}
interface Monster {
    id: string; name: string; type: string; cr: string; hp: number; ac: number;
    description?: string; visualUrl?: string; webLink?: string;
    stats?: Record<string, number>; actions?: string[];
}
interface Ability {
    id: string; name: string; class: string; level: number;
    description: string; webLink?: string; visualUrl?: string;
}

// ─── Section tabs ─────────────────────────────────────────────────────────────

type Tab = 'monsters' | 'spells' | 'equipment' | 'abilities';

const TABS: { id: Tab; label: string; icon: string; color: string; bg: string; border: string }[] = [
    { id: 'monsters',  label: 'Monsters',  icon: 'pest_control',  color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.3)' },
    { id: 'spells',    label: 'Spells',    icon: 'auto_fix_high', color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.3)' },
    { id: 'equipment', label: 'Equipment', icon: 'swords',        color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)' },
    { id: 'abilities', label: 'Abilities', icon: 'bolt',          color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.3)' },
];

// ─── Monster config ───────────────────────────────────────────────────────────

const MONSTER_TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    All:        { color: 'var(--foreground)',  bg: 'var(--panel-bg)',         border: 'var(--panel-border)',        icon: 'list' },
    NPC:        { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.25)',   icon: 'person' },
    Monster:    { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.25)',   icon: 'bug_report' },
    Beast:      { color: '#a3e635', bg: 'rgba(163,230,53,0.08)', border: 'rgba(163,230,53,0.25)',   icon: 'pets' },
    Boss:       { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)',  icon: 'crown' },
};
const CR_CONFIG: Record<string, { label: string; color: string }> = {
    all:    { label: 'Any CR',  color: 'var(--foreground-muted)' },
    easy:   { label: '≤ 1',    color: '#4ade80' },
    medium: { label: '2–5',    color: '#fbbf24' },
    hard:   { label: '6–10',   color: '#fb923c' },
    deadly: { label: '11+',    color: '#f87171' },
};
function parseCR(cr: string) {
    if (cr === '1/8') return 0.125; if (cr === '1/4') return 0.25; if (cr === '1/2') return 0.5;
    return parseFloat(cr) || 0;
}
function getCRTier(cr: string) {
    const n = parseCR(cr);
    if (n <= 1) return 'easy'; if (n <= 5) return 'medium'; if (n <= 10) return 'hard'; return 'deadly';
}
function getMappedMonsterType(m: any): string {
    if (['NPC','Monster','Boss','Beast'].includes(m.type)) return m.type;
    const t = m.type?.toLowerCase() || '', name = m.name?.toLowerCase() || '', cr = parseCR(m.cr) || 0;
    if (name.includes('dragon')||name.includes('beholder')||name.includes('lich')||name.includes('mind flayer')||cr>=10) return 'Boss';
    if (['humanoid','commoner','noble','guard','cultist'].some(x=>t.includes(x))&&cr<5) return 'NPC';
    if (t.includes('beast')&&cr<5) return 'Beast';
    return 'Monster';
}

// ─── Spell config ─────────────────────────────────────────────────────────────

const SCHOOL_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    Abjuration:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  icon: 'shield' },
    Conjuration:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', icon: 'portal' },
    Divination:    { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)',  icon: 'visibility' },
    Enchantment:   { color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.25)', icon: 'psychology' },
    Evocation:     { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.25)',  icon: 'local_fire_department' },
    Illusion:      { color: '#e879f9', bg: 'rgba(232,121,249,0.1)', border: 'rgba(232,121,249,0.25)', icon: 'blur_on' },
    Necromancy:    { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  icon: 'skull' },
    Transmutation: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  icon: 'change_circle' },
};
const LEVEL_COLORS: Record<number, string> = { 0:'#94a3b8',1:'#60a5fa',2:'#34d399',3:'#fbbf24',4:'#fb923c',5:'#f87171',6:'#c084fc',7:'#e879f9',8:'#f43f5e',9:'#ff6b6b' };
function getSchool(school: string) { return SCHOOL_CONFIG[school] || { color:'var(--primary)', bg:'var(--primary-subtle)', border:'var(--panel-border-accent)', icon:'auto_awesome' }; }

// ─── Equipment config ─────────────────────────────────────────────────────────

const EQUIP_TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    All:    { color: 'var(--foreground)', bg: 'var(--panel-bg)',      border: 'var(--panel-border)',       icon: 'list' },
    Weapon: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon: 'swords' },
    Armor:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)',  icon: 'shield' },
    Shield: { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.25)',  icon: 'security' },
    Focus:  { color: '#c084fc', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.25)', icon: 'auto_fix_high' },
    Other:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', icon: 'backpack' },
};

// ─── Ability config ───────────────────────────────────────────────────────────

const CLASS_COLORS: Record<string, string> = {
    Fighter:'#f87171', Wizard:'#60a5fa', Rogue:'#a3e635', Cleric:'#fbbf24',
    Paladin:'#fb923c', Ranger:'#34d399', Barbarian:'#e879f9', Bard:'#f472b6',
    Druid:'#4ade80', Monk:'#38bdf8', Sorcerer:'#c084fc', Warlock:'#a78bfa',
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function MonsterModal({ item, onClose, isEditing, onEditToggle, onSave }: { 
    item: Monster & { mappedType: string }; 
    onClose: () => void;
    isEditing: boolean;
    onEditToggle: () => void;
    onSave: (updated: any) => void;
}) {
    const [editData, setEditData] = useState(item);
    const cfg = MONSTER_TYPE_CONFIG[item.mappedType] || MONSTER_TYPE_CONFIG.Monster;
    const mod = (v: number) => { const m = Math.floor((v-10)/2); return m>=0?`+${m}`:`${m}`; };

    useEffect(() => {
        if (isEditing) setEditData(item);
    }, [isEditing, item]);

    const handleFieldChange = (field: string, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <DetailModal onClose={onClose}>
            <div className="flex items-center gap-4 p-5" style={{ borderBottom:'1px solid var(--panel-border)' }}>
                <div className="size-16 rounded-xl overflow-hidden relative flex-shrink-0" style={{ border:`1px solid ${cfg.border}` }}>
                    <ImageWithPlaceholder src={isEditing ? editData.visualUrl : item.visualUrl} alt={item.name} fill sizes="64px" className="object-cover" fallbackIcon={item.mappedType==='Boss'?'crown':item.mappedType==='Beast'?'pets':'bug_report'} />
                </div>
                <div className="flex-grow min-w-0">
                    {isEditing ? (
                        <input 
                            type="text"
                            value={editData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xl font-black uppercase outline-none focus:border-blue-500"
                        />
                    ) : (
                        <h2 className="text-xl font-black uppercase tracking-tight" style={{ color:'var(--foreground)' }}>{item.name}</h2>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full" style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}>{item.mappedType}</span>
                        <span className="text-[9px] font-black uppercase" style={{ color: CR_CONFIG[getCRTier(item.cr)]?.color }}> CR {item.cr}</span>
                        <span className="text-[8px] font-bold uppercase" style={{ color:'var(--foreground-muted)' }}>
                            HP {isEditing ? editData.hp : item.hp} · AC {isEditing ? editData.ac : item.ac}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <button 
                            onClick={() => onSave(editData)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-black uppercase tracking-wider transition-colors"
                        >
                            Save
                        </button>
                    ) : (
                        <button 
                            onClick={onEditToggle}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                    )}
                    <ModalClose onClose={onClose} />
                </div>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 custom-scrollbar" style={{ maxHeight:'60vh' }}>
                {isEditing && (
                    <ImageEditSection 
                        name={editData.name} 
                        currentImage={editData.visualUrl} 
                        onUpdate={(url) => handleFieldChange('visualUrl', url)}
                    />
                ) || null}
                {(isEditing ? editData.description : item.description) && (
                    <p className="text-[11px] italic leading-relaxed" style={{ color:'var(--foreground-muted)' }}>
                        {isEditing ? (
                            <textarea 
                                value={editData.description}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-[11px] outline-none focus:border-blue-500"
                                rows={3}
                            />
                        ) : (
                            item.description
                        )}
                    </p>
                )}
                {item.stats && (
                    <div>
                        <SectionLabel>Ability Scores</SectionLabel>
                        <div className="grid grid-cols-6 gap-1.5 mt-2">
                            {Object.entries(item.stats).map(([s,v]:[string,any]) => (
                                <div key={s} className="rounded-lg py-2 text-center" style={{ background:'var(--bg-raised)', border:'1px solid var(--panel-border)' }}>
                                    <p className="text-[7px] font-black uppercase mb-0.5" style={{ color:'var(--foreground-muted)' }}>{s}</p>
                                    <p className="text-sm font-black leading-none" style={{ color:'var(--primary)' }}>{mod(v)}</p>
                                    <p className="text-[8px] font-bold" style={{ color:'var(--foreground-muted)' }}>{v}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {item.actions && item.actions.length > 0 && (
                    <div>
                        <SectionLabel>Actions</SectionLabel>
                        <div className="space-y-2 mt-2">
                            {item.actions.map((a,i) => {
                                const [n,...r]=a.split(':');
                                return (
                                    <div key={i} className="rounded-xl p-3" style={{ background:'var(--bg-raised)', border:'1px solid var(--panel-border)' }}>
                                        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color:'var(--primary)' }}>{n}</p>
                                        {r.length>0 && <p className="text-[10px] leading-relaxed" style={{ color:'var(--foreground-muted)' }}>{r.join(':').trim()}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {item.webLink && <ExternalLink href={item.webLink} />}
            </div>
        </DetailModal>
    );
}

function SpellModal({ item, onClose, isEditing, onEditToggle, onSave }: { 
    item: Spell; 
    onClose: () => void;
    isEditing: boolean;
    onEditToggle: () => void;
    onSave: (updated: any) => void;
}) {
    const [editData, setEditData] = useState(item);
    const cfg = getSchool(item.school);
    const levelLabel = item.level === 0 ? 'Cantrip' : `Level ${item.level} Spell`;

    useEffect(() => {
        if (isEditing) setEditData(item);
    }, [isEditing, item]);

    const handleFieldChange = (field: string, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <DetailModal onClose={onClose}>
            <div className="flex items-center gap-4 p-5" style={{ borderBottom:'1px solid var(--panel-border)' }}>
                <div className="size-16 rounded-xl overflow-hidden relative flex-shrink-0" style={{ border:`1px solid ${cfg.border}` }}>
                    <ImageWithPlaceholder src={isEditing ? editData.visualUrl : item.visualUrl} alt={item.name} fill sizes="64px" className="object-cover" fallbackIcon={cfg.icon} />
                </div>
                <div className="flex-grow min-w-0">
                    {isEditing ? (
                        <input 
                            type="text"
                            value={editData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xl font-black uppercase outline-none focus:border-blue-500"
                        />
                    ) : (
                        <h2 className="text-xl font-black uppercase tracking-tight" style={{ color:'var(--foreground)' }}>{item.name}</h2>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full" style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}>{item.school}</span>
                        <span className="text-[8px] font-bold uppercase" style={{ color: LEVEL_COLORS[item.level] }}>{levelLabel}</span>
                        {item.concentration && <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ color:'#f472b6', background:'rgba(244,114,182,0.1)', border:'1px solid rgba(244,114,182,0.25)' }}>Concentration</span>}
                        {item.ritual && <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ color:'#38bdf8', background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.25)' }}>Ritual</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <button 
                            onClick={() => onSave(editData)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-black uppercase tracking-wider transition-colors"
                        >
                            Save
                        </button>
                    ) : (
                        <button 
                            onClick={onEditToggle}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                    )}
                    <ModalClose onClose={onClose} />
                </div>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 custom-scrollbar" style={{ maxHeight:'60vh' }}>
                {isEditing && (
                    <ImageEditSection 
                        name={editData.name} 
                        currentImage={editData.visualUrl} 
                        onUpdate={(url) => handleFieldChange('visualUrl', url)}
                    />
                ) || null}
                <div className="grid grid-cols-2 gap-2">
                    {[['Cast Time', isEditing ? editData.time : item.time],['Range', isEditing ? editData.range : item.range],['Duration', (isEditing ? editData.duration : item.duration)||'—'],['Components', (isEditing ? editData.components : item.components)||'—']].map(([l,v])=>(
                        <div key={l} className="rounded-lg p-3" style={{ background:'var(--bg-raised)', border:'1px solid var(--panel-border)' }}>
                            <p className="text-[8px] font-black uppercase mb-1" style={{ color:'var(--foreground-muted)' }}>{l}</p>
                            {isEditing ? (
                                <input 
                                    type="text"
                                    value={v}
                                    onChange={(e) => handleFieldChange(l.toLowerCase().replace(' ',''), e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] outline-none"
                                />
                            ) : (
                                <p className="text-[11px] font-bold" style={{ color:'var(--foreground)' }}>{v}</p>
                            )}
                        </div>
                    ))}
                </div>
                <div>
                    <SectionLabel>Description</SectionLabel>
                    {isEditing ? (
                        <textarea 
                            value={editData.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-[11px] outline-none focus:border-blue-500 mt-2"
                            rows={4}
                        />
                    ) : (
                        <p className="text-[11px] leading-relaxed mt-2" style={{ color:'var(--foreground-muted)' }}>{item.description}</p>
                    )}
                </div>
                {item.classes && item.classes.length > 0 && (
                    <div>
                        <SectionLabel>Classes</SectionLabel>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                            {item.classes.map(c => (
                                <span key={c} className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ color: CLASS_COLORS[c]||'var(--foreground-muted)', background:'var(--bg-raised)', border:'1px solid var(--panel-border)' }}>{c}</span>
                            ))}
                        </div>
                    </div>
                )}
                {item.webLink && <ExternalLink href={item.webLink} />}
            </div>
        </DetailModal>
    );
}

function EquipModal({ item, onClose, isEditing, onEditToggle, onSave }: { 
    item: EquipItem; 
    onClose: () => void;
    isEditing: boolean;
    onEditToggle: () => void;
    onSave: (updated: any) => void;
}) {
    const [editData, setEditData] = useState(item);
    const cfg = EQUIP_TYPE_CONFIG[item.type] || EQUIP_TYPE_CONFIG.Other;

    useEffect(() => {
        if (isEditing) setEditData(item);
    }, [isEditing, item]);

    const handleFieldChange = (field: string, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <DetailModal onClose={onClose}>
            <div className="flex items-center gap-4 p-5" style={{ borderBottom:'1px solid var(--panel-border)' }}>
                <div className="size-16 rounded-xl overflow-hidden relative flex-shrink-0 flex items-center justify-center" style={{ border:`1px solid ${cfg.border}`, background:cfg.bg }}>
                    <ImageWithPlaceholder src={isEditing ? editData.visualUrl : item.visualUrl} alt={item.name} fill sizes="64px" className="object-cover" fallbackIcon={cfg.icon} />
                </div>
                <div className="flex-grow min-w-0">
                    {isEditing ? (
                        <input 
                            type="text"
                            value={editData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xl font-black uppercase outline-none focus:border-blue-500"
                        />
                    ) : (
                        <h2 className="text-xl font-black uppercase tracking-tight" style={{ color:'var(--foreground)' }}>{item.name}</h2>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full" style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}>{item.type}</span>
                        {item.category && <span className="text-[8px] font-bold uppercase" style={{ color:'var(--foreground-muted)' }}>{item.category}</span>}
                        {item.cost && <span className="text-[8px] font-bold" style={{ color:'#fbbf24' }}>{item.cost}</span>}
                        {item.weight && <span className="text-[8px] font-bold" style={{ color:'var(--foreground-muted)' }}>{item.weight}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <button 
                            onClick={() => onSave(editData)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-black uppercase tracking-wider transition-colors"
                        >
                            Save
                        </button>
                    ) : (
                        <button 
                            onClick={onEditToggle}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                    )}
                    <ModalClose onClose={onClose} />
                </div>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 custom-scrollbar" style={{ maxHeight:'60vh' }}>
                {isEditing && (
                    <ImageEditSection 
                        name={editData.name} 
                        currentImage={editData.visualUrl} 
                        onUpdate={(url) => handleFieldChange('visualUrl', url)}
                    />
                ) || null}
                <div className="grid grid-cols-2 gap-3">
                    {(isEditing ? editData.ac || editData.base : item.ac || item.base) && (
                        <div className="rounded-xl p-3 flex items-center gap-3" style={{ background:'var(--bg-raised)', border:'1px solid rgba(96,165,250,0.3)' }}>
                            <span className="material-symbols-outlined text-2xl" style={{ color:'#60a5fa' }}>shield</span>
                            <div>
                                <p className="text-[8px] font-black uppercase" style={{ color:'var(--foreground-muted)' }}>Armor Class</p>
                                <p className="text-lg font-black" style={{ color:'#60a5fa' }}>{isEditing ? editData.base || editData.ac : item.base || item.ac}</p>
                            </div>
                        </div>
                    )}
                    {(isEditing ? editData.damage : item.damage) && (
                        <div className="rounded-xl p-3 flex items-center gap-3" style={{ background:'var(--bg-raised)', border:'1px solid rgba(248,113,113,0.3)' }}>
                            <span className="material-symbols-outlined text-2xl" style={{ color:'#f87171' }}>swords</span>
                            <div>
                                <p className="text-[8px] font-black uppercase" style={{ color:'var(--foreground-muted)' }}>Damage</p>
                                <p className="text-lg font-black" style={{ color:'#f87171' }}>{isEditing ? editData.damage : item.damage}</p>
                            </div>
                        </div>
                    )}
                </div>
                {item.properties && item.properties.length > 0 && (
                    <div>
                        <SectionLabel>Properties</SectionLabel>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                            {item.properties.map(p=>(
                                <span key={p} className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ color:'var(--foreground-muted)', background:'var(--bg-raised)', border:'1px solid var(--panel-border)' }}>{p}</span>
                            ))}
                        </div>
                    </div>
                )}
                <div>
                    <SectionLabel>Description</SectionLabel>
                    {isEditing ? (
                        <textarea 
                            value={editData.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-[11px] outline-none focus:border-blue-500 mt-2"
                            rows={4}
                        />
                    ) : (
                        <p className="text-[11px] leading-relaxed mt-2" style={{ color:'var(--foreground-muted)' }}>{item.description}</p>
                    )}
                </div>
            </div>
        </DetailModal>
    );
}

function AbilityModal({ item, onClose, isEditing, onEditToggle, onSave }: { 
    item: Ability; 
    onClose: () => void;
    isEditing: boolean;
    onEditToggle: () => void;
    onSave: (updated: any) => void;
}) {
    const [editData, setEditData] = useState(item);
    const color = CLASS_COLORS[item.class] || '#38bdf8';

    useEffect(() => {
        if (isEditing) setEditData(item);
    }, [isEditing, item]);

    const handleFieldChange = (field: string, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <DetailModal onClose={onClose}>
            <div className="flex items-center gap-4 p-5" style={{ borderBottom:'1px solid var(--panel-border)' }}>
                <div className="size-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${color}15`, border:`1px solid ${color}40` }}>
                    <span className="material-symbols-outlined text-3xl" style={{ color }}>bolt</span>
                </div>
                <div className="flex-grow min-w-0">
                    {isEditing ? (
                        <input 
                            type="text"
                            value={editData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xl font-black uppercase outline-none focus:border-blue-500"
                        />
                    ) : (
                        <h2 className="text-xl font-black uppercase tracking-tight" style={{ color:'var(--foreground)' }}>{item.name}</h2>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full" style={{ color, background:`${color}15`, border:`1px solid ${color}40` }}>{item.class}</span>
                        <span className="text-[8px] font-bold uppercase" style={{ color:'var(--foreground-muted)' }}>Level {item.level}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <button 
                            onClick={() => onSave(editData)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-black uppercase tracking-wider transition-colors"
                        >
                            Save
                        </button>
                    ) : (
                        <button 
                            onClick={onEditToggle}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                    )}
                    <ModalClose onClose={onClose} />
                </div>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 custom-scrollbar" style={{ maxHeight:'60vh' }}>
                {isEditing ? (
                    <textarea 
                        value={editData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-[11px] outline-none focus:border-blue-500"
                        rows={10}
                    />
                ) : (
                    <p className="text-[11px] leading-relaxed whitespace-pre-line" style={{ color:'var(--foreground-muted)' }}>{item.description}</p>
                )}
                {item.webLink && <ExternalLink href={item.webLink} />}
            </div>
        </DetailModal>
    );
}

// ─── Shared modal shell ───────────────────────────────────────────────────────

function DetailModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)' }}
            onClick={onClose}>
            <motion.div initial={{ scale:0.92,y:20 }} animate={{ scale:1,y:0 }} exit={{ scale:0.92,y:20 }}
                className="max-w-lg w-full rounded-2xl overflow-hidden flex flex-col"
                style={{ background:'var(--panel-bg)', border:'1px solid var(--panel-border)' }}
                onClick={e=>e.stopPropagation()}>
                {children}
            </motion.div>
        </motion.div>
    );
}
function ModalClose({ onClose }: { onClose:()=>void }) {
    return (
        <button onClick={onClose} className="size-8 flex items-center justify-center rounded-lg hover:opacity-70 flex-shrink-0" style={{ color:'var(--foreground-muted)' }}>
            <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
    );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
    return <h4 className="text-[9px] font-black uppercase tracking-widest" style={{ color:'var(--foreground-muted)' }}>{children}</h4>;
}
function ExternalLink({ href }: { href: string }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity"
            style={{ color:'var(--primary)' }}>
            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            View on DnD Beyond
        </a>
    );
}

// ─── Card Components ──────────────────────────────────────────────────────────

function MonsterCard({ item, onClick }: { item: Monster & { mappedType: string }; onClick: () => void }) {
    const cfg = MONSTER_TYPE_CONFIG[item.mappedType] || MONSTER_TYPE_CONFIG.Monster;
    const crColor = CR_CONFIG[getCRTier(item.cr)]?.color || '#fff';
    const mod = (v: number) => { const m = Math.floor((v-10)/2); return m>=0?`+${m}`:`${m}`; };
    return (
        <motion.div layout initial={{ opacity:0,scale:0.96 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.96 }}
            onClick={onClick} className="rounded-xl cursor-pointer group transition-all"
            style={{ background:'var(--panel-bg)', border:'1px solid var(--panel-border)' }}
            whileHover={{ scale:1.01, borderColor: cfg.border }}>
            <div className="flex items-center gap-3 p-3">
                <div className="size-12 rounded-xl overflow-hidden relative flex-shrink-0" style={{ border:`1px solid ${cfg.border}` }}>
                    <ImageWithPlaceholder src={item.visualUrl} alt={item.name} fill sizes="48px" className="object-cover" fallbackIcon={item.mappedType==='Boss'?'crown':item.mappedType==='Beast'?'pets':'bug_report'} />
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: cfg.color }} />
                </div>
                <div className="flex-grow min-w-0">
                    <h3 className="font-black uppercase text-[11px] tracking-tight leading-tight truncate group-hover:text-primary transition-colors" style={{ color:'var(--foreground)' }}>{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full" style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}>{item.mappedType}</span>
                        <span className="text-[8px] font-black uppercase" style={{ color:crColor }}>CR {item.cr}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[9px]" style={{ color:'#f87171' }}>favorite</span>
                        <span className="text-[9px] font-black" style={{ color:'var(--foreground)' }}>{item.hp}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[9px]" style={{ color:'#60a5fa' }}>shield</span>
                        <span className="text-[9px] font-black" style={{ color:'var(--foreground)' }}>{item.ac}</span>
                    </div>
                </div>
            </div>
            {item.stats && (
                <div className="mx-3 mb-3 rounded-lg grid grid-cols-6 gap-0" style={{ background:'var(--bg-raised)' }}>
                    {Object.entries(item.stats).map(([s,v]:[string,any]) => (
                        <div key={s} className="text-center py-1">
                            <p className="text-[6px] font-black uppercase" style={{ color:'var(--foreground-muted)' }}>{s}</p>
                            <p className="text-[9px] font-black leading-none" style={{ color:'var(--foreground)' }}>{mod(v)}</p>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function SpellCard({ item, onClick }: { item: Spell; onClick: () => void }) {
    const cfg = getSchool(item.school);
    const levelLabel = item.level === 0 ? 'Cantrip' : `Lv ${item.level}`;
    const levelColor = LEVEL_COLORS[item.level] || '#94a3b8';
    return (
        <motion.div layout initial={{ opacity:0,scale:0.96 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.96 }}
            onClick={onClick} className="rounded-xl cursor-pointer group transition-all"
            style={{ background:'var(--panel-bg)', border:'1px solid var(--panel-border)' }}
            whileHover={{ scale:1.01, borderColor: cfg.border }}>
            <div className="flex items-center gap-3 p-3">
                <div className="size-12 rounded-xl overflow-hidden relative flex-shrink-0" style={{ border:`1px solid ${cfg.border}` }}>
                    <ImageWithPlaceholder src={item.visualUrl} alt={item.name} fill sizes="48px" className="object-cover" fallbackIcon={cfg.icon} />
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: cfg.color }} />
                </div>
                <div className="flex-grow min-w-0">
                    <h3 className="font-black uppercase text-[11px] tracking-tight leading-tight truncate group-hover:text-primary transition-colors" style={{ color:'var(--foreground)' }}>{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full" style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}>{item.school}</span>
                        <span className="text-[8px] font-black uppercase" style={{ color:levelColor }}>{levelLabel}</span>
                        {item.concentration && <span className="text-[7px] font-black uppercase" style={{ color:'#f472b6' }}>Conc.</span>}
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-[8px] font-bold leading-tight" style={{ color:'var(--foreground-muted)' }}>{item.time}</p>
                    <p className="text-[8px] font-bold leading-tight" style={{ color:'var(--foreground-muted)' }}>{item.range}</p>
                </div>
            </div>
        </motion.div>
    );
}

function EquipCard({ item, onClick }: { item: EquipItem; onClick: () => void }) {
    const cfg = EQUIP_TYPE_CONFIG[item.type] || EQUIP_TYPE_CONFIG.Other;
    return (
        <motion.div layout initial={{ opacity:0,scale:0.96 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.96 }}
            onClick={onClick} className="rounded-xl cursor-pointer group transition-all"
            style={{ background:'var(--panel-bg)', border:'1px solid var(--panel-border)' }}
            whileHover={{ scale:1.01, borderColor: cfg.border }}>
            <div className="flex items-center gap-3 p-3">
                <div className="size-12 rounded-xl overflow-hidden relative flex-shrink-0 flex items-center justify-center" style={{ border:`1px solid ${cfg.border}`, background:cfg.bg }}>
                    <ImageWithPlaceholder src={item.visualUrl} alt={item.name} fill sizes="48px" className="object-cover" fallbackIcon={cfg.icon} />
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: cfg.color }} />
                </div>
                <div className="flex-grow min-w-0">
                    <h3 className="font-black uppercase text-[11px] tracking-tight leading-tight truncate group-hover:text-primary transition-colors" style={{ color:'var(--foreground)' }}>{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full" style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}>{item.type}</span>
                        {item.category && <span className="text-[8px] font-bold uppercase" style={{ color:'var(--foreground-muted)' }}>{item.category}</span>}
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    {item.ac && <p className="text-[11px] font-black" style={{ color:'#60a5fa' }}>AC {item.ac}</p>}
                    {item.damage && <p className="text-[10px] font-black" style={{ color:'#f87171' }}>{item.damage}</p>}
                    {item.weight && <p className="text-[8px] font-bold" style={{ color:'var(--foreground-muted)' }}>{item.weight}</p>}
                </div>
            </div>
        </motion.div>
    );
}

function AbilityCard({ item, onClick }: { item: Ability; onClick: () => void }) {
    const color = CLASS_COLORS[item.class] || '#38bdf8';
    return (
        <motion.div layout initial={{ opacity:0,scale:0.96 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.96 }}
            onClick={onClick} className="rounded-xl cursor-pointer group transition-all"
            style={{ background:'var(--panel-bg)', border:'1px solid var(--panel-border)' }}
            whileHover={{ scale:1.01, borderColor:`${color}40` }}>
            <div className="flex items-center gap-3 p-3">
                <div className="size-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${color}15`, border:`1px solid ${color}30` }}>
                    <span className="material-symbols-outlined text-xl" style={{ color }}>bolt</span>
                </div>
                <div className="flex-grow min-w-0">
                    <h3 className="font-black uppercase text-[11px] tracking-tight leading-tight truncate group-hover:text-primary transition-colors" style={{ color:'var(--foreground)' }}>{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full" style={{ color, background:`${color}15`, border:`1px solid ${color}30` }}>{item.class}</span>
                        <span className="text-[8px] font-bold uppercase" style={{ color:'var(--foreground-muted)' }}>Lv {item.level}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ImageEditSection({ name, currentImage, onUpdate }: { name: string; currentImage?: string; onUpdate: (url: string) => void }) {
    const [url, setUrl] = useState(currentImage || '');
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(name + ' dnd token image')}&tbm=isch`;

    return (
        <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 mt-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Token Image</label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste image URL here..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                    onClick={() => onUpdate(url)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors"
                >
                    Apply
                </button>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
                <a href={googleSearchUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 underline transition-colors">
                    Find on Google Images ↗
                </a>
                <span>Supports URL or Base64</span>
            </div>
        </div>
    );
}

type ModalItem = 
    | { kind: 'monster'; data: Monster & { mappedType: string } }
    | { kind: 'spell'; data: Spell }
    | { kind: 'equip'; data: EquipItem }
    | { kind: 'ability'; data: Ability };

export default function LibraryPage() {
    const { monsters: hbMonsters, spells: hbSpells, items: hbEquipment, abilities: hbAbilities, upsertMonster, upsertSpell, upsertItem, upsertAbility } = useHomebrew();
    const [activeTab, setActiveTab] = useState<Tab>('monsters');
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<ModalItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleEditToggle = () => setIsEditing(!isEditing);

    const handleSave = (updated: any) => {
        if (modal?.kind === 'monster') upsertMonster(updated);
        if (modal?.kind === 'spell') upsertSpell(updated);
        if (modal?.kind === 'equip') upsertItem(updated);
        if (modal?.kind === 'ability') upsertAbility(updated);
        setModal({ ...modal!, data: updated } as ModalItem);
        setIsEditing(false);
    };

    // Monster filters
    const [monsterTypeFilter, setMonsterTypeFilter] = useState('All');
    const [monsterCR, setMonsterCR] = useState('all');

    // Spell filters
    const [spellLevel, setSpellLevel] = useState<number | 'All'>('All');
    const [spellSchool, setSpellSchool] = useState('All');

    // Equipment filters
    const [equipType, setEquipType] = useState('All');

    // Ability filters
    const [abilityClass, setAbilityClass] = useState('All');

    // ── Pre-processed data ────────────────────────────────────────────────────

    const allMonsters = useMemo(() => {
        const official = (monstersRaw as Monster[]).map(m => ({ ...m, mappedType: getMappedMonsterType(m) }));
        const homebrew = hbMonsters.map(m => ({ ...m, mappedType: getMappedMonsterType(m) }));
        // Merge: homebrew with same name/id overrides official? 
        // For now, let's just combine them and filter duplicates by name/id
        const combined = [...homebrew, ...official];
        const unique: Record<string, any> = {};
        combined.forEach(m => { if (!unique[m.id]) unique[m.id] = m; });
        return Object.values(unique);
    }, [hbMonsters]);

    const allSpells = useMemo(() => {
        const official = spellsRaw as Spell[];
        const combined = [...hbSpells, ...official];
        const unique: Record<string, any> = {};
        combined.forEach(s => { if (!unique[s.id]) unique[s.id] = s; });
        return Object.values(unique) as Spell[];
    }, [hbSpells]);

    const allEquipment = useMemo(() => {
        const official = equipmentRaw as EquipItem[];
        const combined = [...hbEquipment, ...official];
        const unique: Record<string, any> = {};
        combined.forEach(i => { if (!unique[i.id]) unique[i.id] = i; });
        return Object.values(unique) as EquipItem[];
    }, [hbEquipment]);

    const allAbilities = useMemo(() => {
        const official = abilitiesRaw as Ability[];
        const combined = [...hbAbilities, ...official];
        const unique: Record<string, any> = {};
        combined.forEach(a => { if (!unique[a.id]) unique[a.id] = a; });
        return Object.values(unique) as Ability[];
    }, [hbAbilities]);

    const abilityClasses = useMemo(() =>
        ['All', ...Array.from(new Set(allAbilities.map(a => a.class))).sort()],
    [allAbilities]);

    const spellSchools = useMemo(() =>
        ['All', ...Array.from(new Set(allSpells.map(s => s.school).filter(Boolean))).sort()],
    [allSpells]);

    // ── Filtered lists ────────────────────────────────────────────────────────

    const filteredMonsters = useMemo(() => {
        const q = search.toLowerCase();
        return allMonsters.filter(m => {
            if (q && !m.name.toLowerCase().includes(q) && !m.type.toLowerCase().includes(q) && !(m.description||'').toLowerCase().includes(q)) return false;
            if (monsterTypeFilter !== 'All' && m.mappedType !== monsterTypeFilter) return false;
            if (monsterCR !== 'all' && getCRTier(m.cr) !== monsterCR) return false;
            return true;
        });
    }, [allMonsters, search, monsterTypeFilter, monsterCR]);

    const filteredSpells = useMemo(() => {
        const q = search.toLowerCase();
        return allSpells.filter(s => {
            if (q && !s.name.toLowerCase().includes(q) && !s.school.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false;
            if (spellLevel !== 'All' && s.level !== spellLevel) return false;
            if (spellSchool !== 'All' && s.school !== spellSchool) return false;
            return true;
        });
    }, [allSpells, search, spellLevel, spellSchool]);

    const filteredEquipment = useMemo(() => {
        const q = search.toLowerCase();
        return allEquipment.filter(e => {
            if (q && !e.name.toLowerCase().includes(q) && !(e.description||'').toLowerCase().includes(q)) return false;
            if (equipType !== 'All' && e.type !== equipType) return false;
            return true;
        });
    }, [allEquipment, search, equipType]);

    const filteredAbilities = useMemo(() => {
        const q = search.toLowerCase();
        return allAbilities.filter(a => {
            if (q && !a.name.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q) && !a.class.toLowerCase().includes(q)) return false;
            if (abilityClass !== 'All' && a.class !== abilityClass) return false;
            return true;
        });
    }, [allAbilities, search, abilityClass]);

    // ── Count for active tab ──────────────────────────────────────────────────
    const handleAddNew = () => {
        const id = `hb-${Date.now()}`;
        if (activeTab === 'monsters') {
            const newItem: Monster & { mappedType: string } = { id, name: 'New Homebrew Monster', type: 'Monster', cr: '1', hp: 10, ac: 10, mappedType: 'Monster', stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }, actions: [] };
            setModal({ kind: 'monster', data: newItem });
            setIsEditing(true);
        } else if (activeTab === 'spells') {
            const newItem: Spell = { id, name: 'New Homebrew Spell', level: 0, school: 'Evocation', time: '1 Action', range: '60 ft', description: '' };
            setModal({ kind: 'spell', data: newItem });
            setIsEditing(true);
        } else if (activeTab === 'equipment') {
            const newItem: EquipItem = { id, name: 'New Homebrew Item', type: 'Other' };
            setModal({ kind: 'equip', data: newItem });
            setIsEditing(true);
        } else if (activeTab === 'abilities') {
            const newItem: Ability = { id, name: 'New Homebrew Ability', class: 'Fighter', level: 1, description: '' };
            setModal({ kind: 'ability', data: newItem });
            setIsEditing(true);
        }
    };

    const counts: Record<Tab, number> = {
        monsters: filteredMonsters.length,
        spells: filteredSpells.length,
        equipment: filteredEquipment.length,
        abilities: filteredAbilities.length,
    };

    const monsterTypeCounts = useMemo(() => {
        const c: Record<string, number> = { All: allMonsters.length };
        allMonsters.forEach(m => { c[m.mappedType] = (c[m.mappedType] || 0) + 1; });
        return c;
    }, [allMonsters]);

    const tabCfg = TABS.find(t => t.id === activeTab)!;

    const switchTab = (t: Tab) => { setActiveTab(t); setSearch(''); };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full" style={{ color:'var(--foreground)', height:'calc(100vh - 56px)' }}>

            {/* ── Header ── */}
            <div className="px-4 md:px-6 py-4 flex flex-col gap-3" style={{ borderBottom:'1px solid var(--panel-border)' }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter" style={{ color:'var(--foreground)' }}>Library</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color:'var(--foreground-muted)' }}>
                            {counts[activeTab].toLocaleString()} {activeTab}{search ? ` matching "${search}"` : ''}
                        </p>
                    </div>
                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color:'var(--foreground-muted)' }}>search</span>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition-all"
                            placeholder={`Search ${activeTab}…`}
                            style={{ background:'var(--bg-raised)', border:'1px solid var(--panel-border)', color:'var(--foreground)' }} />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:'var(--foreground-muted)' }}>
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Section tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    {TABS.map(t => {
                        const isActive = activeTab === t.id;
                        return (
                            <button key={t.id} onClick={() => switchTab(t.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 border"
                                style={{
                                    color: isActive ? t.color : 'var(--foreground-muted)',
                                    background: isActive ? t.bg : 'transparent',
                                    borderColor: isActive ? t.border : 'var(--panel-border)',
                                }}>
                                <span className="material-symbols-outlined text-[12px]">{t.icon}</span>
                                {t.label}
                                <span className="opacity-70 text-[7px]">{counts[t.id]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Sub-filters ── */}
            <div className="px-4 md:px-6 py-2.5 flex gap-1.5 flex-wrap" style={{ borderBottom:'1px solid var(--panel-border)', background:'var(--panel-bg)' }}>
                {activeTab === 'monsters' && (
                    <>
                        {Object.entries(MONSTER_TYPE_CONFIG).map(([type, cfg]) => {
                            const isActive = monsterTypeFilter === type;
                            const count = monsterTypeCounts[type] || 0;
                            return (
                                <button key={type} onClick={() => setMonsterTypeFilter(type)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border"
                                    style={{ color:isActive?cfg.color:'var(--foreground-muted)', background:isActive?cfg.bg:'transparent', borderColor:isActive?cfg.border:'var(--panel-border)' }}>
                                    <span className="material-symbols-outlined text-[11px]">{cfg.icon}</span>
                                    {type} <span className="opacity-60">{count}</span>
                                </button>
                            );
                        })}
                        <div className="w-px h-5 self-center" style={{ background:'var(--panel-border)' }} />
                        {Object.entries(CR_CONFIG).map(([key, cfg]) => {
                            const isActive = monsterCR === key;
                            return (
                                <button key={key} onClick={() => setMonsterCR(key)}
                                    className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border"
                                    style={{ color:isActive?cfg.color:'var(--foreground-muted)', background:isActive?`${cfg.color}15`:'transparent', borderColor:isActive?`${cfg.color}40`:'var(--panel-border)' }}>
                                    {cfg.label}
                                </button>
                            );
                        })}
                    </>
                )}

                {activeTab === 'spells' && (
                    <>
                        {['All',0,1,2,3,4,5,6,7,8,9].map(lv => {
                            const label = lv === 'All' ? 'All' : lv === 0 ? 'Cantrip' : `Lv ${lv}`;
                            const val = lv === 'All' ? 'All' : lv as number;
                            const isActive = spellLevel === val;
                            const color = lv === 'All' ? 'var(--foreground-muted)' : LEVEL_COLORS[lv as number] || '#fff';
                            return (
                                <button key={String(lv)} onClick={() => setSpellLevel(val as number | 'All')}
                                    className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border"
                                    style={{ color:isActive?color:'var(--foreground-muted)', background:isActive?`${color}15`:'transparent', borderColor:isActive?`${color}40`:'var(--panel-border)' }}>
                                    {label}
                                </button>
                            );
                        })}
                        <div className="w-px h-5 self-center" style={{ background:'var(--panel-border)' }} />
                        {spellSchools.map(sch => {
                            const cfg = sch === 'All' ? null : getSchool(sch);
                            const isActive = spellSchool === sch;
                            return (
                                <button key={sch} onClick={() => setSpellSchool(sch)}
                                    className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border"
                                    style={{ color:isActive&&cfg?cfg.color:'var(--foreground-muted)', background:isActive&&cfg?cfg.bg:'transparent', borderColor:isActive&&cfg?cfg.border:'var(--panel-border)' }}>
                                    {sch}
                                </button>
                            );
                        })}
                    </>
                )}

                {activeTab === 'equipment' && (
                    Object.entries(EQUIP_TYPE_CONFIG).map(([type, cfg]) => {
                        const isActive = equipType === type;
                        return (
                            <button key={type} onClick={() => setEquipType(type)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border"
                                style={{ color:isActive?cfg.color:'var(--foreground-muted)', background:isActive?cfg.bg:'transparent', borderColor:isActive?cfg.border:'var(--panel-border)' }}>
                                <span className="material-symbols-outlined text-[11px]">{cfg.icon}</span>
                                {type}
                            </button>
                        );
                    })
                )}

                {activeTab === 'abilities' && (
                    abilityClasses.map(cls => {
                        const color = CLASS_COLORS[cls] || 'var(--foreground-muted)';
                        const isActive = abilityClass === cls;
                        return (
                            <button key={cls} onClick={() => setAbilityClass(cls)}
                                className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border"
                                style={{ color:isActive&&cls!=='All'?color:'var(--foreground-muted)', background:isActive&&cls!=='All'?`${color}15`:'transparent', borderColor:isActive&&cls!=='All'?`${color}40`:'var(--panel-border)' }}>
                                {cls}
                            </button>
                        );
                    })
                )}
            </div>

            {/* ── Card Grid ── */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        <AnimatePresence>
                            {activeTab === 'monsters' && filteredMonsters.map((m, i) => (
                                <motion.div key={m.id} transition={{ delay: Math.min(i*0.015, 0.25) }}>
                                    <MonsterCard item={m} onClick={() => setModal({ kind:'monster', data:m })} />
                                </motion.div>
                            ))}
                            {activeTab === 'spells' && filteredSpells.map((s, i) => (
                                <motion.div key={s.id} transition={{ delay: Math.min(i*0.015, 0.25) }}>
                                    <SpellCard item={s} onClick={() => setModal({ kind:'spell', data:s })} />
                                </motion.div>
                            ))}
                            {activeTab === 'equipment' && filteredEquipment.map((e, i) => (
                                <motion.div key={e.id} transition={{ delay: Math.min(i*0.015, 0.25) }}>
                                    <EquipCard item={e} onClick={() => setModal({ kind:'equip', data:e })} />
                                </motion.div>
                            ))}
                            {activeTab === 'abilities' && filteredAbilities.map((a, i) => (
                                <motion.div key={a.id} transition={{ delay: Math.min(i*0.015, 0.25) }}>
                                    <AbilityCard item={a} onClick={() => setModal({ kind:'ability', data:a })} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </AnimatePresence>

                {/* Empty state */}
                {counts[activeTab] === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                        <span className="material-symbols-outlined text-[48px] mb-3" style={{ color:'var(--foreground-muted)' }}>search_off</span>
                        <p className="font-black uppercase text-lg" style={{ color:'var(--foreground-muted)' }}>Nothing found</p>
                        <p className="text-[11px] mt-1" style={{ color:'var(--foreground-muted)' }}>Try adjusting your search or filters</p>
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            <AnimatePresence>
                {modal && (
                    modal.kind === 'monster' ? <MonsterModal item={modal.data} onClose={() => { setModal(null); setIsEditing(false); }} isEditing={isEditing} onEditToggle={handleEditToggle} onSave={handleSave} /> :
                    modal.kind === 'spell'   ? <SpellModal   item={modal.data} onClose={() => { setModal(null); setIsEditing(false); }} isEditing={isEditing} onEditToggle={handleEditToggle} onSave={handleSave} /> :
                    modal.kind === 'equip'   ? <EquipModal   item={modal.data} onClose={() => { setModal(null); setIsEditing(false); }} isEditing={isEditing} onEditToggle={handleEditToggle} onSave={handleSave} /> :
                                              <AbilityModal  item={modal.data} onClose={() => { setModal(null); setIsEditing(false); }} isEditing={isEditing} onEditToggle={handleEditToggle} onSave={handleSave} />
                )}
            </AnimatePresence>
        </div>
    );
}
