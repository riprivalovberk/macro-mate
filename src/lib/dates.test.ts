import { describe, expect, it } from 'vitest';
import { addDays, dateKey, lastNDays, monthGrid, parseKey, todayKey } from './dates';

describe('dateKey / parseKey', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 5, 12))).toBe('2026-06-12');
    expect(dateKey(new Date(2026, 0, 3))).toBe('2026-01-03');
  });

  it('round-trips through parseKey', () => {
    const key = '2026-02-28';
    expect(dateKey(parseKey(key))).toBe(key);
  });
});

describe('addDays', () => {
  it('crosses month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('handles leap years', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });
});

describe('lastNDays', () => {
  it('returns n keys ending at the given day, oldest first', () => {
    const days = lastNDays(3, '2026-06-12');
    expect(days).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']);
  });
});

describe('todayKey', () => {
  it('matches dateKey(now)', () => {
    expect(todayKey()).toBe(dateKey(new Date()));
  });
});

describe('monthGrid', () => {
  it('contains every day of the month exactly once', () => {
    const grid = monthGrid(2026, 5); // June 2026
    const days = grid.weeks.flat().filter(Boolean);
    expect(days.length).toBe(30);
    expect(days[0]).toBe('2026-06-01');
    expect(days[29]).toBe('2026-06-30');
  });

  it('starts weeks on Monday', () => {
    // June 1, 2026 is a Monday → no leading nulls
    const june = monthGrid(2026, 5);
    expect(june.weeks[0][0]).toBe('2026-06-01');
    // Feb 1, 2026 is a Sunday → 6 leading nulls
    const feb = monthGrid(2026, 1);
    expect(feb.weeks[0].slice(0, 6).every((c) => c === null)).toBe(true);
    expect(feb.weeks[0][6]).toBe('2026-02-01');
  });

  it('rows are always full weeks of 7', () => {
    const grid = monthGrid(2026, 7);
    for (const week of grid.weeks) expect(week.length).toBe(7);
  });
});
