import { useState } from 'react';
import { GoalEditor } from '../components/GoalEditor';
import { ProfileForm } from '../components/ProfileForm';
import { computeGoals } from '../lib/goals';
import { updateSettings, useSettings } from '../lib/settings';
import type { Goals, Profile } from '../types';

const START_PROFILE: Profile = {
  age: 25,
  sex: 'male',
  heightCm: 178,
  weightKg: 80,
  activity: 'moderate',
  goal: 'maintain',
};

export function Onboarding() {
  const settings = useSettings();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(START_PROFILE);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [apiKey, setApiKey] = useState('');

  const steps = 4;

  function next() {
    if (step === 1) setGoals(computeGoals(profile));
    setStep(step + 1);
  }

  function finish() {
    updateSettings({
      onboarded: true,
      profile,
      goals: goals ?? computeGoals(profile),
      apiKey: apiKey.trim(),
    });
  }

  return (
    <div className="onboard">
      <div className="ob-steps">
        {Array.from({ length: steps }).map((_, i) => (
          <div key={i} className={`dot ${i <= step ? 'on' : ''}`} />
        ))}
      </div>

      {step === 0 && (
        <>
          <div className="ob-body">
            <div className="ob-hero">🥑</div>
            <h1 style={{ textAlign: 'center' }}>Macro Mate</h1>
            <p className="ob-sub" style={{ textAlign: 'center' }}>
              Snap a photo of your food and let AI estimate the calories and macros. Everything stays on
              your phone.
            </p>
          </div>
          <button className="btn btn-primary" onClick={next}>
            Get started
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <div className="ob-body">
            <h1>About you</h1>
            <p className="ob-sub">Used once to calculate your daily targets — you can change everything later.</p>
            <ProfileForm
              profile={profile}
              units={settings.units}
              onChange={setProfile}
              onUnitsChange={(u) => updateSettings({ units: u })}
            />
          </div>
          <button className="btn btn-primary" disabled={!profile.age || !profile.weightKg || !profile.heightCm} onClick={next}>
            Calculate my targets
          </button>
        </>
      )}

      {step === 2 && goals && (
        <>
          <div className="ob-body">
            <h1>Your daily targets</h1>
            <p className="ob-sub">
              Based on your stats and goal. Tweak any number — these are yours.
            </p>
            <GoalEditor goals={goals} onChange={setGoals} />
          </div>
          <button className="btn btn-primary" onClick={next}>
            Looks good
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="ob-body">
            <h1>Connect the AI</h1>
            <p className="ob-sub">
              Photo analysis uses Claude with your own Anthropic API key (console.anthropic.com → API
              Keys). The key never leaves this device except to call Anthropic. You can skip this and add
              it later in Settings.
            </p>
            <div className="field">
              <input
                type="password"
                autoComplete="off"
                placeholder="sk-ant-…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={finish}>
            {apiKey.trim() ? 'Finish' : 'Skip for now'}
          </button>
        </>
      )}
    </div>
  );
}
