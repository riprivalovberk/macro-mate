import type { Goals, MacroSet } from '../types';

export interface ScoreReason {
  label: string;
  ok: boolean;
}

export interface NutritionScore {
  score: number; // 0–100
  reasons: ScoreReason[];
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Optional components, included only when the user tracks them. */
export interface ScoreExtras {
  /** Water: cups drunk vs daily goal. */
  water?: { cups: number; goal: number };
  /** Alcohol: standard drinks vs daily limit. */
  alcohol?: { drinks: number; limit: number };
}

/**
 * Daily nutrition score out of 100, weighted:
 * calories 30 (closeness to goal), protein 25 (hit target), fiber 15,
 * carbs 10 + fat 10 (closeness), sugar 5 + sodium 5 (stay under limit).
 * Components with a 0 goal are skipped (full credit, no reason shown).
 * When water/alcohol are tracked each adds a 10-point component and the
 * total is normalized back to 0–100.
 */
export function nutritionScore(t: MacroSet, g: Goals, extras: ScoreExtras = {}): NutritionScore {
  const reasons: ScoreReason[] = [];
  let score = 0;
  let possible = 100;

  // Calories — closeness to goal, full credit within ±10%
  if (g.kcal > 0) {
    const dev = Math.abs(t.kcal - g.kcal) / g.kcal;
    score += 30 * clamp01(1 - Math.max(0, dev - 0.1) / 0.5);
    if (dev <= 0.1) reasons.push({ label: 'Calories on target', ok: true });
    else reasons.push({ label: t.kcal < g.kcal ? 'Calories under target' : 'Calories over target', ok: false });
  } else score += 30;

  // Protein — at least target
  if (g.protein > 0) {
    const r = clamp01(t.protein / g.protein);
    score += 25 * r;
    reasons.push(r >= 0.95 ? { label: 'Protein target met', ok: true } : { label: 'Protein low', ok: false });
  } else score += 25;

  // Fiber — at least target
  if (g.fiber > 0) {
    const r = clamp01(t.fiber / g.fiber);
    score += 15 * r;
    reasons.push(r >= 0.9 ? { label: 'Fiber target met', ok: true } : { label: 'Fiber low', ok: false });
  } else score += 15;

  // Carbs & fat — closeness, full credit within ±20%
  for (const [key, label] of [
    ['carbs', 'Carbs'],
    ['fat', 'Fat'],
  ] as const) {
    if (g[key] > 0) {
      const dev = Math.abs(t[key] - g[key]) / g[key];
      score += 10 * clamp01(1 - Math.max(0, dev - 0.2) / 0.6);
      if (dev <= 0.2) reasons.push({ label: `${label} on target`, ok: true });
      else reasons.push({ label: t[key] < g[key] ? `${label} under target` : `${label} over target`, ok: false });
    } else score += 10;
  }

  // Sugar & sodium — limits
  for (const [key, label] of [
    ['sugar', 'Sugar'],
    ['sodium', 'Sodium'],
  ] as const) {
    if (g[key] > 0) {
      if (t[key] <= g[key]) {
        score += 5;
        reasons.push({ label: `${label} within limit`, ok: true });
      } else {
        score += 5 * clamp01(1 - (t[key] - g[key]) / g[key]);
        reasons.push({ label: `${label} over limit`, ok: false });
      }
    } else score += 5;
  }

  // Water — at least the daily goal (only when tracked)
  if (extras.water && extras.water.goal > 0) {
    possible += 10;
    const r = clamp01(extras.water.cups / extras.water.goal);
    score += 10 * r;
    reasons.push(r >= 1 ? { label: 'Hydrated', ok: true } : { label: 'Drink more water', ok: false });
  }

  // Alcohol — a limit, like sugar/sodium (only when tracked)
  if (extras.alcohol) {
    const { drinks, limit } = extras.alcohol;
    possible += 10;
    if (drinks <= limit) {
      score += 10;
      reasons.push({ label: drinks === 0 ? 'No alcohol' : 'Alcohol within limit', ok: true });
    } else {
      score += 10 * clamp01(1 - (drinks - limit) / Math.max(limit, 1));
      reasons.push({ label: 'Too much alcohol', ok: false });
    }
  }

  return { score: Math.round((score / possible) * 100), reasons };
}

/** Percent of consumed calories from protein / carbs / fat (4/4/9 kcal per g). Sums to ~100. */
export function macroShares(t: Pick<MacroSet, 'protein' | 'carbs' | 'fat'>) {
  const p = t.protein * 4;
  const c = t.carbs * 4;
  const f = t.fat * 9;
  const total = p + c + f;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((p / total) * 100),
    carbs: Math.round((c / total) * 100),
    fat: Math.round((f / total) * 100),
  };
}
