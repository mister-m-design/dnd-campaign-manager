'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  HomebrewStore,
  HomebrewMonster,
  HomebrewSpell,
  HomebrewItem,
  HomebrewCondition,
  HomebrewAbility,
} from '@/types/homebrew';
import { EMPTY_HOMEBREW_STORE } from '@/types/homebrew';

const STORAGE_KEY = 'mythictable_homebrew_v1';

function loadStore(): HomebrewStore {
  if (typeof window === 'undefined') return { ...EMPTY_HOMEBREW_STORE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_HOMEBREW_STORE };
    const parsed = JSON.parse(raw) as HomebrewStore;

    // Migrate & Validate: ensure all models and their required nested structures exist
    const monsters = (parsed.monsters ?? []).map(m => ({
      ...m,
      abilityScores: m.abilityScores ?? { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      actions: m.actions ?? [],
      traits: m.traits ?? [],
    })) as HomebrewMonster[];

    return {
      ...EMPTY_HOMEBREW_STORE,
      ...parsed,
      monsters,
      spells: parsed.spells ?? [],
      items: parsed.items ?? [],
      conditions: parsed.conditions ?? [],
      abilities: parsed.abilities ?? [],
    };
  } catch {
    return { ...EMPTY_HOMEBREW_STORE };
  }
}

function saveStore(store: HomebrewStore) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...store,
      lastUpdated: new Date().toISOString(),
    }));
  } catch {
    console.warn('Failed to save homebrew store to localStorage');
  }
}

export function useHomebrew() {
  const [store, setStore] = useState<HomebrewStore>(() => loadStore());

  // Persist on every change
  useEffect(() => {
    saveStore(store);
  }, [store]);

  // ─── MONSTERS ──────────────────────────────────────────────────────────────

  const upsertMonster = useCallback((monster: HomebrewMonster) => {
    setStore(prev => {
      const exists = prev.monsters.find(m => m.id === monster.id);
      const updated = { ...monster, updatedAt: new Date().toISOString() };
      return {
        ...prev,
        monsters: exists
          ? prev.monsters.map(m => m.id === monster.id ? updated : m)
          : [...prev.monsters, updated],
      };
    });
  }, []);

  const deleteMonster = useCallback((id: string) => {
    setStore(prev => ({ ...prev, monsters: prev.monsters.filter(m => m.id !== id) }));
  }, []);

  // ─── SPELLS ────────────────────────────────────────────────────────────────

  const upsertSpell = useCallback((spell: HomebrewSpell) => {
    setStore(prev => {
      const exists = prev.spells.find(s => s.id === spell.id);
      const updated = { ...spell, updatedAt: new Date().toISOString() };
      return {
        ...prev,
        spells: exists
          ? prev.spells.map(s => s.id === spell.id ? updated : s)
          : [...prev.spells, updated],
      };
    });
  }, []);

  const deleteSpell = useCallback((id: string) => {
    setStore(prev => ({ ...prev, spells: prev.spells.filter(s => s.id !== id) }));
  }, []);

  // ─── ITEMS ─────────────────────────────────────────────────────────────────

  const upsertItem = useCallback((item: HomebrewItem) => {
    setStore(prev => {
      const exists = prev.items.find(i => i.id === item.id);
      const updated = { ...item, updatedAt: new Date().toISOString() };
      return {
        ...prev,
        items: exists
          ? prev.items.map(i => i.id === item.id ? updated : i)
          : [...prev.items, updated],
      };
    });
  }, []);

  const deleteItem = useCallback((id: string) => {
    setStore(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  }, []);

  // ─── CONDITIONS ────────────────────────────────────────────────────────────

  const upsertCondition = useCallback((condition: HomebrewCondition) => {
    setStore(prev => {
      const exists = prev.conditions.find(c => c.id === condition.id);
      const updated = { ...condition, updatedAt: new Date().toISOString() };
      return {
        ...prev,
        conditions: exists
          ? prev.conditions.map(c => c.id === condition.id ? updated : c)
          : [...prev.conditions, updated],
      };
    });
  }, []);

  const deleteCondition = useCallback((id: string) => {
    setStore(prev => ({ ...prev, conditions: prev.conditions.filter(c => c.id !== id) }));
  }, []);

  // ─── ABILITIES ─────────────────────────────────────────────────────────────

  const upsertAbility = useCallback((ability: HomebrewAbility) => {
    setStore(prev => {
      const exists = prev.abilities.find(a => a.id === ability.id);
      const updated = { ...ability, updatedAt: new Date().toISOString() };
      return {
        ...prev,
        abilities: exists
          ? prev.abilities.map(a => a.id === ability.id ? updated : a)
          : [...prev.abilities, updated],
      };
    });
  }, []);

  const deleteAbility = useCallback((id: string) => {
    setStore(prev => ({ ...prev, abilities: prev.abilities.filter(a => a.id !== id) }));
  }, []);

  // ─── IMPORT / EXPORT ───────────────────────────────────────────────────────

  const exportStore = useCallback((): string => {
    return JSON.stringify(store, null, 2);
  }, [store]);

  const importStore = useCallback((json: string, merge = true): { ok: boolean; error?: string } => {
    try {
      const incoming = JSON.parse(json) as HomebrewStore;
      if (!incoming || typeof incoming !== 'object') throw new Error('Invalid format');

      if (merge) {
        setStore(prev => {
          const mergedMonsters = [...prev.monsters];
          for (const m of (incoming.monsters ?? [])) {
            if (!mergedMonsters.find(x => x.id === m.id)) mergedMonsters.push(m);
            else {
              const idx = mergedMonsters.findIndex(x => x.id === m.id);
              mergedMonsters[idx] = m;
            }
          }
          const mergedSpells = [...prev.spells];
          for (const s of (incoming.spells ?? [])) {
            if (!mergedSpells.find(x => x.id === s.id)) mergedSpells.push(s);
            else {
              const idx = mergedSpells.findIndex(x => x.id === s.id);
              mergedSpells[idx] = s;
            }
          }
          const mergedItems = [...prev.items];
          for (const i of (incoming.items ?? [])) {
            if (!mergedItems.find(x => x.id === i.id)) mergedItems.push(i);
            else {
              const idx = mergedItems.findIndex(x => x.id === i.id);
              mergedItems[idx] = i;
            }
          }
          return {
            ...prev,
            monsters: mergedMonsters,
            spells: mergedSpells,
            items: mergedItems,
            conditions: [...prev.conditions, ...(incoming.conditions ?? []).filter(c => !prev.conditions.find(x => x.id === c.id))],
            abilities: [...prev.abilities, ...(incoming.abilities ?? []).filter(a => !prev.abilities.find(x => x.id === a.id))],
          };
        });
      } else {
        setStore({ ...EMPTY_HOMEBREW_STORE, ...incoming });
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message ?? 'Parse error' };
    }
  }, []);

  const clearAll = useCallback(() => {
    setStore({ ...EMPTY_HOMEBREW_STORE, lastUpdated: new Date().toISOString() });
  }, []);

  return {
    store,
    // monsters
    monsters: store.monsters,
    upsertMonster,
    deleteMonster,
    // spells
    spells: store.spells,
    upsertSpell,
    deleteSpell,
    // items
    items: store.items,
    upsertItem,
    deleteItem,
    // conditions
    conditions: store.conditions,
    upsertCondition,
    deleteCondition,
    // abilities
    abilities: store.abilities,
    upsertAbility,
    deleteAbility,
    // io
    exportStore,
    importStore,
    clearAll,
  };
}
