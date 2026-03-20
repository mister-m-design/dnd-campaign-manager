"use client";

/**
 * MYTHIC TABLE — SHARED PERSISTENT STATE
 *
 * Drop-in replacement for the old localStorage-only hook.
 * Now syncs with the server so every device on the same network
 * (desktop, iPad, iPhone) sees the same state in real time.
 *
 * Architecture:
 * - All instances share a single module-level singleton that polls
 *   /api/shared-state once every 2 seconds.
 * - On mount the hook immediately fetches the authoritative server value.
 * - Local updates are applied instantly (optimistic) then posted to the server.
 * - Server echoes are ignored for 1 second after a local write to prevent loops.
 * - localStorage is used as a fast initial hydration cache only.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Module-level singleton ───────────────────────────────────────────────────

type Subscriber = (value: any) => void;

const cache: Record<string, any> = {};
const subscribers = new Map<string, Set<Subscriber>>();

/** Keys that were written locally in the last second — suppress server echoes */
const pendingLocal = new Map<string, ReturnType<typeof setTimeout>>();

let serverVersion = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;

function subscribe(key: string, cb: Subscriber) {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(cb);
}
function unsubscribe(key: string, cb: Subscriber) {
  subscribers.get(key)?.delete(cb);
}
function notify(key: string, value: any) {
  // Suppress echoes for keys written locally
  if (pendingLocal.has(key)) return;
  if (cache[key] !== undefined) {
    // Avoid spurious re-renders: skip if value hasn't changed
    if (JSON.stringify(cache[key]) === JSON.stringify(value)) return;
  }
  cache[key] = value;
  subscribers.get(key)?.forEach(cb => cb(value));
}

async function fetchAll() {
  try {
    const res = await fetch(`/api/shared-state?since=${serverVersion}`, { cache: 'no-store' });
    if (!res.ok) return;
    const json = await res.json();
    if (json.version > serverVersion) {
      serverVersion = json.version;
      if (json.updates) {
        Object.entries(json.updates).forEach(([k, v]) => notify(k, v));
      } else if (json.data) {
        // Full dump (first load)
        Object.entries(json.data).forEach(([k, v]) => notify(k, v));
      }
    }
  } catch { /* network unavailable — silent */ }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(fetchAll, 2000);
}

function initIfNeeded() {
  if (initialized) return;
  initialized = true;
  // Eager initial load
  fetchAll();
  startPolling();
}

async function postToServer(key: string, value: any) {
  try {
    const res = await fetch('/api/shared-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.version) serverVersion = json.version;
    }
  } catch {
    // Fallback: localStorage only
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePersistentState<T>(key: string, defaultValue: T) {
  // Always initialize with defaultValue so SSR and initial client render match.
  // Persisted data is loaded inside useEffect (client-only) to avoid hydration mismatch.
  const [state, _setState] = useState<T>(defaultValue);

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    // On mount: load persisted value from module cache or localStorage
    let initialValue: T = defaultValue;
    if (cache[key] !== undefined) {
      initialValue = cache[key] as T;
    } else {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as T;
          cache[key] = parsed;
          initialValue = parsed;
        }
      } catch { /* noop */ }
    }
    if (JSON.stringify(initialValue) !== JSON.stringify(defaultValue)) {
      _setState(initialValue);
      stateRef.current = initialValue;
    }

    initIfNeeded();

    // Register for incoming server updates
    const cb: Subscriber = (value: T) => {
      _setState(value);
    };
    subscribe(key, cb);

    // Fetch the authoritative value once on mount (in case cache is stale)
    fetch(`/api/shared-state?key=${encodeURIComponent(key)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(({ value }) => {
        if (value !== null && value !== undefined) {
          const str = JSON.stringify(value);
          if (str !== JSON.stringify(stateRef.current)) {
            cache[key] = value;
            _setState(value as T);
          }
        }
      })
      .catch(() => { /* server unavailable — keep local value */ });

    return () => unsubscribe(key, cb);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setState = useCallback((value: T | ((prev: T) => T)) => {
    _setState(prev => {
      const next = typeof value === 'function'
        ? (value as (p: T) => T)(prev)
        : value;

      // Optimistic local update
      cache[key] = next;

      // Suppress echo for this key for 1 second
      if (pendingLocal.has(key)) clearTimeout(pendingLocal.get(key)!);
      pendingLocal.set(key, setTimeout(() => pendingLocal.delete(key), 1000));

      // Async server sync
      postToServer(key, next);

      return next;
    });
  }, [key]);

  return [state, setState] as const;
}
