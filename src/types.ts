export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

/** All tracked nutrients. kcal in calories, sodium in mg, everything else in grams. */
export interface MacroSet {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export const EMPTY_MACROS: MacroSet = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
};

export const MACRO_KEYS = Object.keys(EMPTY_MACROS) as (keyof MacroSet)[];

export interface Entry extends MacroSet {
  id?: number;
  /** Day key, YYYY-MM-DD in local time */
  date: string;
  meal: Meal;
  name: string;
  emoji: string;
  portion: string;
  createdAt: number;
}

export interface FoodItem extends MacroSet {
  name: string;
  emoji: string;
  portion: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface Analysis {
  items: FoodItem[];
  notes: string;
}

export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'cut' | 'maintain' | 'bulk';

export interface Profile {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: GoalType;
}

/** Daily targets. fiber/protein are "at least" goals; sugar/sodium are limits. */
export type Goals = MacroSet;

export type Units = 'metric' | 'imperial';

export interface Settings {
  onboarded: boolean;
  units: Units;
  apiKey: string;
  model: string;
  profile: Profile | null;
  goals: Goals;
  /** Water tracking is opt-in to keep the dashboard uncluttered. */
  trackWater: boolean;
  /** Daily water goal in cups (8 oz each). */
  waterGoal: number;
}

export interface WaterDay {
  date: string; // YYYY-MM-DD
  cups: number;
}

export const MODEL_OPTIONS = [
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 — most accurate' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 — fast & balanced' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 — cheapest' },
];
