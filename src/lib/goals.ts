import type { Activity, Goals, GoalType, Profile } from '../types';

export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: 'Sedentary (desk job, little exercise)',
  light: 'Light (1–3 workouts / week)',
  moderate: 'Moderate (3–5 workouts / week)',
  active: 'Active (6–7 workouts / week)',
  very_active: 'Very active (physical job + training)',
};

export const GOAL_LABELS: Record<GoalType, string> = {
  cut: 'Lose fat',
  maintain: 'Maintain',
  bulk: 'Build muscle',
};

const GOAL_ADJUST: Record<GoalType, number> = { cut: 0.8, maintain: 1.0, bulk: 1.1 };
const PROTEIN_PER_KG: Record<GoalType, number> = { cut: 2.0, maintain: 1.6, bulk: 1.8 };

/** Mifflin–St Jeor basal metabolic rate, kcal/day. */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'male' ? base + 5 : base - 161;
}

export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY_FACTORS[p.activity];
}

/** Compute recommended daily targets from a profile. All values rounded. */
export function computeGoals(p: Profile): Goals {
  const kcal = Math.round((tdee(p) * GOAL_ADJUST[p.goal]) / 10) * 10;
  const protein = Math.round(PROTEIN_PER_KG[p.goal] * p.weightKg);
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const fiber = Math.round((kcal / 1000) * 14);
  const sugar = Math.round((kcal * 0.1) / 4); // WHO limit: <10% of calories
  const sodium = 2300; // mg, FDA guideline
  return { kcal, protein, carbs, fat, fiber, sugar, sodium };
}

export const DEFAULT_GOALS: Goals = {
  kcal: 2200,
  protein: 150,
  carbs: 230,
  fat: 70,
  fiber: 30,
  sugar: 55,
  sodium: 2300,
};

// --- Unit conversions ---

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export function lbsToKg(lbs: number): number {
  return lbs * KG_PER_LB;
}
export function kgToLbs(kg: number): number {
  return kg / KG_PER_LB;
}
export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_IN;
}
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalIn = Math.round(cm / CM_PER_IN);
  return { feet: Math.floor(totalIn / 12), inches: totalIn % 12 };
}
