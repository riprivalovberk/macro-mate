import { describe, expect, it } from 'vitest';
import type { Profile } from '../types';
import {
  bmr,
  cmToFeetInches,
  computeGoals,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
  tdee,
} from './goals';

const male: Profile = {
  age: 30,
  sex: 'male',
  heightCm: 180,
  weightKg: 80,
  activity: 'moderate',
  goal: 'maintain',
};

const female: Profile = { ...male, sex: 'female' };

describe('bmr (Mifflin–St Jeor)', () => {
  it('computes male BMR', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(bmr(male)).toBe(1780);
  });

  it('computes female BMR (−166 vs male)', () => {
    expect(bmr(female)).toBe(1780 - 166);
  });
});

describe('tdee', () => {
  it('applies the activity multiplier', () => {
    expect(tdee(male)).toBeCloseTo(1780 * 1.55, 5);
    expect(tdee({ ...male, activity: 'sedentary' })).toBeCloseTo(1780 * 1.2, 5);
  });
});

describe('computeGoals', () => {
  it('maintain: calories ≈ TDEE, rounded to 10', () => {
    const g = computeGoals(male);
    expect(g.kcal).toBe(Math.round((1780 * 1.55) / 10) * 10); // 2760
    expect(g.kcal % 10).toBe(0);
  });

  it('cut reduces calories by 20% and raises protein to 2 g/kg', () => {
    const cut = computeGoals({ ...male, goal: 'cut' });
    const maintain = computeGoals(male);
    expect(cut.kcal).toBeLessThan(maintain.kcal);
    expect(cut.kcal).toBe(Math.round((1780 * 1.55 * 0.8) / 10) * 10);
    expect(cut.protein).toBe(160); // 2.0 * 80
  });

  it('bulk increases calories by 10%', () => {
    const bulk = computeGoals({ ...male, goal: 'bulk' });
    expect(bulk.kcal).toBe(Math.round((1780 * 1.55 * 1.1) / 10) * 10);
    expect(bulk.protein).toBe(144); // 1.8 * 80
  });

  it('macros are energetically consistent with the calorie goal', () => {
    const g = computeGoals(male);
    const kcalFromMacros = g.protein * 4 + g.carbs * 4 + g.fat * 9;
    // carbs are computed as the rounded remainder, so allow rounding slack
    expect(Math.abs(kcalFromMacros - g.kcal)).toBeLessThanOrEqual(12);
  });

  it('derives fiber and sugar from calories, sodium fixed at 2300', () => {
    const g = computeGoals(male);
    expect(g.fiber).toBe(Math.round((g.kcal / 1000) * 14));
    expect(g.sugar).toBe(Math.round((g.kcal * 0.1) / 4));
    expect(g.sodium).toBe(2300);
  });

  it('never returns negative carbs', () => {
    const tiny: Profile = { ...male, weightKg: 200, activity: 'sedentary', goal: 'cut', age: 90 };
    expect(computeGoals(tiny).carbs).toBeGreaterThanOrEqual(0);
  });
});

describe('unit conversions', () => {
  it('round-trips lbs ↔ kg', () => {
    expect(kgToLbs(lbsToKg(180))).toBeCloseTo(180, 8);
    expect(lbsToKg(220.462)).toBeCloseTo(100, 2);
  });

  it('converts feet+inches to cm', () => {
    expect(feetInchesToCm(5, 10)).toBeCloseTo(177.8, 1);
    expect(feetInchesToCm(6, 0)).toBeCloseTo(182.88, 1);
  });

  it('round-trips height within an inch', () => {
    const { feet, inches } = cmToFeetInches(feetInchesToCm(5, 11));
    expect(feet).toBe(5);
    expect(inches).toBe(11);
  });
});
