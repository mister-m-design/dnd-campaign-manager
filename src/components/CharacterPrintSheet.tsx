"use client";

import React from 'react';
import { useEffect, useState } from 'react';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useParams, useRouter } from 'next/navigation';
import { calculateDerivedStats, CLASS_REGISTRY, calculateProficiencyBonus, calculateModifier } from '@/lib/rules';
import { CLASS_ABILITIES } from '@/data/classAbilities';
import { Character } from '@/types';

// ─── SKILL → ABILITY MAP ─────────────────────────────────────────────────────
const SKILL_ABILITY: Record<string, keyof typeof ABILITY_FULL_NAME> = {
  'Athletics': 'STR',
  'Acrobatics': 'DEX', 'Sleight of Hand': 'DEX', 'Stealth': 'DEX',
  'Arcana': 'INT', 'History': 'INT', 'Investigation': 'INT', 'Nature': 'INT', 'Religion': 'INT',
  'Animal Handling': 'WIS', 'Insight': 'WIS', 'Medicine': 'WIS', 'Perception': 'WIS', 'Survival': 'WIS',
  'Deception': 'CHA', 'Intimidation': 'CHA', 'Performance': 'CHA', 'Persuasion': 'CHA',
};

const ABILITY_FULL_NAME = {
  STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution',
  INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma',
};

// Ability → its skills (for grouping under each ability block)
const ABILITY_SKILLS: Record<string, string[]> = {
  STR: ['Athletics'],
  DEX: ['Acrobatics', 'Sleight of Hand', 'Stealth'],
  CON: [],
  INT: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'],
  WIS: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'],
  CHA: ['Deception', 'Intimidation', 'Performance', 'Persuasion'],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

// ─── ABILITY BLOCK ────────────────────────────────────────────────────────────
function AbilityBlock({
  ability, score, profBonus, saveProficiencies, skillProficiencies,
}: {
  ability: keyof typeof ABILITY_FULL_NAME;
  score: number;
  profBonus: number;
  saveProficiencies: string[];
  skillProficiencies: string[];
}) {
  const mod = calculateModifier(score);
  const isSaveProf = saveProficiencies.includes(ability);
  const saveMod = mod + (isSaveProf ? profBonus : 0);
  const skills = ABILITY_SKILLS[ability] || [];

  return (
    <div className="ability-block border border-[#2a2a2a] rounded-sm bg-[#f7f4ef] mb-1.5 overflow-hidden">
      {/* Ability name banner */}
      <div className="bg-[#1a1a1a] text-[#e8d9b5] text-center py-0.5">
        <span className="text-[7px] font-black uppercase tracking-[0.18em]">{ABILITY_FULL_NAME[ability]}</span>
      </div>

      {/* Score display — modifier big, score small */}
      <div className="flex items-center justify-around px-2 py-1.5 border-b border-[#2a2a2a]/20">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#2a2a2a] bg-white flex items-center justify-center mx-auto">
            <span className="text-lg font-black leading-none">{fmt(mod)}</span>
          </div>
          <p className="text-[5.5px] font-black uppercase tracking-wider text-[#5a5a5a] mt-0.5">Modifier</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 border border-[#2a2a2a] bg-white flex items-center justify-center mx-auto rounded-sm">
            <span className="text-base font-black leading-none">{score}</span>
          </div>
          <p className="text-[5.5px] font-black uppercase tracking-wider text-[#5a5a5a] mt-0.5">Score</p>
        </div>
      </div>

      {/* Saving throw */}
      <div className="px-2 py-1 border-b border-[#2a2a2a]/15">
        <div className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-full border border-[#2a2a2a] flex-shrink-0 ${isSaveProf ? 'bg-[#1a1a1a]' : 'bg-white'}`} />
          <span className="text-[7px] font-bold text-[#2a2a2a] w-5 tabular-nums">{fmt(saveMod)}</span>
          <span className="text-[7px] text-[#5a5a5a] uppercase tracking-wide">Saving Throw</span>
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="px-2 py-1 space-y-0.5">
          {skills.map(skill => {
            const isProf = skillProficiencies.includes(skill);
            const skillMod = mod + (isProf ? profBonus : 0);
            return (
              <div key={skill} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full border border-[#2a2a2a] flex-shrink-0 ${isProf ? 'bg-[#1a1a1a]' : 'bg-white'}`} />
                <span className="text-[7px] font-bold text-[#2a2a2a] w-5 tabular-nums">{fmt(skillMod)}</span>
                <span className="text-[7px] text-[#5a5a5a] leading-tight">{skill}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SMALL STAT BOX ──────────────────────────────────────────────────────────
function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-[#2a2a2a] bg-[#f7f4ef] flex flex-col items-center justify-center p-1 rounded-sm text-center">
      <p className="text-[6px] font-black uppercase tracking-[0.15em] text-[#5a5a5a] leading-tight">{label}</p>
      <p className="text-xl font-black text-[#1a1a1a] leading-tight my-0.5">{value}</p>
      {sub && <p className="text-[6px] text-[#7a7a7a] uppercase">{sub}</p>}
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#1a1a1a] text-[#e8d9b5] text-center py-0.5 mb-1">
      <span className="text-[7px] font-black uppercase tracking-[0.2em]">{title}</span>
    </div>
  );
}

// ─── MAIN SHEET ──────────────────────────────────────────────────────────────
export default function CharacterPrintSheet() {
  const params  = useParams();
  const router  = useRouter();
  const [savedCharacters] = usePersistentState<Character[]>('mythic_saved_characters', []);
  const [char, setChar]   = useState<Character | null>(null);

  useEffect(() => {
    const found = savedCharacters.find(c => c.id === params.id);
    if (found) setChar(found);
  }, [params.id, savedCharacters]);

  if (!char) return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-white font-black uppercase tracking-widest text-sm">Summoning sheet…</p>
    </div>
  );

  const calc      = calculateDerivedStats(char);
  const level     = char.level || 1;
  const profBonus = calculateProficiencyBonus(level);
  const classDef  = CLASS_REGISTRY[char.class];
  const saveProficiencies: string[] = classDef?.saveProficiencies || [];
  const dexMod    = calculateModifier(char.abilityScores.DEX);
  const wisMod    = calculateModifier(char.abilityScores.WIS);
  const passivePerception = 10 + wisMod + (char.skillProficiencies?.includes('Perception') ? profBonus : 0);
  const ac        = calc.defense?.armorClass ?? char.ac ?? 10;
  const maxHP     = calc.defense?.hitPoints?.max ?? char.maxHP ?? 1;

  // Class features unlocked at current level
  const classFeatures = CLASS_ABILITIES.filter(a => a.class === char.class && a.minLevel <= level);

  // Weapons from actions
  const weapons = (char.actions || []).filter(a =>
    (a as any).actionType === 'Attack' || a.type === 'Action' || a.name?.toLowerCase().includes('attack')
  ).slice(0, 6);

  // Equipment
  const inventory = char.resources?.inventory || (char as any).equipment || [];

  // Spells
  const hasSpellcasting = !!classDef?.spellcasting;
  const spellAbility = classDef?.spellcasting?.ability as keyof typeof char.abilityScores | undefined;
  const spellMod     = spellAbility ? calculateModifier(char.abilityScores[spellAbility]) : 0;
  const spellSaveDC  = 8 + profBonus + spellMod;
  const spellAtkBonus = profBonus + spellMod;

  return (
    <div className="min-h-screen bg-[#d4c9a8] print:bg-white">
      {/* ── Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Inter:wght@400;600;700;900&display=swap');
        .sheet-font { font-family: 'Inter', sans-serif; }
        @media print {
          .no-print { display: none !important; }
          @page { margin: 0.5cm; size: Letter portrait; }
          .sheet-page { box-shadow: none !important; }
        }
      `}</style>

      {/* ── Nav bar (screen only) ── */}
      <div className="no-print sticky top-0 z-50 bg-[#1a1a1a] border-b border-[#e8d9b5]/20 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#e8d9b5] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#e8d9b5]/50">Character Sheet</p>
            <p className="text-sm font-black text-[#e8d9b5] uppercase tracking-tight leading-none">{char.name || 'Unnamed'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/character-builder?id=${char.id}`)}
            className="px-4 py-1.5 bg-white/10 border border-white/20 text-[#e8d9b5] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
          >Edit</button>
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all"
          >
            <span className="material-symbols-outlined text-xs mr-1">print</span>Print
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ PAGE 1 ══ */}
      <div className="sheet-page sheet-font max-w-[820px] mx-auto my-4 bg-[#f2ede2] shadow-2xl print:my-0 print:shadow-none border border-[#2a2a2a]/30">

        {/* ── TOP HEADER ── */}
        <div className="border-b-2 border-[#1a1a1a] bg-[#f7f4ef] p-2">
          {/* Row 1: name + combat stats */}
          <div className="flex gap-2 mb-1.5">
            {/* Character name block */}
            <div className="flex-grow border border-[#2a2a2a] bg-white px-3 py-1.5 relative">
              <p className="text-[6px] font-black uppercase tracking-[0.15em] text-[#7a7a7a] absolute top-1 left-3">Character Name</p>
              <p className="text-xl font-black uppercase tracking-tighter text-[#1a1a1a] mt-3 leading-none">
                {char.name || 'Unnamed Hero'}
              </p>
            </div>

            {/* Level oval */}
            <div className="w-16 border-2 border-[#1a1a1a] rounded-full bg-[#f7f4ef] flex flex-col items-center justify-center text-center p-1 shrink-0">
              <p className="text-[6px] font-black uppercase tracking-wider text-[#7a7a7a]">Level</p>
              <p className="text-2xl font-black text-[#1a1a1a] leading-none">{level}</p>
              <p className="text-[6px] font-black uppercase tracking-wider text-[#7a7a7a]">XP —</p>
            </div>

            {/* AC */}
            <div className="flex flex-col items-center justify-center w-16 border border-[#2a2a2a] bg-[#f7f4ef] shrink-0 relative">
              <p className="text-[6px] font-black uppercase tracking-wider text-[#5a5a5a] text-center leading-tight">Armor<br/>Class</p>
              <p className="text-3xl font-black text-[#1a1a1a] leading-none">{ac}</p>
            </div>

            {/* Hit Points */}
            <div className="flex-1 border border-[#2a2a2a] bg-[#f7f4ef] p-1 shrink-0">
              <p className="text-[6px] font-black uppercase tracking-[0.15em] text-[#5a5a5a] text-center">Hit Points</p>
              <div className="flex gap-1 mt-1">
                <div className="flex-1 text-center border-r border-[#2a2a2a]/30 pr-1">
                  <p className="text-[6px] text-[#7a7a7a] uppercase">Temp</p>
                  <div className="border-b border-[#2a2a2a] mt-2 h-4" />
                </div>
                <div className="flex-1 text-center border-r border-[#2a2a2a]/30 px-1">
                  <p className="text-[6px] text-[#7a7a7a] uppercase">Current</p>
                  <p className="text-xl font-black text-[#1a1a1a] leading-none mt-0.5">{maxHP}</p>
                </div>
                <div className="flex-1 text-center pl-1">
                  <p className="text-[6px] text-[#7a7a7a] uppercase">Max</p>
                  <p className="text-xl font-black text-[#1a1a1a] leading-none mt-0.5">{maxHP}</p>
                </div>
              </div>
            </div>

            {/* Hit Dice */}
            <div className="w-20 border border-[#2a2a2a] bg-[#f7f4ef] p-1 shrink-0">
              <p className="text-[6px] font-black uppercase tracking-[0.12em] text-[#5a5a5a] text-center">Hit Dice</p>
              <p className="text-center text-base font-black text-[#1a1a1a] mt-1">{level}d{classDef?.hitDie ?? 8}</p>
              <div className="flex gap-1 mt-1">
                <div className="flex-1 text-center border-r border-[#2a2a2a]/30">
                  <div className="border-b border-[#2a2a2a] mt-1 h-3" />
                  <p className="text-[5px] text-[#9a9a9a] uppercase">Spent</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[7px] font-black">{level}</p>
                  <p className="text-[5px] text-[#9a9a9a] uppercase">Max</p>
                </div>
              </div>
            </div>

            {/* Death Saves */}
            <div className="w-24 border border-[#2a2a2a] bg-[#f7f4ef] p-1 shrink-0">
              <p className="text-[6px] font-black uppercase tracking-[0.12em] text-[#5a5a5a] text-center">Death Saves</p>
              <div className="mt-1 space-y-1">
                <div>
                  <p className="text-[6px] uppercase text-[#5a5a5a] mb-0.5">Successes</p>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full border border-[#2a2a2a] bg-white" />)}
                  </div>
                </div>
                <div>
                  <p className="text-[6px] uppercase text-[#5a5a5a] mb-0.5">Failures</p>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full border border-[#2a2a2a] bg-white" />)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: background, class, species, subclass */}
          <div className="flex gap-2">
            {[
              { label: 'Background', value: char.background || '—' },
              { label: 'Class', value: char.class || '—' },
              { label: 'Species', value: char.species || '—' },
              { label: 'Subclass', value: (char as any).subclass || '—' },
              { label: 'Alignment', value: char.alignment || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 border-b-2 border-[#2a2a2a]">
                <p className="text-[6px] font-black uppercase tracking-[0.12em] text-[#7a7a7a]">{label}</p>
                <p className="text-[9px] font-bold text-[#1a1a1a] uppercase tracking-tight">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── D&D LOGO BAND ── */}
        <div className="bg-[#1a1a1a] text-center py-1">
          <span className="text-[#e8d9b5] text-[10px] font-black uppercase tracking-[0.4em]">✦ Dungeons & Dragons ✦</span>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-6 gap-px bg-[#2a2a2a] border-b border-[#2a2a2a]">
          {[
            { label: 'Proficiency Bonus', value: fmt(profBonus) },
            { label: 'Initiative', value: fmt(dexMod) },
            { label: 'Speed', value: `${char.speed ?? 30} ft` },
            { label: 'Size', value: 'Medium' },
            { label: 'Passive Perception', value: passivePerception },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#f7f4ef] flex flex-col items-center justify-center py-1.5 text-center col-span-1">
              <p className="text-[5.5px] font-black uppercase tracking-[0.12em] text-[#5a5a5a] leading-tight">{label}</p>
              <p className="text-lg font-black text-[#1a1a1a] leading-none mt-0.5">{value}</p>
            </div>
          ))}
          {/* Portrait */}
          <div className="bg-[#f7f4ef] flex items-center justify-center col-span-1">
            {char.imageUrl ? (
              <img src={char.imageUrl} alt="Portrait" className="w-12 h-14 object-cover border border-[#2a2a2a]" />
            ) : (
              <div className="w-12 h-14 border border-[#2a2a2a]/30 bg-white/50 flex items-center justify-center">
                <span className="text-2xl font-black text-[#c0b89a]">{char.name?.[0] || '?'}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN BODY ── */}
        <div className="flex gap-px bg-[#2a2a2a]">

          {/* ── LEFT COLUMN: STR / DEX / CON / Inspiration / Equipment ── */}
          <div className="w-[130px] shrink-0 bg-[#f2ede2] p-1.5 space-y-0">
            {(['STR', 'DEX', 'CON'] as const).map(ab => (
              <AbilityBlock
                key={ab}
                ability={ab}
                score={char.abilityScores[ab]}
                profBonus={profBonus}
                saveProficiencies={saveProficiencies}
                skillProficiencies={char.skillProficiencies || []}
              />
            ))}

            {/* Heroic Inspiration */}
            <div className="border border-[#2a2a2a] bg-[#f7f4ef] p-1.5 rounded-sm text-center mt-1">
              <div className="w-8 h-8 border-2 border-[#2a2a2a] rounded-sm mx-auto bg-white mb-1 flex items-center justify-center">
                <span className="text-[#c0b89a] text-xl">✦</span>
              </div>
              <p className="text-[6px] font-black uppercase tracking-[0.12em] text-[#5a5a5a]">Heroic Inspiration</p>
            </div>

            {/* Equipment Training */}
            <div className="border border-[#2a2a2a] bg-[#f7f4ef] p-1.5 rounded-sm mt-1">
              <SectionHeader title="Equipment Training & Proficiencies" />
              <div className="space-y-1">
                <div>
                  <p className="text-[6px] font-black uppercase text-[#5a5a5a]">Armor Training</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {['Light', 'Medium', 'Heavy', 'Shields'].map(a => (
                      <span key={a} className="text-[6px] border border-[#2a2a2a]/30 px-1 rounded-sm text-[#5a5a5a]">◆ {a}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[6px] font-black uppercase text-[#5a5a5a] mt-1">Weapons</p>
                  <div className="border-b border-[#2a2a2a]/30 h-3 mt-1" />
                  <div className="border-b border-[#2a2a2a]/30 h-3 mt-1" />
                </div>
                <div>
                  <p className="text-[6px] font-black uppercase text-[#5a5a5a] mt-1">Tools</p>
                  <div className="border-b border-[#2a2a2a]/30 h-3 mt-1" />
                </div>
              </div>
            </div>
          </div>

          {/* ── MIDDLE COLUMN: INT / WIS / CHA ── */}
          <div className="w-[140px] shrink-0 bg-[#f2ede2] p-1.5 space-y-0">
            {(['INT', 'WIS', 'CHA'] as const).map(ab => (
              <AbilityBlock
                key={ab}
                ability={ab}
                score={char.abilityScores[ab]}
                profBonus={profBonus}
                saveProficiencies={saveProficiencies}
                skillProficiencies={char.skillProficiencies || []}
              />
            ))}
          </div>

          {/* ── RIGHT AREA ── */}
          <div className="flex-grow bg-[#f2ede2] p-2 flex flex-col gap-2">

            {/* Weapons & Damage Cantrips */}
            <div className="border border-[#2a2a2a] bg-[#f7f4ef]">
              <SectionHeader title="Weapons & Damage Cantrips" />
              <table className="w-full text-[7px]">
                <thead>
                  <tr className="border-b border-[#2a2a2a]/30">
                    <th className="text-left px-2 py-0.5 font-bold text-[#5a5a5a] w-2/5">Name</th>
                    <th className="text-left px-1 py-0.5 font-bold text-[#5a5a5a] w-1/5">Atk Bonus / DC</th>
                    <th className="text-left px-1 py-0.5 font-bold text-[#5a5a5a] w-1/4">Damage & Type</th>
                    <th className="text-left px-1 py-0.5 font-bold text-[#5a5a5a]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {weapons.length > 0
                    ? weapons.map((w, i) => (
                      <tr key={i} className="border-b border-[#2a2a2a]/10">
                        <td className="px-2 py-1 font-semibold text-[#1a1a1a]">{w.name}</td>
                        <td className="px-1 py-1 text-center">{fmt(profBonus + calculateModifier(char.abilityScores.STR))}</td>
                        <td className="px-1 py-1">{(w as any).damageDice || '1d6'} {(w as any).damageType || ''}</td>
                        <td className="px-1 py-1 text-[#7a7a7a]">{w.type}</td>
                      </tr>
                    ))
                    : Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#2a2a2a]/10">
                        <td className="px-2 py-2"><div className="border-b border-[#2a2a2a]/20 w-full" /></td>
                        <td className="px-1 py-2"><div className="border-b border-[#2a2a2a]/20 w-full" /></td>
                        <td className="px-1 py-2"><div className="border-b border-[#2a2a2a]/20 w-full" /></td>
                        <td className="px-1 py-2"><div className="border-b border-[#2a2a2a]/20 w-full" /></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* Class Features */}
            <div className="border border-[#2a2a2a] bg-[#f7f4ef] flex-grow">
              <SectionHeader title="Class Features" />
              <div className="p-2 columns-2 gap-3" style={{ columnFill: 'auto', minHeight: 120 }}>
                {classFeatures.length > 0 ? (
                  classFeatures.map(feat => (
                    <div key={feat.id} className="break-inside-avoid mb-2">
                      <p className="text-[7px] font-black uppercase text-[#1a1a1a] tracking-tight leading-tight">{feat.name}</p>
                      <p className="text-[6.5px] text-[#5a5a5a] leading-snug mt-0.5 line-clamp-3">{feat.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="space-y-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="border-b border-[#2a2a2a]/15 pb-1" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Species Traits + Feats (side by side) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-[#2a2a2a] bg-[#f7f4ef]">
                <SectionHeader title="Species Traits" />
                <div className="p-2 space-y-1.5" style={{ minHeight: 80 }}>
                  {((char as any).speciesTraits || []).length > 0
                    ? (char as any).speciesTraits.slice(0, 4).map((t: any) => (
                      <div key={t.name}>
                        <p className="text-[7px] font-black text-[#1a1a1a] uppercase">{t.name}</p>
                        <p className="text-[6.5px] text-[#5a5a5a] leading-snug line-clamp-2">{t.description}</p>
                      </div>
                    ))
                    : Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="border-b border-[#2a2a2a]/15 pb-1 h-4" />
                    ))
                  }
                </div>
              </div>
              <div className="border border-[#2a2a2a] bg-[#f7f4ef]">
                <SectionHeader title="Feats" />
                <div className="p-2 space-y-1.5" style={{ minHeight: 80 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border-b border-[#2a2a2a]/15 pb-1 h-4" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ PAGE 2 ══ */}
      <div className="sheet-page sheet-font max-w-[820px] mx-auto my-4 bg-[#f2ede2] shadow-2xl print:my-0 print:shadow-none print:break-before-page border border-[#2a2a2a]/30">

        {/* D&D Logo band */}
        <div className="bg-[#1a1a1a] text-center py-1 flex items-center justify-center gap-4">
          <span className="text-[#e8d9b5] text-[10px] font-black uppercase tracking-[0.4em]">✦ Dungeons & Dragons ✦</span>
        </div>

        <div className="flex gap-px bg-[#2a2a2a]">

          {/* ── LEFT: Spellcasting + Spell Table ── */}
          <div className="flex-grow bg-[#f2ede2] p-2">

            {/* Spellcasting header */}
            {hasSpellcasting && (
              <div className="border border-[#2a2a2a] bg-[#f7f4ef] mb-2">
                <div className="grid grid-cols-2 gap-px bg-[#2a2a2a]">
                  <div className="bg-[#f7f4ef] p-1.5">
                    <p className="text-[6px] font-black uppercase tracking-[0.12em] text-[#5a5a5a]">Spellcasting Ability</p>
                    <p className="text-sm font-black text-[#1a1a1a]">{spellAbility}</p>
                  </div>
                  <div className="bg-[#f7f4ef] p-1.5 space-y-1">
                    <div className="flex justify-between items-center border-b border-[#2a2a2a]/20 pb-1">
                      <p className="text-[6px] font-black uppercase tracking-wide text-[#5a5a5a]">Spellcasting Modifier</p>
                      <p className="text-sm font-black">{fmt(spellMod)}</p>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#2a2a2a]/20 pb-1">
                      <p className="text-[6px] font-black uppercase tracking-wide text-[#5a5a5a]">Spell Save DC</p>
                      <p className="text-sm font-black">{spellSaveDC}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[6px] font-black uppercase tracking-wide text-[#5a5a5a]">Spell Attack Bonus</p>
                      <p className="text-sm font-black">{fmt(spellAtkBonus)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Spell Slots */}
            {hasSpellcasting && (
              <div className="border border-[#2a2a2a] bg-[#f7f4ef] mb-2">
                <SectionHeader title="Spell Slots" />
                <div className="p-1.5 grid grid-cols-3 gap-1">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map(lvl => (
                    <div key={lvl} className="flex items-center gap-1 border border-[#2a2a2a]/20 px-1.5 py-1 bg-white/50">
                      <p className="text-[6.5px] font-black uppercase text-[#5a5a5a] w-10">Level {lvl}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.max(1, 5 - Math.floor(lvl / 2)) }).map((_, i) => (
                          <div key={i} className="w-2.5 h-2.5 border border-[#2a2a2a] bg-white rounded-sm" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cantrips & Prepared Spells table */}
            <div className="border border-[#2a2a2a] bg-[#f7f4ef]">
              <SectionHeader title="Cantrips & Prepared Spells" />
              <table className="w-full text-[6.5px]">
                <thead>
                  <tr className="border-b border-[#2a2a2a]/40 bg-[#f2ede2]">
                    <th className="text-left px-1 py-0.5 font-bold text-[#5a5a5a] w-6">Lvl</th>
                    <th className="text-left px-1 py-0.5 font-bold text-[#5a5a5a] flex-grow">Name</th>
                    <th className="text-left px-1 py-0.5 font-bold text-[#5a5a5a] w-12">Cast Time</th>
                    <th className="text-left px-1 py-0.5 font-bold text-[#5a5a5a] w-12">Range</th>
                    <th className="text-center px-1 py-0.5 font-bold text-[#5a5a5a] w-16">C · R · M</th>
                    <th className="text-left px-1 py-0.5 font-bold text-[#5a5a5a]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Populated spells */}
                  {(char.magic?.spells || []).slice(0, 8).map((spellId, i) => (
                    <tr key={spellId} className="border-b border-[#2a2a2a]/10">
                      <td className="px-1 py-1 text-center text-[#7a7a7a]">—</td>
                      <td className="px-1 py-1 font-semibold capitalize">{spellId.replace(/-/g, ' ')}</td>
                      <td className="px-1 py-1 text-[#7a7a7a]">1 Action</td>
                      <td className="px-1 py-1 text-[#7a7a7a]">60 ft</td>
                      <td className="px-1 py-1 text-center">
                        <div className="flex gap-0.5 justify-center">
                          {['C','R','M'].map(t => <div key={t} className="w-2.5 h-2.5 border border-[#2a2a2a]/40 rounded-sm text-[5px] flex items-center justify-center text-[#7a7a7a]">{t}</div>)}
                        </div>
                      </td>
                      <td className="px-1 py-1" />
                    </tr>
                  ))}
                  {/* Empty rows */}
                  {Array.from({ length: Math.max(0, 20 - (char.magic?.spells?.length ?? 0)) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-[#2a2a2a]/10">
                      <td className="px-1 py-1.5" />
                      <td className="px-1 py-1.5" />
                      <td className="px-1 py-1.5" />
                      <td className="px-1 py-1.5" />
                      <td className="px-1 py-1.5">
                        <div className="flex gap-0.5 justify-center">
                          {['C','R','M'].map(t => <div key={t} className="w-2.5 h-2.5 border border-[#2a2a2a]/20 rounded-sm text-[5px] flex items-center justify-center text-[#c0b89a]">{t}</div>)}
                        </div>
                      </td>
                      <td className="px-1 py-1.5" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── RIGHT: Appearance / Backstory / Languages / Equipment / Coins ── */}
          <div className="w-[220px] shrink-0 bg-[#f2ede2] p-2 space-y-2">

            {/* Appearance */}
            <div className="border border-[#2a2a2a] bg-[#f7f4ef]">
              <SectionHeader title="Appearance" />
              <div className="p-1.5">
                {char.imageUrl ? (
                  <img src={char.imageUrl} alt="Portrait" className="w-full h-24 object-cover border border-[#2a2a2a]/30 mb-1" />
                ) : (
                  <div className="w-full h-24 border border-[#2a2a2a]/20 bg-white/50 flex items-center justify-center mb-1">
                    <span className="text-3xl text-[#c0b89a] font-black">{char.name?.[0] || '?'}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-0.5">
                  {[
                    ['Age', (char as any).age || '—'],
                    ['Height', (char as any).height || '—'],
                    ['Weight', (char as any).weight || '—'],
                    ['Eyes', (char as any).eyes || '—'],
                    ['Skin', (char as any).skin || '—'],
                    ['Hair', (char as any).hair || '—'],
                  ].map(([l, v]) => (
                    <div key={l} className="border-b border-[#2a2a2a]/20">
                      <p className="text-[5.5px] text-[#7a7a7a] uppercase">{l}</p>
                      <p className="text-[7px] font-semibold text-[#1a1a1a]">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Backstory & Personality */}
            <div className="border border-[#2a2a2a] bg-[#f7f4ef]">
              <SectionHeader title="Backstory & Personality" />
              <div className="p-1.5 space-y-1" style={{ minHeight: 80 }}>
                {(char as any).backstory ? (
                  <p className="text-[7px] text-[#3a3a3a] leading-snug">{(char as any).backstory}</p>
                ) : (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border-b border-[#2a2a2a]/15 h-3" />
                  ))
                )}
                <div className="flex items-start gap-1 mt-1">
                  <p className="text-[6px] text-[#7a7a7a] uppercase shrink-0">Alignment</p>
                  <p className="text-[7px] font-semibold text-[#1a1a1a]">{char.alignment || '—'}</p>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="border border-[#2a2a2a] bg-[#f7f4ef]">
              <SectionHeader title="Languages" />
              <div className="p-1.5 space-y-1" style={{ minHeight: 40 }}>
                <p className="text-[7px] text-[#5a5a5a]">Common{(char as any).languages ? `, ${(char as any).languages}` : ''}</p>
                {Array.from({ length: 2 }).map((_, i) => <div key={i} className="border-b border-[#2a2a2a]/15 h-3" />)}
              </div>
            </div>

            {/* Equipment */}
            <div className="border border-[#2a2a2a] bg-[#f7f4ef]">
              <SectionHeader title="Equipment" />
              <div className="p-1.5 space-y-0.5" style={{ minHeight: 60 }}>
                {inventory.length > 0
                  ? inventory.slice(0, 10).map((item: any, i: number) => (
                    <p key={i} className="text-[7px] text-[#1a1a1a] border-b border-[#2a2a2a]/10 pb-0.5">
                      {item.name || item}
                    </p>
                  ))
                  : Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border-b border-[#2a2a2a]/15 h-3" />
                  ))
                }
                <p className="text-[6px] font-black uppercase text-[#7a7a7a] mt-2">Magic Item Attunement</p>
                {[0,1,2].map(i => <div key={i} className="border-b border-[#2a2a2a]/20 h-3 flex items-center"><span className="text-[#c0b89a] text-[8px] mr-1">◆</span></div>)}
              </div>
            </div>

            {/* Coins */}
            <div className="border border-[#2a2a2a] bg-[#f7f4ef]">
              <SectionHeader title="Coins" />
              <div className="p-1.5">
                <div className="grid grid-cols-5 gap-0.5">
                  {['CP','SP','EP','GP','PP'].map(coin => (
                    <div key={coin} className="text-center">
                      <p className="text-[6px] font-black uppercase text-[#5a5a5a]">{coin}</p>
                      <div className="border border-[#2a2a2a] bg-white h-6 mt-0.5 rounded-sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
