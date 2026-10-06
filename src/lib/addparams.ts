/**
 * URL-import schema for Meta AI (or any external tool) to add a food entry.
 *
 * Generate a link like:
 *   https://riprivalovberk.github.io/macro-mate/?add=1
 *     &name=Grilled+Chicken&emoji=🍗&portion=200g
 *     &kcal=330&protein=62&carbs=0&fat=7.2&fiber=0&sugar=0&sodium=150
 *     &meal=dinner
 *
 * Fields:
 *   add     required, must be "1" (signals an import)
 *   name    required, food name
 *   emoji   optional, single emoji (defaults to 🍽️)
 *   portion optional, human-readable size like "200 g" or "1 bowl"
 *   kcal    optional number (calories)
 *   protein optional number (grams)
 *   carbs   optional number (grams)
 *   fat     optional number (grams)
 *   fiber   optional number (grams)
 *   sugar   optional number (grams)
 *   sodium  optional number (milligrams)
 *   meal    optional: breakfast | lunch | dinner | snacks | liquids
 *
 * All nutrient fields default to 0 when absent.
 * The app opens the review screen so the user can confirm before saving.
 */

import type { EditableFood } from '../components/ItemFields';
import { MEALS, type Meal } from '../types';

export interface AddParams {
  item: EditableFood;
  meal: Meal;
}

function safeNum(v: string | null): number {
  if (v === null) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
}

/** Parse URL search params for an ?add=1 import. Returns null when not present or invalid. */
export function parseAddParams(search: string): AddParams | null {
  const p = new URLSearchParams(search);
  if (p.get('add') !== '1') return null;
  const name = p.get('name')?.trim().slice(0, 120);
  if (!name) return null;

  const mealRaw = p.get('meal') ?? '';
  const meal: Meal = (MEALS as string[]).includes(mealRaw) ? (mealRaw as Meal) : 'snacks';

  return {
    meal,
    item: {
      name,
      emoji: (p.get('emoji') ?? '🍽️').slice(0, 8) || '🍽️',
      portion: (p.get('portion') ?? '').slice(0, 120),
      kcal: safeNum(p.get('kcal')),
      protein: safeNum(p.get('protein')),
      carbs: safeNum(p.get('carbs')),
      fat: safeNum(p.get('fat')),
      fiber: safeNum(p.get('fiber')),
      sugar: safeNum(p.get('sugar')),
      sodium: safeNum(p.get('sodium')),
    },
  };
}
