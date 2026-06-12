import { ACTIVITY_LABELS, cmToFeetInches, feetInchesToCm, GOAL_LABELS, kgToLbs, lbsToKg } from '../lib/goals';
import type { Activity, GoalType, Profile, Units } from '../types';

interface ProfileFormProps {
  profile: Profile;
  units: Units;
  onChange: (p: Profile) => void;
  onUnitsChange: (u: Units) => void;
}

export function ProfileForm({ profile, units, onChange, onUnitsChange }: ProfileFormProps) {
  const p = profile;
  const { feet, inches } = cmToFeetInches(p.heightCm);

  return (
    <div>
      <div className="field">
        <span>Units</span>
        <div className="seg">
          <button className={units === 'imperial' ? 'active' : ''} onClick={() => onUnitsChange('imperial')}>
            lbs / ft
          </button>
          <button className={units === 'metric' ? 'active' : ''} onClick={() => onUnitsChange('metric')}>
            kg / cm
          </button>
        </div>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Age</span>
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={100}
            value={p.age || ''}
            onChange={(e) => onChange({ ...p, age: Number(e.target.value) })}
          />
        </label>
        <div className="field">
          <span>Sex</span>
          <div className="seg">
            <button className={p.sex === 'male' ? 'active' : ''} onClick={() => onChange({ ...p, sex: 'male' })}>
              Male
            </button>
            <button className={p.sex === 'female' ? 'active' : ''} onClick={() => onChange({ ...p, sex: 'female' })}>
              Female
            </button>
          </div>
        </div>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Weight ({units === 'imperial' ? 'lbs' : 'kg'})</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={units === 'imperial' ? Math.round(kgToLbs(p.weightKg)) || '' : Math.round(p.weightKg) || ''}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange({ ...p, weightKg: units === 'imperial' ? lbsToKg(v) : v });
            }}
          />
        </label>
        {units === 'imperial' ? (
          <>
            <label className="field">
              <span>Height (ft)</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={8}
                value={feet || ''}
                onChange={(e) => onChange({ ...p, heightCm: feetInchesToCm(Number(e.target.value), inches) })}
              />
            </label>
            <label className="field">
              <span>(in)</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={11}
                value={inches}
                onChange={(e) => onChange({ ...p, heightCm: feetInchesToCm(feet, Number(e.target.value)) })}
              />
            </label>
          </>
        ) : (
          <label className="field">
            <span>Height (cm)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={Math.round(p.heightCm) || ''}
              onChange={(e) => onChange({ ...p, heightCm: Number(e.target.value) })}
            />
          </label>
        )}
      </div>

      <label className="field">
        <span>Activity level</span>
        <select value={p.activity} onChange={(e) => onChange({ ...p, activity: e.target.value as Activity })}>
          {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
            <option key={a} value={a}>
              {ACTIVITY_LABELS[a]}
            </option>
          ))}
        </select>
      </label>

      <div className="field">
        <span>Goal</span>
        <div className="seg">
          {(Object.keys(GOAL_LABELS) as GoalType[]).map((gt) => (
            <button key={gt} className={p.goal === gt ? 'active' : ''} onClick={() => onChange({ ...p, goal: gt })}>
              {GOAL_LABELS[gt]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
