import { describe, expect, it } from 'vitest';
import { parseAnalysis, stopReasonError } from './ai';

const validItem = {
  name: 'Grilled chicken breast',
  emoji: '🍗',
  portion: '~200 g',
  kcal: 330,
  protein: 62,
  carbs: 0,
  fat: 7.2,
  fiber: 0,
  sugar: 0,
  sodium: 150,
  confidence: 'medium',
};

describe('parseAnalysis', () => {
  it('parses a well-formed response', () => {
    const result = parseAnalysis(JSON.stringify({ items: [validItem], notes: 'Assumed no oil.' }));
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Grilled chicken breast');
    expect(result.items[0].kcal).toBe(330);
    expect(result.items[0].fat).toBe(7.2);
    expect(result.notes).toBe('Assumed no oil.');
  });

  it('parses multi-item plates', () => {
    const result = parseAnalysis(
      JSON.stringify({
        items: [validItem, { ...validItem, name: 'White rice', emoji: '🍚', kcal: 205 }],
        notes: '',
      }),
    );
    expect(result.items).toHaveLength(2);
    expect(result.items[1].kcal).toBe(205);
  });

  it('clamps negative and non-finite numbers to 0', () => {
    const result = parseAnalysis(
      JSON.stringify({
        items: [{ ...validItem, kcal: -50, protein: 'NaN', carbs: null }],
        notes: '',
      }),
    );
    expect(result.items[0].kcal).toBe(0);
    expect(result.items[0].protein).toBe(0);
    expect(result.items[0].carbs).toBe(0);
  });

  it('caps absurdly large values', () => {
    const result = parseAnalysis(
      JSON.stringify({ items: [{ ...validItem, kcal: 9e9 }], notes: '' }),
    );
    expect(result.items[0].kcal).toBeLessThanOrEqual(100000);
  });

  it('defaults a bad confidence value to medium', () => {
    const result = parseAnalysis(
      JSON.stringify({ items: [{ ...validItem, confidence: 'certain' }], notes: '' }),
    );
    expect(result.items[0].confidence).toBe('medium');
  });

  it('fills in a fallback emoji and name', () => {
    const result = parseAnalysis(
      JSON.stringify({ items: [{ ...validItem, name: undefined, emoji: '' }], notes: '' }),
    );
    expect(result.items[0].name).toBe('Food');
    expect(result.items[0].emoji).toBe('🍽️');
  });

  it('accepts an empty items array (no food detected)', () => {
    const result = parseAnalysis(JSON.stringify({ items: [], notes: 'No food visible.' }));
    expect(result.items).toHaveLength(0);
    expect(result.notes).toBe('No food visible.');
  });

  it('throws a friendly error on non-JSON', () => {
    expect(() => parseAnalysis('I cannot analyze this')).toThrow(/unreadable/i);
  });

  it('throws a friendly error when items is missing', () => {
    expect(() => parseAnalysis(JSON.stringify({ foods: [] }))).toThrow(/missing food items/i);
  });

  it('rounds nutrient values to one decimal', () => {
    const result = parseAnalysis(
      JSON.stringify({ items: [{ ...validItem, fat: 7.2345 }], notes: '' }),
    );
    expect(result.items[0].fat).toBe(7.2);
  });
});

describe('stopReasonError', () => {
  it('returns null for a normal completion', () => {
    expect(stopReasonError('end_turn')).toBeNull();
    expect(stopReasonError(null)).toBeNull();
    expect(stopReasonError(undefined)).toBeNull();
  });

  it('explains a max_tokens stop (e.g. token-burning non-food image)', () => {
    expect(stopReasonError('max_tokens')).toMatch(/ran long|clearer photo/i);
  });

  it('explains a refusal', () => {
    expect(stopReasonError('refusal')).toMatch(/declined/i);
  });
});
