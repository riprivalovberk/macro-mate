import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, resetSettingsCacheForTests, saveSettings, updateSettings } from './settings';

beforeEach(() => {
  localStorage.clear();
  resetSettingsCacheForTests();
});

describe('settings store', () => {
  it('returns defaults when nothing is stored', () => {
    const s = loadSettings();
    expect(s.onboarded).toBe(false);
    expect(s.model).toBe('claude-opus-4-8');
    expect(s.goals.kcal).toBeGreaterThan(0);
  });

  it('persists and reloads', () => {
    saveSettings({ ...DEFAULT_SETTINGS, apiKey: 'sk-test', onboarded: true });
    resetSettingsCacheForTests();
    const s = loadSettings();
    expect(s.apiKey).toBe('sk-test');
    expect(s.onboarded).toBe(true);
  });

  it('patches without losing other fields', () => {
    updateSettings({ apiKey: 'sk-abc' });
    updateSettings({ units: 'metric' });
    const s = loadSettings();
    expect(s.apiKey).toBe('sk-abc');
    expect(s.units).toBe('metric');
  });

  it('merges stored goals over defaults so new nutrients get defaults', () => {
    localStorage.setItem(
      'macro-mate:settings',
      JSON.stringify({ onboarded: true, goals: { kcal: 1800 } }),
    );
    resetSettingsCacheForTests();
    const s = loadSettings();
    expect(s.goals.kcal).toBe(1800);
    expect(s.goals.sodium).toBe(2300); // filled from defaults
  });

  it('survives corrupted storage', () => {
    localStorage.setItem('macro-mate:settings', '{broken');
    resetSettingsCacheForTests();
    expect(loadSettings().onboarded).toBe(false);
  });
});
