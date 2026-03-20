"use client";

import { useState, useEffect } from 'react';

export function useSyncedState<T>(endpoint: string, key: string, defaultValue: T) {
    const [state, setState] = useState<T>(defaultValue);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Initial Fetch from Server (or LocalStorage if server fails)
    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    const data = await response.json();
                    setState(data);
                } else {
                    throw new Error('Server unreachable');
                }
            } catch (error) {
                console.warn(`Falling back to localStorage for ${key}`);
                const item = window.localStorage.getItem(key);
                if (item) {
                    setState(JSON.parse(item));
                }
            } finally {
                setIsHydrated(true);
            }
        };

        loadData();

        // Background Polling for Seamless Sync
        const intervalId = setInterval(async () => {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    const data = await response.json();
                    
                    setState(prev => {
                        const prevIsArray = Array.isArray(prev);
                        const nextIsArray = Array.isArray(data);
                        
                        // SAFETY GATE: If we have local data and the server returns empty,
                        // do NOT overwrite. This protects against empty database states
                        // after a restart or migration.
                        if (prevIsArray && nextIsArray && prev.length > 0 && data.length === 0) {
                            console.warn("Sync safety: Blocked empty server update to preserve local data.");
                            return prev;
                        }

                        // Basic merge check: only update if data is different
                        if (JSON.stringify(prev) !== JSON.stringify(data)) {
                            return data;
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.warn("Background sync failed:", error);
            }
        }, 15000); // Poll every 15 seconds

        return () => clearInterval(intervalId);
    }, [endpoint, key]);

    // Save to Server + LocalStorage on change
    useEffect(() => {
        if (!isHydrated) return;

        // Update LocalStorage first for speed
        window.localStorage.setItem(key, JSON.stringify(state));
    }, [key, state, isHydrated]);

    return [state, setState, { isSyncing }] as const;
}
