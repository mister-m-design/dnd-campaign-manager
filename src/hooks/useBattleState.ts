'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CombatantState, LogEntry } from '@/types';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface BattleSnapshot {
  id: string;
  name: string;
  description?: string;
  isPrepMode: boolean;      // true = pre-staged, hasn't started yet
  createdAt: string;
  updatedAt: string;
  // Combat state
  combatants: CombatantState[];
  activeCombatantId: string | null;
  round: number;
  log: LogEntry[];
  // DM metadata
  mapName?: string;
  encounterNotes?: string;
  location?: string;
  tags?: string[];
}

interface BattleStateStore {
  snapshots: BattleSnapshot[];
  version: number;
}

const STORAGE_KEY = 'mythictable_battlestates_v1';

function loadStore(): BattleStateStore {
  if (typeof window === 'undefined') return { snapshots: [], version: 1 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { snapshots: [], version: 1 };
    return JSON.parse(raw) as BattleStateStore;
  } catch {
    return { snapshots: [], version: 1 };
  }
}

function saveStore(store: BattleStateStore) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    console.warn('Failed to save battle states');
  }
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useBattleState() {
  const [store, setStore] = useState<BattleStateStore>(() => loadStore());

  useEffect(() => {
    saveStore(store);
  }, [store]);

  const saveSnapshot = useCallback((
    snapshot: Omit<BattleSnapshot, 'id' | 'createdAt' | 'updatedAt'>
  ): BattleSnapshot => {
    const now = new Date().toISOString();
    const saved: BattleSnapshot = {
      ...snapshot,
      id: `battle-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setStore(prev => ({
      ...prev,
      snapshots: [saved, ...prev.snapshots].slice(0, 30), // keep max 30
    }));
    return saved;
  }, []);

  const updateSnapshot = useCallback((id: string, updates: Partial<BattleSnapshot>) => {
    setStore(prev => ({
      ...prev,
      snapshots: prev.snapshots.map(s =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    }));
  }, []);

  const deleteSnapshot = useCallback((id: string) => {
    setStore(prev => ({ ...prev, snapshots: prev.snapshots.filter(s => s.id !== id) }));
  }, []);

  const duplicateSnapshot = useCallback((id: string) => {
    const source = store.snapshots.find(s => s.id === id);
    if (!source) return;
    const now = new Date().toISOString();
    const copy: BattleSnapshot = {
      ...source,
      id: `battle-${Date.now()}`,
      name: `${source.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    setStore(prev => ({
      ...prev,
      snapshots: [copy, ...prev.snapshots].slice(0, 30),
    }));
  }, [store.snapshots]);

  return {
    snapshots: store.snapshots,
    saveSnapshot,
    updateSnapshot,
    deleteSnapshot,
    duplicateSnapshot,
  };
}
