import type { Entry } from '../types';

const CUP_OZ = 8;
const CUP_ML = 236.6;

const VOLUME_RE =
  /(\d+(?:[.,]\d+)?)\s*(?:fl\.?\s*)?(oz|ounces?|ml|milliliters?|millilitres?|liters?|litres?|l|cups?|glass(?:es)?)\b/i;

/**
 * Cups (8 oz) contributed by one logged liquid, parsed from its portion
 * text ("12 oz", "1 can (355 ml)", "0.5 L", "2 cups"). Falls back to one
 * cup when no recognizable volume is present ("1 bottle", "large").
 */
export function cupsFromPortion(portion: string): number {
  const m = portion.match(VOLUME_RE);
  if (!m) return 1;
  const n = parseFloat(m[1].replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return 1;
  const unit = m[2].toLowerCase();
  if (unit.startsWith('oz') || unit.startsWith('ounce')) return n / CUP_OZ;
  if (unit === 'ml' || unit.startsWith('milli')) return n / CUP_ML;
  if (unit === 'l' || unit.startsWith('liter') || unit.startsWith('litre')) return (n * 1000) / CUP_ML;
  return n; // cups / glasses
}

/** Total cups from logged Liquids entries, rounded to 0.1. */
export function liquidCups(entries: Pick<Entry, 'portion'>[]): number {
  const sum = entries.reduce((s, e) => s + cupsFromPortion(e.portion), 0);
  return Math.round(sum * 10) / 10;
}
