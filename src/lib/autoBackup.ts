/**
 * Auto-Backup Utility for D&D Campaign Manager
 * Snapshots all mythic_* localStorage keys, supports export/import.
 */

const BACKUP_PREFIX = 'mythic_';
const AUTO_BACKUP_KEY = 'mythic_auto_backup';
const AUTO_BACKUP_TS_KEY = 'mythic_auto_backup_timestamp';

export interface BackupData {
  version: number;
  timestamp: string;
  keys: Record<string, any>;
}

/** Gather all mythic_* keys from localStorage into a backup object */
export function getBackupSnapshot(): BackupData {
  const keys: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(BACKUP_PREFIX) && key !== AUTO_BACKUP_KEY && key !== AUTO_BACKUP_TS_KEY) {
      try {
        keys[key] = JSON.parse(localStorage.getItem(key) || 'null');
      } catch {
        keys[key] = localStorage.getItem(key);
      }
    }
  }
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    keys
  };
}

/** Save a snapshot to localStorage (auto-backup slot) */
export function saveAutoBackup(): string {
  const snapshot = getBackupSnapshot();
  localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(snapshot));
  localStorage.setItem(AUTO_BACKUP_TS_KEY, snapshot.timestamp);
  return snapshot.timestamp;
}

/** Get the last auto-backup timestamp */
export function getLastAutoBackupTime(): string | null {
  return localStorage.getItem(AUTO_BACKUP_TS_KEY);
}

/** Export a backup as a downloadable JSON file */
export function exportBackup(): void {
  const snapshot = getBackupSnapshot();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `mythic-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Import a backup from a JSON file */
export function importBackup(file: File): Promise<{ keysRestored: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data: BackupData = JSON.parse(e.target?.result as string);
        if (!data.version || !data.keys) {
          reject(new Error('Invalid backup file format'));
          return;
        }
        let count = 0;
        Object.entries(data.keys).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
          count++;
        });
        resolve({ keysRestored: count });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/** Restore from the auto-backup slot */
export function restoreAutoBackup(): { keysRestored: number } | null {
  const raw = localStorage.getItem(AUTO_BACKUP_KEY);
  if (!raw) return null;
  try {
    const data: BackupData = JSON.parse(raw);
    let count = 0;
    Object.entries(data.keys).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
      count++;
    });
    return { keysRestored: count };
  } catch {
    return null;
  }
}
