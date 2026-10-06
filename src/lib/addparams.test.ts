import { describe, expect, it } from 'vitest';
import { parseAddParams } from './addparams';

describe('parseAddParams', () => {
  it('returns null when ?add param is absent', () => {
    expect(parseAddParams('')).toBeNull();
    expect(parseAddParams('?name=Apple')).toBeNull();
  });

  it('returns null when add=1 but name is missing', () => {
    expect(parseAddParams('?add=1')).toBeNull();
    expect(parseAddParams('?add=1&kcal=100')).toBeNull();
  });

  it('parses a full entry correctly', () => {
    const result = parseAddParams(
      '?add=1&name=Grilled+Chicken&emoji=🍗&portion=200g&kcal=330&protein=62&carbs=0&fat=7.2&fiber=0&sugar=0&sodium=150&meal=dinner',
    );
    expect(result).not.toBeNull();
    expect(result!.item.name).toBe('Grilled Chicken');
    expect(result!.item.kcal).toBe(330);
    expect(result!.item.protein).toBe(62);
    expect(result!.item.fat).toBe(7.2);
    expect(result!.item.sodium).toBe(150);
    expect(result!.meal).toBe('dinner');
  });

  it('defaults missing nutrients to 0', () => {
    const result = parseAddParams('?add=1&name=Apple');
    expect(result!.item.kcal).toBe(0);
    expect(result!.item.protein).toBe(0);
    expect(result!.item.sodium).toBe(0);
  });

  it('defaults missing emoji to 🍽️', () => {
    const result = parseAddParams('?add=1&name=Apple');
    expect(result!.item.emoji).toBe('🍽️');
  });

  it('defaults unknown meal to snacks', () => {
    const result = parseAddParams('?add=1&name=Apple&meal=brunch');
    expect(result!.meal).toBe('snacks');
  });

  it('accepts all valid meal values', () => {
    for (const m of ['breakfast', 'lunch', 'dinner', 'snacks', 'liquids']) {
      expect(parseAddParams(`?add=1&name=X&meal=${m}`)!.meal).toBe(m);
    }
  });

  it('clamps negative nutrient values to 0', () => {
    const result = parseAddParams('?add=1&name=X&kcal=-200&protein=-5');
    expect(result!.item.kcal).toBe(0);
    expect(result!.item.protein).toBe(0);
  });

  it('rounds nutrients to one decimal', () => {
    const result = parseAddParams('?add=1&name=X&fat=7.2345');
    expect(result!.item.fat).toBe(7.2);
  });
});
