import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { AddFlow } from '../components/AddFlow';
import { ItemFields, type EditableFood } from '../components/ItemFields';
import { MacroBar } from '../components/MacroBar';
import { Ring } from '../components/Ring';
import { Sheet } from '../components/Sheet';
import { deleteEntry, entriesForDate, totals, updateEntry } from '../lib/db';
import { addDays, friendlyDate, todayKey } from '../lib/dates';
import { useSettings } from '../lib/settings';
import { MEAL_LABELS, MEALS, type Entry, type Meal } from '../types';

function defaultMealForNow(): Meal {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 17) return 'snacks';
  return 'dinner';
}

interface TodayProps {
  date: string;
  onDateChange: (d: string) => void;
}

export function Today({ date, onDateChange }: TodayProps) {
  const settings = useSettings();
  const entries = useLiveQuery(() => entriesForDate(date), [date]) ?? [];
  const [adding, setAdding] = useState<Meal | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);

  const t = totals(entries);
  const g = settings.goals;
  const byMeal = new Map<Meal, Entry[]>(MEALS.map((m) => [m, []]));
  for (const e of entries) byMeal.get(e.meal)?.push(e);

  return (
    <div className="page">
      <div className="day-nav">
        <button aria-label="Previous day" onClick={() => onDateChange(addDays(date, -1))}>
          ‹
        </button>
        <h1 onClick={() => onDateChange(todayKey())}>{friendlyDate(date)}</h1>
        <button
          aria-label="Next day"
          disabled={date >= todayKey()}
          onClick={() => onDateChange(addDays(date, 1))}
        >
          ›
        </button>
      </div>

      <div className="card">
        <div className="summary">
          <Ring value={t.kcal} goal={g.kcal} />
          <div className="bars">
            <MacroBar name="Protein" value={t.protein} goal={g.protein} color="var(--protein)" />
            <MacroBar name="Carbs" value={t.carbs} goal={g.carbs} color="var(--carbs)" />
            <MacroBar name="Fat" value={t.fat} goal={g.fat} color="var(--fat)" />
          </div>
        </div>
        <div className="micro-row">
          <div className="micro-chip">
            <div className="label">Fiber</div>
            <div className="val">
              {Math.round(t.fiber)}<small style={{ color: 'var(--text-dim)', fontWeight: 400 }}>/{g.fiber}g</small>
            </div>
          </div>
          <div className={`micro-chip ${t.sugar > g.sugar ? 'over' : ''}`}>
            <div className="label">Sugar</div>
            <div className="val">
              {Math.round(t.sugar)}<small style={{ color: 'var(--text-dim)', fontWeight: 400 }}>/{g.sugar}g</small>
            </div>
          </div>
          <div className={`micro-chip ${t.sodium > g.sodium ? 'over' : ''}`}>
            <div className="label">Sodium</div>
            <div className="val">
              {Math.round(t.sodium)}
              <small style={{ color: 'var(--text-dim)', fontWeight: 400 }}>/{g.sodium}mg</small>
            </div>
          </div>
        </div>
      </div>

      {MEALS.map((m) => {
        const mealEntries = byMeal.get(m) ?? [];
        const mealKcal = Math.round(mealEntries.reduce((s, e) => s + e.kcal, 0));
        return (
          <div className="card" key={m}>
            <div className="meal-head">
              <span className="meal-name">{MEAL_LABELS[m]}</span>
              {mealEntries.length > 0 && <span className="meal-kcal">{mealKcal} kcal</span>}
            </div>
            {mealEntries.length === 0 && <div className="empty-meal">Nothing logged yet</div>}
            {mealEntries.map((e) => (
              <button className="entry" key={e.id} onClick={() => setEditing(e)}>
                <span className="e-emoji">{e.emoji}</span>
                <span className="e-main">
                  <div className="e-name">{e.name}</div>
                  <div className="e-sub">
                    {e.portion ? `${e.portion} · ` : ''}P {Math.round(e.protein)} · C {Math.round(e.carbs)} · F{' '}
                    {Math.round(e.fat)}
                  </div>
                </span>
                <span className="e-kcal">
                  {Math.round(e.kcal)} <small>kcal</small>
                </span>
              </button>
            ))}
            <button className="meal-add" onClick={() => setAdding(m)}>
              ＋ Add food
            </button>
          </div>
        );
      })}

      <button className="fab" aria-label="Add food" onClick={() => setAdding(defaultMealForNow())}>
        ＋
      </button>

      {adding && (
        <AddFlow date={date} initialMeal={adding} onClose={() => setAdding(null)} onSaved={() => {}} />
      )}

      {editing && <EditEntrySheet entry={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditEntrySheet({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const [item, setItem] = useState<EditableFood>({
    name: entry.name,
    emoji: entry.emoji,
    portion: entry.portion,
    kcal: entry.kcal,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    fiber: entry.fiber,
    sugar: entry.sugar,
    sodium: entry.sodium,
  });
  const [meal, setMeal] = useState<Meal>(entry.meal);

  async function save() {
    const { confidence: _confidence, ...fields } = item;
    await updateEntry(entry.id!, { ...fields, name: item.name.trim() || entry.name, meal });
    onClose();
  }

  async function remove() {
    await deleteEntry(entry.id!);
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      <h2>Edit food</h2>
      <div className="seg" style={{ marginBottom: 14 }}>
        {MEALS.map((m) => (
          <button key={m} className={m === meal ? 'active' : ''} onClick={() => setMeal(m)}>
            {MEAL_LABELS[m]}
          </button>
        ))}
      </div>
      <div className="review-item">
        <ItemFields item={item} onChange={setItem} />
      </div>
      <button className="btn btn-primary" onClick={save}>
        Save changes
      </button>
      <button className="btn btn-danger" style={{ marginTop: 8 }} onClick={remove}>
        Delete entry
      </button>
    </Sheet>
  );
}
