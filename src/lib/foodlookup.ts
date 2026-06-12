/** Grounds branded-food estimates in real label data from OpenFoodFacts
 * (free, CORS-enabled, no key). Results are injected into the AI prompt as
 * verified candidates so it stops inventing plausible-sounding nutrients. */

export interface LookupProduct {
  name: string;
  brand: string;
  serving: string;
  /** Whether values are per serving or per 100 g */
  per: 'serving' | '100g';
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number; // mg
}

const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

type OffNutriments = Record<string, number | string | undefined>;
interface OffProduct {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OffNutriments;
}

function n(v: number | string | undefined): number | undefined {
  const num = Number(v);
  return Number.isFinite(num) ? num : undefined;
}

/** Pure parser for the OFF search response (exported for tests). */
export function parseOffProducts(data: { products?: OffProduct[] }, limit = 4): LookupProduct[] {
  const out: LookupProduct[] = [];
  for (const p of data.products ?? []) {
    if (!p.product_name || !p.nutriments) continue;
    const nut = p.nutriments;
    // Prefer per-serving values; fall back to per-100g.
    const perServing = n(nut['energy-kcal_serving']) !== undefined;
    const suffix = perServing ? '_serving' : '_100g';
    const kcal = n(nut[`energy-kcal${suffix}`]);
    if (kcal === undefined) continue;
    const g = (key: string) => n(nut[`${key}${suffix}`]) ?? 0;
    out.push({
      name: p.product_name.slice(0, 80),
      brand: (p.brands ?? '').split(',')[0].trim().slice(0, 40),
      serving: p.serving_size ?? '',
      per: perServing ? 'serving' : '100g',
      kcal: Math.round(kcal),
      protein: g('proteins'),
      carbs: g('carbohydrates'),
      fat: g('fat'),
      fiber: g('fiber'),
      sugar: g('sugars'),
      sodium: Math.round(g('sodium') * 1000), // OFF stores grams → mg
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** Render candidates as a compact prompt block. Empty string when none. */
export function formatLookup(products: LookupProduct[]): string {
  if (products.length === 0) return '';
  const lines = products.map((p, i) => {
    const basis = p.per === 'serving' ? `per serving${p.serving ? ` (${p.serving})` : ''}` : 'per 100 g';
    return `${i + 1}. ${p.name}${p.brand ? ` (${p.brand})` : ''} — ${basis}: ${p.kcal} kcal, ${p.protein}g protein, ${p.carbs}g carbs, ${p.fat}g fat, ${p.fiber}g fiber, ${p.sugar}g sugar, ${p.sodium}mg sodium`;
  });
  return `Verified nutrition data from the OpenFoodFacts database for possible matches:\n${lines.join('\n')}\nIf one of these matches the user's food, use its label values (scaled to the portion eaten) instead of estimating. Ignore entries that don't match.`;
}

/** Search OFF for a food description. Best-effort: returns '' on any failure. */
export async function lookupFoodData(query: string, timeoutMs = 4000): Promise<string> {
  const q = query.trim();
  if (!q) return '';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const params = new URLSearchParams({
      search_terms: q.slice(0, 100),
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '6',
      fields: 'product_name,brands,serving_size,nutriments',
    });
    const res = await fetch(`${SEARCH_URL}?${params}`, { signal: ctrl.signal });
    if (!res.ok) return '';
    return formatLookup(parseOffProducts(await res.json()));
  } catch {
    return ''; // grounding is optional — never block the analysis on it
  } finally {
    clearTimeout(timer);
  }
}
