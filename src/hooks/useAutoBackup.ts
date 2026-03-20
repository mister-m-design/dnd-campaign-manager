"use client";

import { useState, useEffect, useCallback } from 'react';
import { saveAutoBackup, getLastAutoBackupTime } from '@/lib/autoBackup';

const BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useAutoBackup() {
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // Load last backup time on mount
  useEffect(() => {
    setLastBackupTime(getLastAutoBackupTime());
  }, []);

  // Periodic auto-backup
  useEffect(() => {
    // Do an initial backup after 30 seconds of app usage
    const initialTimeout = setTimeout(() => {
      const ts = saveAutoBackup();
      setLastBackupTime(ts);
    }, 30_000);

    const intervalId = setInterval(() => {
      const ts = saveAutoBackup();
      setLastBackupTime(ts);
    }, BACKUP_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, []);

  const triggerBackup = useCallback(() => {
    const ts = saveAutoBackup();
    setLastBackupTime(ts);
    return ts;
  }, []);

  return { lastBackupTime, triggerBackup };
}
