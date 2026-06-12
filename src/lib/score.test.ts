import { describe, expect, it } from 'vitest';
import { macroShares, nutritionScore } from './score';
import type { Goals, MacroSet } from '../types';

const goals: Goals = { kcal: 2000, protein: 150, carbs: 200, fat: 65, fiber: 30, sugar: 50, sodium: 2300 };

const perfect: MacroSet = { kcal: 2000, protein: 150, carbs: 200, fat: 65, fiber: 30, sugar: 30, sodium: 1500 };

describe('nutritionScore', () => {
  it('gives 100 for a perfect day', () => {
    const { score, reasons } = nutritionScore(perfect, goals);
    expect(score).toBe(100);
    expect(reasons.every((r) => r.ok)).toBe(true);
  });

  it('scores an empty day low with under-target reasons', () => {
    const { score, reasons } = nutritionScore({ kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }, goals);
    expect(score).toBeLessThan(40);
    expect(reasons.find((r) => r.label === 'Calories under target')?.ok).toBe(false);
    expect(reasons.find((r) => r.label === 'Protein low')?.ok).toBe(false);
    // limits are trivially satisfied when nothing is eaten
    expect(reasons.find((r) => r.label === 'Sugar within limit')?.ok).toBe(true);
  });

  it('flags protein met and fiber low independently', () => {
    const { reasons } = nutritionScore({ ...perfect, fiber: 5 }, goals);
    expect(reasons.find((r) => r.label === 'Protein target met')?.ok).toBe(true);
    expect(reasons.find((r) => r.label === 'Fiber low')?.ok).toBe(false);
  });

  it('penalizes going over limits and calories', () => {
    const over = nutritionScore({ ...perfect, kcal: 2600, sugar: 90, sodium: 4000 }, goals);
    expect(over.score).toBeLessThan(90);
    expect(over.reasons.find((r) => r.label === 'Calories over target')?.ok).toBe(false);
    expect(over.reasons.find((r) => r.label === 'Sugar over limit')?.ok).toBe(false);
    expect(over.reasons.find((r) => r.label === 'Sodium over limit')?.ok).toBe(false);
  });

  it('skips components with zero goals instead of dividing by zero', () => {
    const { score } = nutritionScore(perfect, { ...goals, fiber: 0, sugar: 0 });
    expect(Number.isFinite(score)).toBe(true);
    expect(score).toBe(100);
  });
});

describe('water & alcohol extras', () => {
  it('still gives 100 when hydrated and alcohol-free', () => {
    const { score, reasons } = nutritionScore(perfect, goals, {
      water: { cups: 8, goal: 8 },
      alcohol: { drinks: 0, limit: 2 },
    });
    expect(score).toBe(100);
    expect(reasons.find((r) => r.label === 'Hydrated')?.ok).toBe(true);
    expect(reasons.find((r) => r.label === 'No alcohol')?.ok).toBe(true);
  });

  it('lowers the score when not drinking enough water', () => {
    const { score, reasons } = nutritionScore(perfect, goals, { water: { cups: 2, goal: 8 } });
    expect(score).toBeLessThan(100);
    expect(reasons.find((r) => r.label === 'Drink more water')?.ok).toBe(false);
  });

  it('gives full credit within the drink limit and penalizes going over', () => {
    const within = nutritionScore(perfect, goals, { alcohol: { drinks: 2, limit: 2 } });
    expect(within.score).toBe(100);
    expect(within.reasons.find((r) => r.label === 'Alcohol within limit')?.ok).toBe(true);

    const over = nutritionScore(perfect, goals, { alcohol: { drinks: 5, limit: 2 } });
    expect(over.score).toBeLessThan(within.score);
    expect(over.reasons.find((r) => r.label === 'Too much alcohol')?.ok).toBe(false);
  });

  it('handles a zero drink limit without dividing by zero', () => {
    const { score } = nutritionScore(perfect, goals, { alcohol: { drinks: 1, limit: 0 } });
    expect(Number.isFinite(score)).toBe(true);
    expect(score).toBeLessThan(100);
  });

  it('keeps the old behaviour when nothing extra is tracked', () => {
    expect(nutritionScore(perfect, goals).score).toBe(100);
    expect(nutritionScore(perfect, goals).reasons.some((r) => /water|alcohol/i.test(r.label))).toBe(false);
  });
});

describe('macroShares', () => {
  it('computes percent of calories using 4/4/9', () => {
    // 100g P = 400, 100g C = 400, 22.22g F ≈ 200 → 40/40/20
    const s = macroShares({ protein: 100, carbs: 100, fat: 200 / 9 });
    expect(s.protein).toBe(40);
    expect(s.carbs).toBe(40);
    expect(s.fat).toBe(20);
  });

  it('returns zeros when nothing is logged', () => {
    expect(macroShares({ protein: 0, carbs: 0, fat: 0 })).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });

  it('shares sum to ~100', () => {
    const s = macroShares({ protein: 137, carbs: 211, fat: 73 });
    expect(s.protein + s.carbs + s.fat).toBeGreaterThanOrEqual(99);
    expect(s.protein + s.carbs + s.fat).toBeLessThanOrEqual(101);
  });
});
