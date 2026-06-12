import { useSyncExternalStore } from 'react';
import { DEFAULT_GOALS } from './goals';
import type { Settings } from '../types';

const STORAGE_KEY = 'macro-mate:settings';

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  units: 'imperial',
  apiKey: '',
  model: 'claude-opus-4-8',
  profile: null,
  goals: { ...DEFAULT_GOALS },
  trackWater: false,
  waterGoal: 8,
};

let cached: Settings | null = null;
const listeners = new Set<() => void>();

export function loadSettings(): Settings {
  if (cached) return cached;
  let loaded: Settings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      loaded = { ...DEFAULT_SETTINGS, ...parsed, goals: { ...DEFAULT_GOALS, ...(parsed.goals ?? {}) } };
    } else {
      loaded = { ...DEFAULT_SETTINGS };
    }
  } catch {
    loaded = { ...DEFAULT_SETTINGS };
  }
  cached = loaded;
  return loaded;
}

export function saveSettings(next: Settings): void {
  cached = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next = { ...loadSettings(), ...patch };
  saveSettings(next);
  return next;
}

export function resetSettingsCacheForTests(): void {
  cached = null;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, loadSettings);
}
