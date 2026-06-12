import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { addEntry, db } from './lib/db';
import { todayKey } from './lib/dates';
import { DEFAULT_SETTINGS, resetSettingsCacheForTests, saveSettings } from './lib/settings';

beforeEach(async () => {
  localStorage.clear();
  resetSettingsCacheForTests();
  await db.entries.clear();
});

describe('App', () => {
  it('shows onboarding on first launch', () => {
    render(<App />);
    expect(screen.getByText('Macro Mate')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });

  it('shows the dashboard once onboarded', () => {
    saveSettings({ ...DEFAULT_SETTINGS, onboarded: true });
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Snacks')).toBeInTheDocument();
  });

  it('renders logged entries with their macros', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, onboarded: true });
    await addEntry({
      date: todayKey(),
      meal: 'lunch',
      name: 'Chicken bowl',
      emoji: '🍗',
      portion: '1 bowl',
      kcal: 550,
      protein: 45,
      carbs: 50,
      fat: 18,
      fiber: 6,
      sugar: 4,
      sodium: 800,
      createdAt: Date.now(),
    });

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Chicken bowl')).toBeInTheDocument();
    });
    // day total appears in the calorie ring AND on the entry row
    expect(screen.getAllByText('550').length).toBeGreaterThanOrEqual(2);
  });

  it('shows goal targets from settings in the macro bars', async () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      onboarded: true,
      goals: { ...DEFAULT_SETTINGS.goals, protein: 175 },
    });
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText(/175 g/)).toBeInTheDocument();
  });
});
