import { useRef, useState } from 'react';
import { GoalEditor } from '../components/GoalEditor';
import { ProfileForm } from '../components/ProfileForm';
import { Sheet } from '../components/Sheet';
import { db, exportBackup, importBackup } from '../lib/db';
import { computeGoals } from '../lib/goals';
import { updateSettings, useSettings } from '../lib/settings';
import { MODEL_OPTIONS, type Profile } from '../types';

const DEFAULT_PROFILE: Profile = {
  age: 30,
  sex: 'male',
  heightCm: 178,
  weightKg: 80,
  activity: 'moderate',
  goal: 'maintain',
};

export function SettingsPage() {
  const settings = useSettings();
  const [showGoals, setShowGoals] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  async function doExport() {
    const json = await exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macro-mate-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function doImport(file: File | undefined) {
    if (!file) return;
    try {
      const result = await importBackup(await file.text());
      setMessage(`Restored ${result.entries} entries from backup.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Import failed.');
    }
  }

  async function clearAll() {
    if (!confirm('Delete ALL logged food? This cannot be undone (export a backup first).')) return;
    await db.entries.clear();
    setMessage('All entries deleted.');
  }

  return (
    <div className="page">
      <div className="day-nav">
        <h1>Settings</h1>
      </div>

      {message && (
        <div className="notes-box" onClick={() => setMessage('')}>
          {message}
        </div>
      )}

      <div className="section-title">Goals</div>
      <div className="card">
        <div className="settings-row">
          <div>
            <div className="sr-label">Daily targets</div>
            <div className="sr-sub">
              {settings.goals.kcal} kcal · P {settings.goals.protein} · C {settings.goals.carbs} · F{' '}
              {settings.goals.fat}
            </div>
          </div>
          <button style={{ color: 'var(--accent)', fontWeight: 600 }} onClick={() => setShowGoals(true)}>
            Edit
          </button>
        </div>
        <div className="settings-row">
          <div>
            <div className="sr-label">Track water</div>
            <div className="sr-sub">Adds a slim 💧 row to the dashboard</div>
          </div>
          <button
            role="switch"
            aria-checked={settings.trackWater}
            style={{ color: 'var(--accent)', fontWeight: 600 }}
            onClick={() => updateSettings({ trackWater: !settings.trackWater })}
          >
            {settings.trackWater ? 'On' : 'Off'}
          </button>
        </div>
        {settings.trackWater && (
          <div className="settings-row">
            <div>
              <div className="sr-label">Water goal</div>
              <div className="sr-sub">Cups per day (8 oz each)</div>
            </div>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              style={{ width: 76, textAlign: 'center' }}
              value={settings.waterGoal || ''}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 0) updateSettings({ waterGoal: Math.round(n) });
              }}
            />
          </div>
        )}
        <div className="settings-row">
          <div>
            <div className="sr-label">Recalculate from profile</div>
            <div className="sr-sub">Age, weight, activity, goal</div>
          </div>
          <button style={{ color: 'var(--accent)', fontWeight: 600 }} onClick={() => setShowProfile(true)}>
            Open
          </button>
        </div>
      </div>

      <div className="section-title">AI</div>
      <div className="card">
        <div className="settings-row">
          <div>
            <div className="sr-label">Anthropic API key</div>
            <div className="sr-sub">
              {settings.apiKey ? `Saved (…${settings.apiKey.slice(-4)})` : 'Not set — photo analysis disabled'}
            </div>
          </div>
          <button style={{ color: 'var(--accent)', fontWeight: 600 }} onClick={() => setShowKey(true)}>
            {settings.apiKey ? 'Change' : 'Add'}
          </button>
        </div>
        <div className="settings-row">
          <div style={{ flex: 1 }}>
            <div className="sr-label">Model</div>
            <select
              style={{ marginTop: 6 }}
              value={settings.model}
              onChange={(e) => updateSettings({ model: e.target.value })}
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="section-title">Data</div>
      <div className="card">
        <div className="settings-row">
          <div>
            <div className="sr-label">Export backup</div>
            <div className="sr-sub">All entries + settings as JSON</div>
          </div>
          <button style={{ color: 'var(--accent)', fontWeight: 600 }} onClick={doExport}>
            Export
          </button>
        </div>
        <div className="settings-row">
          <div>
            <div className="sr-label">Import backup</div>
            <div className="sr-sub">Replaces current data</div>
          </div>
          <button style={{ color: 'var(--accent)', fontWeight: 600 }} onClick={() => importRef.current?.click()}>
            Import
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => doImport(e.target.files?.[0])}
          />
        </div>
        <div className="settings-row">
          <div>
            <div className="sr-label">Delete all entries</div>
            <div className="sr-sub">Your data lives only on this device</div>
          </div>
          <button className="btn-danger" style={{ fontWeight: 600 }} onClick={clearAll}>
            Delete
          </button>
        </div>
      </div>

      <div className="section-title">About</div>
      <div className="card">
        <div className="sr-sub" style={{ lineHeight: 1.5 }}>
          Macro Mate stores everything on this device. Your API key is only sent to Anthropic to analyze
          your food photos. AI estimates are approximations — review them before saving.
        </div>
      </div>

      {showGoals && (
        <Sheet onClose={() => setShowGoals(false)}>
          <h2>Daily targets</h2>
          <GoalEditor goals={settings.goals} onChange={(g) => updateSettings({ goals: g })} />
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => setShowGoals(false)}>
            Done
          </button>
        </Sheet>
      )}

      {showProfile && (
        <ProfileSheet onClose={() => setShowProfile(false)} />
      )}

      {showKey && (
        <ApiKeySheet onClose={() => setShowKey(false)} />
      )}
    </div>
  );
}

function ProfileSheet({ onClose }: { onClose: () => void }) {
  const settings = useSettings();
  const [profile, setProfile] = useState<Profile>(settings.profile ?? DEFAULT_PROFILE);
  const preview = computeGoals(profile);

  return (
    <Sheet onClose={onClose}>
      <h2>Your profile</h2>
      <ProfileForm
        profile={profile}
        units={settings.units}
        onChange={setProfile}
        onUnitsChange={(u) => updateSettings({ units: u })}
      />
      <div className="notes-box">
        Suggested: {preview.kcal} kcal · P {preview.protein}g · C {preview.carbs}g · F {preview.fat}g
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          updateSettings({ profile, goals: preview });
          onClose();
        }}
      >
        Apply suggested targets
      </button>
      <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={onClose}>
        Cancel
      </button>
    </Sheet>
  );
}

function ApiKeySheet({ onClose }: { onClose: () => void }) {
  const settings = useSettings();
  const [key, setKey] = useState(settings.apiKey);
  return (
    <Sheet onClose={onClose}>
      <h2>Anthropic API key</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.5, marginTop: 0 }}>
        Create a key at console.anthropic.com → API Keys. It is stored only on this device and sent only
        to Anthropic.
      </p>
      <div className="field">
        <input
          type="password"
          autoComplete="off"
          placeholder="sk-ant-…"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          updateSettings({ apiKey: key.trim() });
          onClose();
        }}
      >
        Save key
      </button>
    </Sheet>
  );
}
