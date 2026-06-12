import { describe, expect, it } from 'vitest';
import { cupsFromPortion, liquidCups } from './liquids';

describe('cupsFromPortion', () => {
  it('parses fluid ounces', () => {
    expect(cupsFromPortion('12 oz')).toBeCloseTo(1.5);
    expect(cupsFromPortion('16.9 fl oz bottle')).toBeCloseTo(2.11, 1);
    expect(cupsFromPortion('8oz')).toBe(1);
  });

  it('parses ml and liters', () => {
    expect(cupsFromPortion('355 ml can')).toBeCloseTo(1.5, 1);
    expect(cupsFromPortion('0.5 L')).toBeCloseTo(2.11, 1);
    expect(cupsFromPortion('1 liter')).toBeCloseTo(4.23, 1);
  });

  it('parses cups and glasses', () => {
    expect(cupsFromPortion('2 cups')).toBe(2);
    expect(cupsFromPortion('1 glass')).toBe(1);
  });

  it('finds the volume inside other text', () => {
    expect(cupsFromPortion('1 can (12 oz)')).toBeCloseTo(1.5);
  });

  it('defaults to one cup when no volume is recognizable', () => {
    expect(cupsFromPortion('')).toBe(1);
    expect(cupsFromPortion('1 bottle')).toBe(1);
    expect(cupsFromPortion('large')).toBe(1);
  });
});

describe('liquidCups', () => {
  it('sums entries and rounds to 0.1', () => {
    expect(liquidCups([{ portion: '12 oz' }, { portion: '1 cup' }, { portion: '1 bottle' }])).toBe(3.5);
  });

  it('is 0 for no liquids', () => {
    expect(liquidCups([])).toBe(0);
  });
});
