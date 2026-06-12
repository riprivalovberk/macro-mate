import { describe, expect, it } from 'vitest';
import { formatLookup, parseOffProducts } from './foodlookup';

const offResponse = {
  products: [
    {
      product_name: 'Izze Sparkling Clementine',
      brands: 'Izze,PepsiCo',
      serving_size: '12 fl oz',
      nutriments: {
        'energy-kcal_serving': 100,
        proteins_serving: 0,
        carbohydrates_serving: 25,
        fat_serving: 0,
        fiber_serving: 0,
        sugars_serving: 20,
        sodium_serving: 0.015, // grams
      },
    },
    {
      product_name: 'Generic Juice',
      nutriments: {
        'energy-kcal_100g': 45,
        proteins_100g: 0.5,
        carbohydrates_100g: 11,
        fat_100g: 0,
        sugars_100g: 10,
        sodium_100g: 0.002,
      },
    },
    { product_name: 'No nutriments product' },
    { nutriments: { 'energy-kcal_100g': 50 } }, // no name
  ],
};

describe('parseOffProducts', () => {
  it('prefers per-serving values and converts sodium g→mg', () => {
    const [izze] = parseOffProducts(offResponse);
    expect(izze.name).toBe('Izze Sparkling Clementine');
    expect(izze.brand).toBe('Izze');
    expect(izze.per).toBe('serving');
    expect(izze.kcal).toBe(100);
    expect(izze.sugar).toBe(20);
    expect(izze.sodium).toBe(15);
  });

  it('falls back to per-100g and skips unusable products', () => {
    const products = parseOffProducts(offResponse);
    expect(products).toHaveLength(2);
    expect(products[1].per).toBe('100g');
    expect(products[1].kcal).toBe(45);
    expect(products[1].fiber).toBe(0); // missing field defaults to 0
  });

  it('respects the limit and handles empty input', () => {
    expect(parseOffProducts(offResponse, 1)).toHaveLength(1);
    expect(parseOffProducts({})).toHaveLength(0);
  });
});

describe('formatLookup', () => {
  it('renders a compact grounded-data block', () => {
    const text = formatLookup(parseOffProducts(offResponse));
    expect(text).toContain('OpenFoodFacts');
    expect(text).toContain('Izze Sparkling Clementine (Izze) — per serving (12 fl oz): 100 kcal');
    expect(text).toContain('15mg sodium');
    expect(text).toContain('per 100 g');
  });

  it('returns empty string for no products', () => {
    expect(formatLookup([])).toBe('');
  });
});
