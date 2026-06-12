import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addEntry,
  db,
  deleteEntry,
  entriesForDate,
  exportBackup,
  importBackup,
  quickFoods,
  totals,
  totalsByDate,
  updateEntry,
} from './db';
import { resetSettingsCacheForTests } from './settings';
import type { Entry } from '../types';

function makeEntry(overrides: Partial<Entry> = {}): Omit<Entry, 'id'> {
  return {
    date: '2026-06-12',
    meal: 'lunch',
    name: 'Chicken bowl',
    emoji: '🍗',
    portion: '1 bowl',
    kcal: 550,
    protein: 45,
    carbs: 50,
    fat: 18,
    fiber: 6,
    sugar: 4,
    sodium: 800,
    createdAt: Date.now(),
    ...overrides,
  };
}

beforeEach(async () => {
  await db.entries.clear();
  localStorage.clear();
  resetSettingsCacheForTests();
});

afterEach(async () => {
  await db.entries.clear();
});

describe('entry CRUD', () => {
  it('adds and reads entries by date', async () => {
    await addEntry(makeEntry());
    await addEntry(makeEntry({ date: '2026-06-11', name: 'Oatmeal' }));
    const today = await entriesForDate('2026-06-12');
    expect(today).toHaveLength(1);
    expect(today[0].name).toBe('Chicken bowl');
  });

  it('updates an entry', async () => {
    const id = await addEntry(makeEntry());
    await updateEntry(id, { kcal: 600, meal: 'dinner' });
    const [entry] = await entriesForDate('2026-06-12');
    expect(entry.kcal).toBe(600);
    expect(entry.meal).toBe('dinner');
  });

  it('deletes an entry', async () => {
    const id = await addEntry(makeEntry());
    await deleteEntry(id);
    expect(await entriesForDate('2026-06-12')).toHaveLength(0);
  });

  it('sorts a day by creation time', async () => {
    await addEntry(makeEntry({ name: 'Second', createdAt: 2000 }));
    await addEntry(makeEntry({ name: 'First', createdAt: 1000 }));
    const entries = await entriesForDate('2026-06-12');
    expect(entries.map((e) => e.name)).toEqual(['First', 'Second']);
  });
});

describe('totals', () => {
  it('sums every nutrient', () => {
    const t = totals([
      makeEntry({ kcal: 500, protein: 40, carbs: 30, fat: 20, fiber: 5, sugar: 3, sodium: 700 }),
      makeEntry({ kcal: 300, protein: 10, carbs: 45, fat: 8, fiber: 2, sugar: 12, sodium: 200 }),
    ]);
    expect(t.kcal).toBe(800);
    expect(t.protein).toBe(50);
    expect(t.carbs).toBe(75);
    expect(t.fat).toBe(28);
    expect(t.fiber).toBe(7);
    expect(t.sugar).toBe(15);
    expect(t.sodium).toBe(900);
  });

  it('returns zeros for an empty day', () => {
    const t = totals([]);
    expect(t.kcal).toBe(0);
    expect(t.protein).toBe(0);
  });

  it('treats malformed numeric fields as 0', () => {
    const bad = makeEntry();
    (bad as Record<string, unknown>).protein = 'oops';
    const t = totals([bad]);
    expect(t.protein).toBe(0);
    expect(t.kcal).toBe(550);
  });
});

describe('totalsByDate', () => {
  it('groups totals per day, omitting empty days', async () => {
    await addEntry(makeEntry({ date: '2026-06-10', kcal: 400 }));
    await addEntry(makeEntry({ date: '2026-06-10', kcal: 600 }));
    await addEntry(makeEntry({ date: '2026-06-12', kcal: 1000 }));
    const map = await totalsByDate(['2026-06-10', '2026-06-11', '2026-06-12']);
    expect(map.get('2026-06-10')?.kcal).toBe(1000);
    expect(map.has('2026-06-11')).toBe(false);
    expect(map.get('2026-06-12')?.kcal).toBe(1000);
  });
});

describe('quickFoods', () => {
  it('ranks by frequency then recency and dedupes by name', async () => {
    await addEntry(makeEntry({ name: 'Protein shake', createdAt: 1 }));
    await addEntry(makeEntry({ name: 'Protein shake', createdAt: 2 }));
    await addEntry(makeEntry({ name: 'protein shake', createdAt: 3 })); // case-insensitive dupe
    await addEntry(makeEntry({ name: 'Banana', createdAt: 4 }));
    const foods = await quickFoods();
    expect(foods[0].name.toLowerCase()).toBe('protein shake');
    expect(foods[0].count).toBe(3);
    expect(foods[1].name).toBe('Banana');
    expect(foods).toHaveLength(2);
  });

  it('uses the most recent entry for macros', async () => {
    await addEntry(makeEntry({ name: 'Shake', kcal: 100, createdAt: 1 }));
    await addEntry(makeEntry({ name: 'Shake', kcal: 250, createdAt: 2 }));
    const foods = await quickFoods();
    expect(foods[0].kcal).toBe(250);
  });

  it('respects the limit', async () => {
    for (let i = 0; i < 25; i++) await addEntry(makeEntry({ name: `Food ${i}`, createdAt: i }));
    const foods = await quickFoods(5);
    expect(foods).toHaveLength(5);
  });
});

describe('backup export/import', () => {
  it('round-trips entries and settings', async () => {
    await addEntry(makeEntry());
    await addEntry(makeEntry({ name: 'Eggs', date: '2026-06-11' }));
    const json = await exportBackup();

    await db.entries.clear();
    expect(await entriesForDate('2026-06-12')).toHaveLength(0);

    const result = await importBackup(json);
    expect(result.entries).toBe(2);
    expect(await entriesForDate('2026-06-12')).toHaveLength(1);
    expect(await entriesForDate('2026-06-11')).toHaveLength(1);
  });

  it('replaces existing data on import', async () => {
    await addEntry(makeEntry({ name: 'Old food' }));
    const json = await exportBackup();
    await addEntry(makeEntry({ name: 'Newer food' }));

    await importBackup(json);
    const entries = await entriesForDate('2026-06-12');
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('Old food');
  });

  it('rejects invalid JSON', async () => {
    await expect(importBackup('not json')).rejects.toThrow(/not valid JSON/i);
  });

  it('rejects JSON that is not a Macro Mate backup', async () => {
    await expect(importBackup(JSON.stringify({ hello: 'world' }))).rejects.toThrow(/not a Macro Mate backup/i);
  });
});
