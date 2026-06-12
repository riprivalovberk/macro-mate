import Dexie, { type Table } from 'dexie';
import { EMPTY_MACROS, MACRO_KEYS, type Entry, type MacroSet, type Settings } from '../types';
import { loadSettings, saveSettings } from './settings';

class MacroMateDB extends Dexie {
  entries!: Table<Entry, number>;

  constructor() {
    super('macro-mate');
    this.version(1).stores({
      entries: '++id, date, name, createdAt',
    });
  }
}

export const db = new MacroMateDB();

export async function addEntry(entry: Omit<Entry, 'id'>): Promise<number> {
  return db.entries.add(entry as Entry);
}

export async function updateEntry(id: number, changes: Partial<Entry>): Promise<void> {
  await db.entries.update(id, changes);
}

export async function deleteEntry(id: number): Promise<void> {
  await db.entries.delete(id);
}

export function entriesForDate(date: string): Promise<Entry[]> {
  return db.entries.where('date').equals(date).sortBy('createdAt');
}

export function totals(entries: Pick<Entry, keyof MacroSet>[]): MacroSet {
  const sum = { ...EMPTY_MACROS };
  for (const e of entries) {
    for (const k of MACRO_KEYS) sum[k] += Number(e[k]) || 0;
  }
  for (const k of MACRO_KEYS) sum[k] = Math.round(sum[k] * 10) / 10;
  return sum;
}

/** kcal totals per day key for a set of days, for the calendar + trends. */
export async function totalsByDate(dates: string[]): Promise<Map<string, MacroSet>> {
  const entries = await db.entries.where('date').anyOf(dates).toArray();
  const byDate = new Map<string, Entry[]>();
  for (const e of entries) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }
  const out = new Map<string, MacroSet>();
  for (const [date, list] of byDate) out.set(date, totals(list));
  return out;
}

export interface QuickFood extends MacroSet {
  name: string;
  emoji: string;
  portion: string;
  count: number;
  lastUsed: number;
}

/**
 * Foods to offer for one-tap re-logging: deduped by name, ranked by how often
 * they were logged, ties broken by recency. The most recent entry for a name
 * supplies its macros.
 */
export async function quickFoods(limit = 20): Promise<QuickFood[]> {
  const entries = await db.entries.orderBy('createdAt').reverse().limit(500).toArray();
  const byName = new Map<string, QuickFood>();
  for (const e of entries) {
    const key = e.name.trim().toLowerCase();
    if (!key) continue;
    const existing = byName.get(key);
    if (existing) {
      existing.count += 1;
      existing.lastUsed = Math.max(existing.lastUsed, e.createdAt);
    } else {
      const food: QuickFood = {
        name: e.name,
        emoji: e.emoji,
        portion: e.portion,
        count: 1,
        lastUsed: e.createdAt,
        ...EMPTY_MACROS,
      };
      for (const k of MACRO_KEYS) food[k] = e[k];
      byName.set(key, food);
    }
  }
  return [...byName.values()]
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .slice(0, limit);
}

// --- Backup ---

export interface Backup {
  app: 'macro-mate';
  version: 1;
  exportedAt: string;
  settings: Settings;
  entries: Entry[];
}

export async function exportBackup(): Promise<string> {
  const backup: Backup = {
    app: 'macro-mate',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    entries: await db.entries.toArray(),
  };
  return JSON.stringify(backup, null, 2);
}

/** Restores a backup. Replaces all current entries and settings. */
export async function importBackup(json: string): Promise<{ entries: number }> {
  let backup: Backup;
  try {
    backup = JSON.parse(json);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (backup?.app !== 'macro-mate' || !Array.isArray(backup.entries)) {
    throw new Error('That file is not a Macro Mate backup.');
  }
  await db.transaction('rw', db.entries, async () => {
    await db.entries.clear();
    await db.entries.bulkAdd(backup.entries.map(({ id: _id, ...rest }) => rest as Entry));
  });
  if (backup.settings) saveSettings(backup.settings);
  return { entries: backup.entries.length };
}
