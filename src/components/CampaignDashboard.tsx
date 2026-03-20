"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';
import Image from 'next/image';
import Link from 'next/link';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useSyncedState } from '@/hooks/useSyncedState';
import { useAutoBackup } from '@/hooks/useAutoBackup';
import { exportBackup, importBackup, restoreAutoBackup } from '@/lib/autoBackup';
import { generateSafeId } from '@/lib/utils';
import { useBattleState } from '@/hooks/useBattleState';
import type { CombatantState } from '@/types';
import WorldMap from '@/components/WorldMap';

// ─── PARTY STATUS WIDGET ──────────────────────────────────────────────────────

function PartyStatusWidget() {
  const [combatants, setCombatants] = useState<CombatantState[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mythic_v1_combatants');
      if (raw) setCombatants(JSON.parse(raw));
    } catch {}
  }, []);

  const allies = combatants.filter(c => c.side === 'Ally' && c.inCombat);
  if (allies.length === 0) return null;

  return (
    <section className="obsidian-panel rounded-3xl p-6 border border-white/5">
      <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-sm">favorite</span>
        Party Status (Active Combat)
      </h3>
      <div className="space-y-2.5">
        {allies.map(c => {
          const pct = c.maxHP > 0 ? Math.round((c.currentHP / c.maxHP) * 100) : 0;
          const bar = pct > 60 ? 'bg-green-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500';
          return (
            <div key={c.instanceId} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-black text-slate-200 uppercase tracking-tight">{c.name}</span>
                <span className={`font-bold ${pct <= 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {c.currentHP <= 0 ? 'DOWN' : `${c.currentHP} / ${c.maxHP} HP`}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${Math.max(0, pct)}%` }} />
              </div>
              {c.conditions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.conditions.map(cond => (
                    <span key={cond} className="text-[7px] bg-purple-900/30 text-purple-300 border border-purple-700/30 px-1.5 py-0.5 rounded font-bold uppercase">{cond}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── RECENT ENCOUNTERS WIDGET ─────────────────────────────────────────────────

function RecentEncountersWidget() {
  const { snapshots } = useBattleState();
  const recent = snapshots.slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <section className="obsidian-panel rounded-3xl p-6 border border-white/5">
      <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-sm">history</span>
        Recent Encounters
      </h3>
      <div className="space-y-2">
        {recent.map(snap => {
          const allies = snap.combatants.filter(c => c.side === 'Ally').length;
          const enemies = snap.combatants.filter(c => c.side === 'Enemy').length;
          const downed = snap.combatants.filter(c => c.currentHP <= 0).length;
          const dateStr = new Date(snap.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <Link
              key={snap.id}
              href="/combat"
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-primary/5 hover:border-primary/20 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-slate-200 uppercase truncate group-hover:text-white">{snap.name}</p>
                  {snap.isPrepMode && <span className="text-[7px] bg-blue-900/40 text-blue-300 border border-blue-700/30 px-1 py-0.5 rounded font-bold">PREP</span>}
                </div>
                <div className="text-[8px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>{allies}v{enemies}</span>
                  {downed > 0 && <span className="text-red-400">{downed} downed</span>}
                  {snap.location && <span className="text-slate-600">· {snap.location}</span>}
                </div>
              </div>
              <span className="text-[8px] text-slate-600 ml-2 shrink-0">{dateStr}</span>
            </Link>
          );
        })}
      </div>
      <Link href="/combat" className="block text-center text-[8px] font-black text-primary/70 hover:text-primary uppercase tracking-widest mt-3 transition-colors">
        Open Combat Tracker →
      </Link>
    </section>
  );
}

// ─── LOCATION TRACKER WIDGET ──────────────────────────────────────────────────

interface LocationEntry {
  id: string;
  name: string;
  type: 'City' | 'Dungeon' | 'Wilderness' | 'POI' | 'Region';
  visited: boolean;
  notes?: string;
  current?: boolean;
}

function LocationTrackerWidget({ campaignId }: { campaignId: string }) {
  const [locations, setLocations] = usePersistentState<LocationEntry[]>(`mythic_locations_${campaignId}`, []);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<LocationEntry['type']>('City');

  const addLocation = () => {
    if (!newName.trim()) return;
    const entry: LocationEntry = {
      id: generateSafeId(),
      name: newName.trim(),
      type: newType,
      visited: false,
      current: false,
    };
    setLocations(prev => [...prev, entry]);
    setNewName('');
    setAdding(false);
  };

  const toggleVisited = (id: string) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, visited: !l.visited } : l));
  };

  const setCurrentLocation = (id: string) => {
    setLocations(prev => prev.map(l => ({ ...l, current: l.id === id ? !l.current : false })));
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const typeIcon: Record<LocationEntry['type'], string> = {
    City: 'location_city', Dungeon: 'castle', Wilderness: 'forest',
    POI: 'place', Region: 'map',
  };

  return (
    <section className="obsidian-panel rounded-3xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">map</span>
          Locations
        </h3>
        <button onClick={() => setAdding(v => !v)}
          className="text-[8px] font-black text-primary/70 hover:text-primary uppercase tracking-widest border border-primary/20 px-3 py-1 rounded-xl hover:border-primary/40 transition-all">
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3">
            <div className="space-y-2 pb-3 border-b border-white/5">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addLocation()}
                placeholder="Location name…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:border-primary/40"
              />
              <div className="flex gap-2">
                {(['City','Dungeon','Wilderness','POI','Region'] as const).map(t => (
                  <button key={t} onClick={() => setNewType(t)}
                    className={`text-[8px] font-black px-2 py-1 rounded-lg border transition-colors uppercase ${newType === t ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <button onClick={addLocation} className="w-full py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary/25 transition-all">
                Add Location
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {locations.length === 0 ? (
        <p className="text-[9px] text-slate-600 italic text-center py-4">No locations tracked yet</p>
      ) : (
        <div className="space-y-1.5">
          {locations.map(loc => (
            <div key={loc.id} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all group ${loc.current ? 'bg-primary/5 border-primary/20' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
              <button onClick={() => setCurrentLocation(loc.id)} title="Set as current location"
                className="shrink-0">
                <span className={`material-symbols-outlined text-sm ${loc.current ? 'text-primary' : 'text-slate-600 group-hover:text-slate-400'}`}>
                  {typeIcon[loc.type]}
                </span>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-black uppercase truncate ${loc.current ? 'text-primary' : loc.visited ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                    {loc.name}
                  </span>
                  {loc.current && <span className="text-[7px] bg-primary/15 text-primary border border-primary/30 px-1 py-0.5 rounded font-bold uppercase">Here</span>}
                </div>
                <span className="text-[7px] text-slate-600 uppercase tracking-widest">{loc.type}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleVisited(loc.id)} title={loc.visited ? 'Mark unvisited' : 'Mark visited'}
                  className={`p-1 rounded transition-colors ${loc.visited ? 'text-green-400' : 'text-slate-600 hover:text-slate-300'}`}>
                  <span className="material-symbols-outlined text-xs">{loc.visited ? 'check_circle' : 'radio_button_unchecked'}</span>
                </button>
                <button onClick={() => deleteLocation(loc.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
                  <span className="material-symbols-outlined text-xs">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface CampaignLog {
    id: string;
    date: string;
    title: string;
    content: string;
}

interface Campaign {
    id: string;
    name: string;
    dm: string;
    setting: string;
    level: number;
    partyIds: string[];
    status: string;
    nextSession?: string;
    logs: CampaignLog[];
}

// ─── CAMPAIGN MAPS WIDGET ─────────────────────────────────────────────────────

interface CampaignMapEntry {
  id: string;
  name: string;
  createdAt: string;
}

function CampaignMapsWidget({ campaignId }: { campaignId: string }) {
  const [maps, setMaps] = usePersistentState<CampaignMapEntry[]>(`mythic_campaign_maps_${campaignId}`, []);
  const [activeMapId, setActiveMapId] = usePersistentState<string | null>(`mythic_campaign_active_map_${campaignId}`, null);
  const [isAdding, setIsAdding] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  // Ensure an active map is selected
  React.useEffect(() => {
    if (maps.length > 0 && (!activeMapId || !maps.find(m => m.id === activeMapId))) {
      setActiveMapId(maps[0].id);
    }
  }, [maps, activeMapId, setActiveMapId]);

  const addMap = () => {
    if (!newMapName.trim()) return;
    const newMap: CampaignMapEntry = {
      id: generateSafeId(),
      name: newMapName.trim(),
      createdAt: new Date().toISOString(),
    };
    setMaps(prev => [...prev, newMap]);
    setActiveMapId(newMap.id);
    setNewMapName('');
    setIsAdding(false);
  };

  const deleteMap = (id: string) => {
    setMaps(prev => prev.filter(m => m.id !== id));
    if (activeMapId === id) {
      const remaining = maps.filter(m => m.id !== id);
      setActiveMapId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const activeMap = maps.find(m => m.id === activeMapId);

  return (
    <section className="obsidian-panel rounded-3xl border border-white/5 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">map</span>
          Campaign Maps
          {maps.length > 0 && (
            <span className="text-[8px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-black">
              {maps.length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(v => !v)}
            className="text-[8px] font-black text-primary/70 hover:text-primary uppercase tracking-widest border border-primary/20 px-3 py-1 rounded-xl hover:border-primary/40 transition-all"
          >
            + New Map
          </button>
          <button
            onClick={() => setCollapsed(v => !v)}
            className="size-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all"
            title={collapsed ? 'Expand map' : 'Collapse map'}
          >
            <span className="material-symbols-outlined text-sm text-slate-500">
              {collapsed ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
      </div>

      {/* Map tab switcher */}
      {maps.length > 1 && (
        <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto">
          {maps.map(m => (
            <div key={m.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setActiveMapId(m.id)}
                className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all border ${
                  activeMapId === m.id
                    ? 'bg-primary/15 border-primary/40 text-primary'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.name}
              </button>
              {maps.length > 1 && (
                <button
                  onClick={() => deleteMap(m.id)}
                  className="size-5 flex items-center justify-center rounded text-slate-600 hover:text-red-400 transition-colors"
                  title="Delete map"
                >
                  <span className="material-symbols-outlined text-[10px]">close</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Map Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 p-4 border-b border-white/5">
              <input
                value={newMapName}
                onChange={e => setNewMapName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMap()}
                placeholder="Map name (e.g. Faerun, The Underdark)…"
                autoFocus
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary/40"
              />
              <button
                onClick={addMap}
                className="px-4 py-2 bg-primary/15 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/25 transition-all"
              >
                Create
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 text-slate-500 hover:text-slate-300 text-[9px] font-black uppercase"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Content */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ height: maps.length > 0 ? '500px' : 'auto' }}
          >
            {maps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-700 mb-3">map</span>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">No maps yet</p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="text-[9px] font-black text-primary uppercase tracking-widest border border-primary/20 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all"
                >
                  + Create First Map
                </button>
              </div>
            ) : activeMap ? (
              <div className="h-full">
                <WorldMap campaignId={activeMap.id} />
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function CampaignDashboard() {
    const [campaigns, setCampaigns] = useSyncedState<Campaign[]>('/api/campaigns', 'mythic_campaigns', []);
    const [savedCharacters] = useSyncedState<any[]>('/api/characters', 'mythic_saved_characters', []);
    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

    // Auto-select first campaign if none selected
    React.useEffect(() => {
        if (!activeCampaignId && campaigns.length > 0) {
            setActiveCampaignId(campaigns[0].id);
        }
    }, [campaigns, activeCampaignId]);

    const backupStatus = useAutoBackup();
    const backupFileRef = useRef<HTMLInputElement>(null);

    const [isCreating, setIsCreating] = useState(false);
    const [isEditingCampaign, setIsEditingCampaign] = useState(false);
    const [isRecruiting, setIsRecruiting] = useState(false);
    const [isLogging, setIsLogging] = useState(false);

    const [newCampaign, setNewCampaign] = useState({
        name: '',
        dm: 'Michael Murtha',
        setting: '',
        level: 1
    });

    const [editCampaignData, setEditCampaignData] = useState({
        name: '',
        dm: '',
        setting: '',
        level: 1
    });

    const [newLog, setNewLog] = useState({
        title: '',
        content: ''
    });

    const currentCampaign = useMemo(() =>
        campaigns.find(c => c.id === activeCampaignId) || campaigns[0]
        , [campaigns, activeCampaignId]);

    const handleEditStart = () => {
        if (!currentCampaign) return;
        setEditCampaignData({
            name: currentCampaign.name,
            dm: currentCampaign.dm,
            setting: currentCampaign.setting,
            level: currentCampaign.level
        });
        setIsEditingCampaign(true);
    };

    const handleUpdateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCampaign || !editCampaignData.name) return;

        const updatedCampaign = { ...currentCampaign, ...editCampaignData };

        try {
            await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCampaign)
            });

            setCampaigns(prev => prev.map(c => c.id === currentCampaign.id ? updatedCampaign : c));
            setIsEditingCampaign(false);
        } catch (err) {
            console.error("Failed to update campaign on master:", err);
        }
    };

    const activeParty = useMemo(() => {
        if (!currentCampaign) return [];
        return savedCharacters.filter(char => currentCampaign.partyIds?.includes(char.id));
    }, [savedCharacters, currentCampaign]);

    const availableHeroes = useMemo(() => {
        if (!currentCampaign) return [];
        return savedCharacters.filter(char => !currentCampaign.partyIds?.includes(char.id) && !char.retired);
    }, [savedCharacters, currentCampaign]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCampaign.name) return;

        const campaign: Campaign = {
            ...newCampaign,
            id: generateSafeId(),
            partyIds: [],
            status: "Starting",
            nextSession: new Date().toISOString(),
            logs: []
        };

        try {
            await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaign)
            });

            setCampaigns(prev => [...prev, campaign]);
            setActiveCampaignId(campaign.id);
            setIsCreating(false);
        } catch (err) {
            console.error("Failed to project campaign to master:", err);
        }
    };

    const toggleHeroRecruitment = async (heroId: string) => {
        if (!currentCampaign) return;

        const partyIds = currentCampaign.partyIds || [];
        const isRecruited = partyIds.includes(heroId);
        const nextPartyIds = isRecruited
            ? partyIds.filter(id => id !== heroId)
            : [...partyIds, heroId];

        const updatedCampaign = { ...currentCampaign, partyIds: nextPartyIds };

        try {
            await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCampaign)
            });

            setCampaigns(prev => prev.map(c => c.id === currentCampaign.id ? updatedCampaign : c));
        } catch (err) {
            console.error("Failed to sync party update to master:", err);
        }
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCampaign || !newLog.title) return;

        const logEntry: CampaignLog = {
            id: generateSafeId(),
            date: new Date().toLocaleDateString(),
            title: newLog.title,
            content: newLog.content
        };

        const updatedCampaign = {
            ...currentCampaign,
            logs: [logEntry, ...(currentCampaign.logs || [])]
        };

        try {
            await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCampaign)
            });

            setCampaigns(prev => prev.map(c => c.id === currentCampaign.id ? updatedCampaign : c));
            setNewLog({ title: '', content: '' });
            setIsLogging(false);
        } catch (err) {
            console.error("Failed to sync chronicle to master:", err);
        }
    };

    const [deleteLogTargetId, setDeleteLogTargetId] = useState<string | null>(null);

    const deleteLog = () => {
        if (!currentCampaign || !deleteLogTargetId) return;

        setCampaigns(prev => prev.map(c => {
            if (c.id === currentCampaign.id) {
                return {
                    ...c,
                    logs: c.logs.filter(l => l.id !== deleteLogTargetId)
                };
            }
            return c;
        }));
        setDeleteLogTargetId(null);
    };

    if (isCreating) {
        return (
            <div className="max-w-2xl mx-auto p-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-12">
                    <button onClick={() => setIsCreating(false)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">Establish Campaign</h1>
                        <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">Foundation for a new legend</p>
                    </div>
                </motion.div>

                <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate} className="obsidian-panel rounded-3xl p-10 border border-white/5 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Campaign Name</label>
                        <input type="text" required value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all placeholder:text-slate-700" placeholder="e.g. Shadows of Ravenloft" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">World Setting</label>
                        <input type="text" value={newCampaign.setting} onChange={(e) => setNewCampaign({ ...newCampaign, setting: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all placeholder:text-slate-700" placeholder="e.g. Forgotten Realms, Homebrew" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Dungeon Master</label>
                            <input type="text" value={newCampaign.dm} onChange={(e) => setNewCampaign({ ...newCampaign, dm: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Starting Level</label>
                            <input type="number" min="1" max="20" value={newCampaign.level} onChange={(e) => setNewCampaign({ ...newCampaign, level: parseInt(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                        </div>
                    </div>
                    <div className="pt-6">
                        <button type="submit" className="w-full bg-primary text-black py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all primary-glow">Commence Adventure</button>
                    </div>
                </motion.form>
            </div>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full animate-pulse" />
                    <div className="size-28 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center relative backdrop-blur-xl">
                        <span className="material-symbols-outlined text-6xl text-slate-700">fort</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-100 uppercase tracking-tighter">No Active Campaigns</h2>
                    <p className="text-slate-500 max-w-md mx-auto font-medium">Every legend begins somewhere. Create your first campaign to start orchestrating your world.</p>
                </div>
                <button onClick={() => setIsCreating(true)} className="bg-primary text-black px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:scale-105 active:scale-95 transition-all primary-glow border-t border-white/20">Begin New Adventure</button>
            </div>
        );
    }

    if (!currentCampaign) return null;

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header section with Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-100 uppercase tracking-tighter">{currentCampaign.name}</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">history_edu</span>
                                DM: {currentCampaign.dm}
                            </p>
                            <span className="text-slate-700">|</span>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{currentCampaign.setting}</p>
                        </div>
                    </div>
                    {campaigns.length > 1 && (
                        <select
                            value={activeCampaignId || ''}
                            onChange={(e) => setActiveCampaignId(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 outline-none focus:border-primary/50"
                        >
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                    <button onClick={() => setIsCreating(true)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-primary transition-all">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
                <div className="flex gap-4">
                    <div className="obsidian-panel rounded-2xl px-6 py-3 text-center border-t border-white/10 min-w-[100px]">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Party Level</p>
                        <p className="text-2xl font-black text-slate-200">{currentCampaign.level}</p>
                    </div>
                    <div className="obsidian-panel rounded-2xl px-6 py-3 text-center border-t border-white/10 min-w-[100px]">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Members</p>
                        <p className="text-2xl font-black text-slate-200">{currentCampaign.partyIds?.length || 0}</p>
                    </div>
                    <button
                        onClick={handleEditStart}
                        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-center min-w-[100px] hover:bg-white/10 transition-all group"
                    >
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-primary">Edit Details</p>
                        <p className="text-2xl font-black text-slate-200 group-hover:text-white"><span className="material-symbols-outlined text-sm">settings</span></p>
                    </button>
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl px-6 py-3 text-center min-w-[100px]">
                        <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Chronicles</p>
                        <p className="text-2xl font-black text-primary">{currentCampaign.logs?.length || 0}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Party & Journals */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Party Overview */}
                    <section className="obsidian-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">group</span>
                                Active Party Members
                            </h3>
                            <button
                                onClick={() => setIsRecruiting(true)}
                                className="text-primary text-[10px] font-black uppercase tracking-[0.1em] px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-all"
                            >
                                Recruit Hero
                            </button>
                        </div>

                        {activeParty.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                                <span className="material-symbols-outlined text-slate-700 text-4xl mb-4">person_add</span>
                                <p className="text-slate-500 text-sm font-medium">No heroes have joined this quest yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeParty.map(hero => (
                                    <div key={hero.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-4 items-center group relative">
                                        <div className="size-16 rounded-xl bg-slate-900 border border-white/10 relative overflow-hidden">
                                            {hero.image && <Image src={hero.image} alt={hero.name} fill className="object-cover" />}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-xs font-black text-slate-100 uppercase tracking-tight">{hero.name}</p>
                                            <p className="text-[9px] font-bold text-primary uppercase tracking-widest">{hero.class} · Level {hero.level}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleHeroRecruitment(hero.id)}
                                            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 size-8 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 transition-all hover:text-white"
                                            title="Remove from Party"
                                        >
                                            <span className="material-symbols-outlined text-sm">person_remove</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Chronicles / Campaign Log */}
                    <section className="obsidian-panel rounded-3xl p-8 border border-white/5">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">history_edu</span>
                                Chronicles of the Realm
                            </h3>
                            <button
                                onClick={() => setIsLogging(true)}
                                className="text-primary text-[10px] font-black uppercase tracking-[0.1em] px-4 py-2 border border-primary/20 rounded-xl hover:bg-primary/10 transition-all"
                            >
                                New Entry
                            </button>
                        </div>

                        {(!currentCampaign.logs || currentCampaign.logs.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-2xl">
                                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">History has yet to be written.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {currentCampaign.logs.map(log => (
                                    <div key={log.id} className="relative pl-8 border-l border-white/10 pb-6 last:pb-0 group">
                                        <div className="absolute left-0 top-0 size-3 rounded-full bg-slate-800 border-2 border-primary -translate-x-1.5 shadow-[0_0_10px_rgba(var(--color-primary),0.5)]" />
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-xs font-black text-slate-200 uppercase tracking-tight">{log.title}</h4>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{log.date}</span>
                                                <button onClick={() => setDeleteLogTargetId(log.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed italic">{log.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="space-y-8">
                    {/* Party Status (live from combat) */}
                    <PartyStatusWidget />

                    {/* Recent Encounters */}
                    <RecentEncountersWidget />

                    {/* Location Tracker */}
                    {currentCampaign && <LocationTrackerWidget campaignId={currentCampaign.id} />}

                    {/* DM Tools */}
                    <section className="obsidian-panel rounded-3xl p-8 border border-white/5">
                        <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] mb-8">Master Utilities</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <Link href={`/combat?campaignId=${currentCampaign.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group text-left">
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-lg">swords</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-200 uppercase">Battle Command</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Initiate combat encounter</p>
                                </div>
                            </Link>
                            <button
                                onClick={() => setIsLogging(true)}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group text-left w-full"
                            >
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-lg">history_edu</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-200 uppercase">Chronicle Entry</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Record history of this session</p>
                                </div>
                            </button>
                            <Link href="/characters" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group text-left">
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-lg">groups</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-200 uppercase">Hero Gallery</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Manage master adventurer roster</p>
                                </div>
                            </Link>
                            <Link href="/homebrew" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all group text-left">
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-amber-400 transition-colors">
                                    <span className="material-symbols-outlined text-lg">science</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-200 uppercase">Homebrew Workshop</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Custom monsters, spells & items</p>
                                </div>
                            </Link>
                            <Link href="/spells" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group text-left">
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-lg">auto_stories</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-200 uppercase">Spellbook</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Browse & prepare spells</p>
                                </div>
                            </Link>
                            <Link href="/world-map" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all group text-left">
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                                    <span className="material-symbols-outlined text-lg">open_in_full</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-200 uppercase">Full Map View</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Open standalone world map</p>
                                </div>
                            </Link>
                        </div>
                    </section>

                    {/* NPC Snippet */}
                    <section className="obsidian-panel rounded-3xl p-8 border border-white/5">
                        <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">skull</span>
                            Local Threats
                        </h3>
                        <p className="text-slate-500 text-[9px] leading-relaxed mb-6">Common entities in {currentCampaign.setting}.</p>
                        <div className="space-y-3">
                            {['Goblin', 'Skeleton', 'Bandit'].map(npc => (
                                <div key={npc} className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center group hover:border-primary/30 transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase group-hover:text-slate-200 transition-colors">{npc}</p>
                                    <span className="text-[8px] font-bold text-slate-600 uppercase">CR 1/4</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Network Access Panel */}
                    <section className="obsidian-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
                        <h3 className="text-slate-100 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">cell_tower</span>
                            iPad Connect
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Local Network URL</p>
                                <code className="block p-2 bg-black/40 rounded-lg text-primary text-[11px] font-mono break-all selection:bg-primary/30">
                                    http://192.168.4.39:3000
                                </code>
                            </div>
                            <p className="text-slate-500 text-[9px] leading-relaxed italic">
                                Server is restricted to your local network for privacy. Open this URL on your iPad to access your campaign.
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            {/* Campaign Maps - Full Width */}
            <CampaignMapsWidget campaignId={currentCampaign.id} />

            {/* Recuitment Modal */}
            <AnimatePresence>
                {isRecruiting && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="obsidian-panel w-full max-w-xl rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Recruit Adventurers</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Summoning heroes to the cause</p>
                                </div>
                                <button onClick={() => setIsRecruiting(false)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {availableHeroes.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-slate-500 text-sm font-medium">No available heroes found in the Realm.</p>
                                        <Link href="/characters" className="text-primary text-[10px] font-black uppercase tracking-widest mt-4 inline-block underline underline-offset-4">Forge New Hero</Link>
                                    </div>
                                ) : (
                                    availableHeroes.map(hero => (
                                        <div key={hero.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-4 items-center group transition-all hover:bg-white/10 hover:border-primary/20">
                                            <div className="size-14 rounded-xl bg-slate-900 border border-white/10 relative overflow-hidden">
                                                <Image 
                                                    src={hero.imageUrl || hero.image || hero.visualUrl || "/placeholder-avatar.jpg"} 
                                                    alt={hero.name} 
                                                    fill 
                                                    className="object-cover" 
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-xs font-black text-slate-100 uppercase">{hero.name}</p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{hero.class} · Level {hero.level}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleHeroRecruitment(hero.id)}
                                                className="bg-primary hover:bg-white text-black size-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all shadow-lg shadow-primary/10"
                                            >
                                                <span className="material-symbols-outlined text-lg">add</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Log / Chronicle Modal */}
            <AnimatePresence>
                {isLogging && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="obsidian-panel w-full max-w-lg rounded-3xl p-10 border border-white/10 shadow-2xl">
                            <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tight mb-8">Record Chronicle</h3>
                            <form onSubmit={handleAddLog} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Entry Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newLog.title}
                                        onChange={(e) => setNewLog({ ...newLog, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all"
                                        placeholder="e.g. The Spire of Long Shadows"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Narrative Summary</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={newLog.content}
                                        onChange={(e) => setNewLog({ ...newLog, content: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all placeholder:text-slate-700 resize-none"
                                        placeholder="Briefly describe the session's key events..."
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsLogging(false)}
                                        className="flex-1 px-6 py-4 rounded-xl border border-white/10 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-white hover:border-white/20 transition-all"
                                    >
                                        Seal Journal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-2 px-12 py-4 rounded-xl bg-primary text-black font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Imprint History
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Edit Campaign Modal */}
            <AnimatePresence>
                {isEditingCampaign && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="obsidian-panel w-full max-w-xl rounded-3xl p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Refine Campaign</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Adjusting the weave of fate</p>
                                </div>
                                <button onClick={() => setIsEditingCampaign(false)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleUpdateCampaign} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Campaign Name</label>
                                    <input type="text" required value={editCampaignData.name} onChange={(e) => setEditCampaignData({ ...editCampaignData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">World Setting</label>
                                    <input type="text" value={editCampaignData.setting} onChange={(e) => setEditCampaignData({ ...editCampaignData, setting: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Dungeon Master</label>
                                        <input type="text" value={editCampaignData.dm} onChange={(e) => setEditCampaignData({ ...editCampaignData, dm: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Party Level</label>
                                        <input type="number" min="1" max="20" value={editCampaignData.level} onChange={(e) => setEditCampaignData({ ...editCampaignData, level: parseInt(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-100 focus:border-primary/50 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <button type="submit" className="w-full bg-primary text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all primary-glow">Update Chronicle</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <ConfirmModal
                isOpen={!!deleteLogTargetId}
                onClose={() => setDeleteLogTargetId(null)}
                onConfirm={deleteLog}
                title="Delete Log Entry"
                message="Are you sure you want to delete this chapter from history? This cannot be undone."
                confirmLabel="Delete Entry"
                icon="history"
            />
            {/* Auto-Backup Panel */}
            <div className="mt-8 obsidian-panel rounded-3xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">backup</span>
                        Data Vault
                    </h3>
                    {backupStatus.lastBackupTime && (
                        <p className="text-[8px] text-slate-600 font-bold uppercase">
                            Last backup: {new Date(backupStatus.lastBackupTime).toLocaleTimeString()}
                        </p>
                    )}
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={() => { exportBackup(); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-xs">download</span>
                        Export Backup
                    </button>
                    <button
                        onClick={() => backupFileRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-xs">upload</span>
                        Import Backup
                    </button>
                    <input
                        ref={backupFileRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                try {
                                    const result = await importBackup(file);
                                    alert(`Restored ${result.keysRestored} data keys. Reloading...`);
                                    window.location.reload();
                                } catch (err) {
                                    alert('Failed to import backup: ' + (err as Error).message);
                                }
                            }
                        }}
                    />
                    <button
                        onClick={() => {
                            const result = restoreAutoBackup();
                            if (result) {
                                alert(`Restored ${result.keysRestored} keys from auto-backup. Reloading...`);
                                window.location.reload();
                            } else {
                                alert('No auto-backup found.');
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-xs">restore</span>
                        Restore Auto-Backup
                    </button>
                </div>
            </div>
        </div>
    );
}
