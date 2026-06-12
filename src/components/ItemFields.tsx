import type { FoodItem } from '../types';

export type EditableFood = Omit<FoodItem, 'confidence'> & { confidence?: FoodItem['confidence'] };

interface ItemFieldsProps {
  item: EditableFood;
  onChange: (next: EditableFood) => void;
}

const NUM_FIELDS: { key: keyof EditableFood; label: string }[] = [
  { key: 'kcal', label: 'kcal' },
  { key: 'protein', label: 'Protein g' },
  { key: 'carbs', label: 'Carbs g' },
  { key: 'fat', label: 'Fat g' },
  { key: 'fiber', label: 'Fiber g' },
  { key: 'sugar', label: 'Sugar g' },
  { key: 'sodium', label: 'Sodium mg' },
];

/** Editable name/portion/macros block, shared by AI review, manual entry and entry editing. */
export function ItemFields({ item, onChange }: ItemFieldsProps) {
  const setNum = (key: keyof EditableFood, raw: string) => {
    const n = raw === '' ? 0 : Number(raw);
    onChange({ ...item, [key]: Number.isFinite(n) && n >= 0 ? n : 0 });
  };

  return (
    <div>
      <div className="ri-head">
        <span className="ri-emoji">{item.emoji || '🍽️'}</span>
        <input
          aria-label="Food name"
          value={item.name}
          placeholder="Food name"
          onChange={(e) => onChange({ ...item, name: e.target.value })}
        />
        {item.confidence && <span className={`confidence ${item.confidence}`}>{item.confidence}</span>}
      </div>
      <div className="field" style={{ marginBottom: 10 }}>
        <input
          aria-label="Portion"
          value={item.portion}
          placeholder="Portion (e.g. 1 bowl, 200 g)"
          onChange={(e) => onChange({ ...item, portion: e.target.value })}
        />
      </div>
      <div className="macro-grid">
        {NUM_FIELDS.map(({ key, label }) => (
          <label key={key}>
            {label}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              aria-label={label}
              value={String(item[key] ?? 0)}
              onChange={(e) => setNum(key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
