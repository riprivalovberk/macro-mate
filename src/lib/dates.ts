/** Date helpers. Day keys are YYYY-MM-DD in *local* time so a meal logged at
 * 11pm lands on the right day for the user. */

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, delta: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + delta);
  return dateKey(d);
}

export function isToday(key: string): boolean {
  return key === todayKey();
}

export function friendlyDate(key: string): string {
  if (key === todayKey()) return 'Today';
  if (key === addDays(todayKey(), -1)) return 'Yesterday';
  if (key === addDays(todayKey(), 1)) return 'Tomorrow';
  return parseKey(key).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** The last `n` day keys ending at (and including) `end`. Oldest first. */
export function lastNDays(n: number, end: string): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}

export interface MonthGrid {
  year: number;
  month: number; // 0-based
  label: string;
  /** 6x7 grid of day keys; null for cells outside the month. Weeks start Monday. */
  weeks: (string | null)[][];
}

export function monthGrid(year: number, month: number): MonthGrid {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday = 0 ... Sunday = 6
  const startOffset = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(dateKey(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return {
    year,
    month,
    label: first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    weeks,
  };
}
