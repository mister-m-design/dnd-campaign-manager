'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, FolderOpen, Trash2, Copy, Clock, Swords,
  MapPin, Tag, FileText, ChevronDown, ChevronUp, AlertTriangle,
  Bookmark, BookMarked, Plus, RefreshCw,
} from 'lucide-react';
import type { CombatantState, LogEntry } from '@/types';
import { useBattleState, BattleSnapshot } from '@/hooks/useBattleState';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── SNAPSHOT CARD ────────────────────────────────────────────────────────────

function SnapshotCard({
  snapshot,
  onLoad,
  onDelete,
  onDuplicate,
  onEdit,
}: {
  snapshot: BattleSnapshot;
  onLoad: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: (updates: Partial<BattleSnapshot>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allies = snapshot.combatants.filter(c => c.side === 'Ally');
  const enemies = snapshot.combatants.filter(c => c.side === 'Enemy');
  const downed = snapshot.combatants.filter(c => c.currentHP <= 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden group"
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-3">
        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${snapshot.isPrepMode ? 'bg-blue-900/40 text-blue-400' : 'bg-amber-900/40 text-amber-400'}`}>
          {snapshot.isPrepMode ? <BookMarked size={14} /> : <Bookmark size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-100 truncate">{snapshot.name}</div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {snapshot.isPrepMode && (
                  <span className="text-[9px] bg-blue-900/40 text-blue-300 border border-blue-700/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Prep Mode</span>
                )}
                <span className="text-[9px] text-slate-500">Round {snapshot.round}</span>
                <span className="text-[9px] text-slate-500">{snapshot.combatants.length} combatants</span>
                <span className="text-[9px] text-slate-500">{timeAgo(snapshot.updatedAt)}</span>
              </div>
            </div>
            <button onClick={() => setExpanded(v => !v)} className="text-slate-600 hover:text-slate-400 transition-colors shrink-0 mt-0.5">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Combatant counts */}
          <div className="flex items-center gap-3 mt-2 text-[10px]">
            <span className="text-amber-400/80 font-semibold">{allies.length} allies</span>
            <span className="text-red-400/80 font-semibold">{enemies.length} enemies</span>
            {downed.length > 0 && <span className="text-slate-500">{downed.length} downed</span>}
            {snapshot.location && (
              <span className="flex items-center gap-0.5 text-slate-500">
                <MapPin size={9} /> {snapshot.location}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onLoad} title="Load this battle state"
            className="flex items-center gap-1 px-2 py-1 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 rounded-lg text-[9px] font-bold transition-colors">
            <FolderOpen size={10} /> Load
          </button>
          <button onClick={onDuplicate} title="Duplicate"
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <Copy size={12} />
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button onClick={onDelete} className="text-[8px] px-1.5 py-0.5 bg-red-700 text-white rounded font-bold">Del</button>
              <button onClick={() => setConfirmDelete(false)} className="text-[8px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete"
              className="p-1 text-slate-600 hover:text-red-400 transition-colors">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-slate-700/50">
            <div className="p-3 space-y-2.5">
              {/* Combatant list */}
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Combatants</p>
                <div className="space-y-1">
                  {snapshot.combatants.map(c => (
                    <div key={c.instanceId} className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-slate-800/50">
                      <span className={`font-medium ${c.side === 'Ally' ? 'text-amber-300' : 'text-red-300'}`}>{c.name}</span>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>HP {c.currentHP}/{c.maxHP}</span>
                        <span>Init {c.initiative}</span>
                        {c.conditions.length > 0 && (
                          <span className="text-purple-400">{c.conditions.join(', ')}</span>
                        )}
                        {c.currentHP <= 0 && <span className="text-red-500 font-bold">Down</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Notes */}
              {snapshot.encounterNotes && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1">Notes</p>
                  <p className="text-[10px] text-slate-400 bg-slate-800/50 rounded px-2 py-1.5">{snapshot.encounterNotes}</p>
                </div>
              )}
              {/* Timestamps */}
              <div className="text-[8px] text-slate-600">
                Created {formatDate(snapshot.createdAt)} · Updated {formatDate(snapshot.updatedAt)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── SAVE FORM ────────────────────────────────────────────────────────────────

function SaveForm({
  combatants,
  activeCombatantId,
  round,
  log,
  onSave,
  onCancel,
}: {
  combatants: CombatantState[];
  activeCombatantId: string | null;
  round: number;
  log: LogEntry[];
  onSave: (name: string, opts: { isPrepMode: boolean; location: string; notes: string; tags: string[] }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(`Battle – Round ${round}`);
  const [isPrepMode, setIsPrepMode] = useState(round === 0);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Save size={14} className="text-amber-400" />
        <span className="font-semibold text-sm text-slate-100">Save Battle State</span>
        <button onClick={onCancel} className="ml-auto text-slate-500 hover:text-slate-300"><X size={14} /></button>
      </div>

      <div className="space-y-2.5">
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100
              focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Location</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Dungeon Level 2…"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100
                placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Tags</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="boss, dungeon, session3…"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100
                placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="DM notes for this encounter…"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100
              placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input type="checkbox" checked={isPrepMode} onChange={e => setIsPrepMode(e.target.checked)} className="accent-amber-500" />
          <BookMarked size={12} className="text-blue-400" />
          <span>Prep Mode</span>
          <span className="text-slate-500">– pre-staged, not yet started</span>
        </label>
      </div>

      <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
        <span>{combatants.length} combatants · Round {round}</span>
        <button
          onClick={() => onSave(name.trim() || 'Unnamed Battle', {
            isPrepMode,
            location: location.trim(),
            notes: notes.trim(),
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors"
        >
          <Save size={12} /> Save
        </button>
      </div>
    </motion.div>
  );
}

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────

export interface BattleStatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  combatants: CombatantState[];
  activeCombatantId: string | null;
  round: number;
  log: LogEntry[];
  onLoadSnapshot: (snapshot: BattleSnapshot) => void;
}

export default function BattleStatePanel({
  isOpen,
  onClose,
  combatants,
  activeCombatantId,
  round,
  log,
  onLoadSnapshot,
}: BattleStatePanelProps) {
  const { snapshots, saveSnapshot, updateSnapshot, deleteSnapshot, duplicateSnapshot } = useBattleState();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmLoad, setConfirmLoad] = useState<BattleSnapshot | null>(null);

  const filtered = snapshots.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.location ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (s.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = (
    name: string,
    opts: { isPrepMode: boolean; location: string; notes: string; tags: string[] }
  ) => {
    saveSnapshot({
      name,
      isPrepMode: opts.isPrepMode,
      combatants,
      activeCombatantId,
      round,
      log,
      location: opts.location,
      encounterNotes: opts.notes,
      tags: opts.tags,
    });
    setShowSaveForm(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 40 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[420px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <Bookmark size={16} className="text-amber-400" />
                <span className="font-bold text-sm text-slate-100">Battle States</span>
                {snapshots.length > 0 && (
                  <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">{snapshots.length}</span>
                )}
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Save controls */}
            <div className="px-3 pt-3 space-y-3 shrink-0">
              <AnimatePresence>
                {showSaveForm && (
                  <SaveForm
                    combatants={combatants}
                    activeCombatantId={activeCombatantId}
                    round={round}
                    log={log}
                    onSave={handleSave}
                    onCancel={() => setShowSaveForm(false)}
                  />
                )}
              </AnimatePresence>

              {!showSaveForm && (
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600/15 border border-amber-500/30
                    hover:bg-amber-600/25 hover:border-amber-500/50 text-amber-300 rounded-xl text-xs font-bold transition-colors"
                >
                  <Save size={13} /> Save Current Battle State
                </button>
              )}

              {/* Search */}
              {snapshots.length > 0 && (
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, location, tags…"
                    className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100
                      placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Bookmark size={28} className="text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-400 font-medium">
                      {snapshots.length === 0 ? 'No saved battles yet' : 'No matches'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {snapshots.length === 0
                        ? 'Save the current battle state to resume it later or prep encounters in advance'
                        : 'Try a different search'}
                    </p>
                  </div>
                  {snapshots.length === 0 && (
                    <button onClick={() => setShowSaveForm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold mt-1 transition-colors">
                      <Save size={12} /> Save Now
                    </button>
                  )}
                </div>
              ) : (
                <AnimatePresence>
                  {filtered.map(snap => (
                    <SnapshotCard
                      key={snap.id}
                      snapshot={snap}
                      onLoad={() => setConfirmLoad(snap)}
                      onDelete={() => deleteSnapshot(snap.id)}
                      onDuplicate={() => duplicateSnapshot(snap.id)}
                      onEdit={updates => updateSnapshot(snap.id, updates)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Load confirmation */}
            <AnimatePresence>
              {confirmLoad && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 z-10 flex items-end"
                >
                  <div className="w-full bg-slate-900 border-t border-amber-500/30 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-100">Load "{confirmLoad.name}"?</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          This will replace the current combat state with the saved snapshot. Current progress will be lost unless you save it first.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setConfirmLoad(null)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onLoadSnapshot(confirmLoad);
                          setConfirmLoad(null);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        <FolderOpen size={12} /> Load State
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
