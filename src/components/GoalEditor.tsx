import type { Goals } from '../types';

interface GoalEditorProps {
  goals: Goals;
  onChange: (g: Goals) => void;
}

const FIELDS: { key: keyof Goals; label: string }[] = [
  { key: 'kcal', label: 'Calories (kcal)' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'carbs', label: 'Carbs (g)' },
  { key: 'fat', label: 'Fat (g)' },
  { key: 'fiber', label: 'Fiber (g)' },
  { key: 'sugar', label: 'Sugar limit (g)' },
  { key: 'sodium', label: 'Sodium limit (mg)' },
];

export function GoalEditor({ goals, onChange }: GoalEditorProps) {
  return (
    <div className="goal-grid">
      {FIELDS.map(({ key, label }) => (
        <label className="field" key={key} style={{ marginBottom: 4 }}>
          <span>{label}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={goals[key] || ''}
            onChange={(e) => {
              const n = Number(e.target.value);
              onChange({ ...goals, [key]: Number.isFinite(n) && n >= 0 ? Math.round(n) : 0 });
            }}
          />
        </label>
      ))}
    </div>
  );
}
