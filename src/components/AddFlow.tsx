import { useEffect, useRef, useState } from 'react';
import { analyzeFood } from '../lib/ai';
import { addEntry, quickFoods, type QuickFood } from '../lib/db';
import { fileToEncodedImage, type EncodedImage } from '../lib/image';
import { useSettings } from '../lib/settings';
import { MEAL_LABELS, MEALS, type Analysis, type Meal } from '../types';
import { ItemFields, type EditableFood } from './ItemFields';
import { Sheet } from './Sheet';

type Step = 'choose' | 'photo-confirm' | 'describe' | 'analyzing' | 'review' | 'manual';

interface AddFlowProps {
  date: string;
  initialMeal: Meal;
  onClose: () => void;
  onSaved: () => void;
}

const BLANK_ITEM: EditableFood = {
  name: '',
  emoji: '🍽️',
  portion: '',
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
};

export function AddFlow({ date, initialMeal, onClose, onSaved }: AddFlowProps) {
  const settings = useSettings();
  const [step, setStep] = useState<Step>('choose');
  const [meal, setMeal] = useState<Meal>(initialMeal);
  const [error, setError] = useState('');
  const [image, setImage] = useState<EncodedImage | null>(null);
  const [preview, setPreview] = useState('');
  const [hint, setHint] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<EditableFood[]>([]);
  const [notes, setNotes] = useState('');
  const [quick, setQuick] = useState<QuickFood[]>([]);
  const [savedFlash, setSavedFlash] = useState('');

  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    quickFoods(12).then(setQuick);
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError('');
    try {
      const encoded = await fileToEncodedImage(file);
      setImage(encoded);
      setPreview(`data:image/jpeg;base64,${encoded.data}`);
      setStep('photo-confirm');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    }
  }

  async function runAnalysis(input: { images?: EncodedImage[]; text?: string }) {
    setStep('analyzing');
    setError('');
    try {
      const analysis: Analysis = await analyzeFood({
        apiKey: settings.apiKey,
        model: settings.model,
        ...input,
      });
      if (analysis.items.length === 0) {
        setError(analysis.notes || 'No food was recognized. Try again or enter it manually.');
        setStep('choose');
        return;
      }
      setItems(analysis.items);
      setNotes(analysis.notes);
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed.');
      setStep('choose');
    }
  }

  async function saveItems(toSave: EditableFood[]) {
    const valid = toSave.filter((i) => i.name.trim());
    if (valid.length === 0) {
      setError('Give the food a name first.');
      return;
    }
    const now = Date.now();
    for (const it of valid) {
      await addEntry({
        date,
        meal,
        name: it.name.trim(),
        emoji: it.emoji || '🍽️',
        portion: it.portion,
        kcal: it.kcal,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
        fiber: it.fiber,
        sugar: it.sugar,
        sodium: it.sodium,
        createdAt: now,
      });
    }
    onSaved();
    onClose();
  }

  async function quickAdd(food: QuickFood) {
    await addEntry({
      date,
      meal,
      name: food.name,
      emoji: food.emoji,
      portion: food.portion,
      kcal: food.kcal,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      sugar: food.sugar,
      sodium: food.sodium,
      createdAt: Date.now(),
    });
    onSaved();
    setSavedFlash(`${food.emoji} ${food.name} added to ${MEAL_LABELS[meal]}`);
    setTimeout(() => setSavedFlash(''), 1800);
  }

  const mealPicker = (
    <div className="seg" style={{ marginBottom: 14 }}>
      {MEALS.map((m) => (
        <button key={m} className={m === meal ? 'active' : ''} onClick={() => setMeal(m)}>
          {MEAL_LABELS[m]}
        </button>
      ))}
    </div>
  );

  return (
    <Sheet onClose={onClose}>
      {/* hidden pickers: camera capture + photo library (covers screenshots) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {step === 'choose' && (
        <>
          <h2>Add food</h2>
          {mealPicker}
          {error && <div className="error-box">{error}</div>}
          {savedFlash && <div className="notes-box">{savedFlash}</div>}
          <div className="add-options">
            <button className="add-option" onClick={() => cameraRef.current?.click()}>
              <span className="ao-icon">📸</span>
              <span>
                <div className="ao-title">Take a photo</div>
                <div className="ao-sub">AI estimates the macros from your camera</div>
              </span>
            </button>
            <button className="add-option" onClick={() => libraryRef.current?.click()}>
              <span className="ao-icon">🖼️</span>
              <span>
                <div className="ao-title">Photo or screenshot</div>
                <div className="ao-sub">A saved photo, nutrition label, or macro screenshot</div>
              </span>
            </button>
            <button className="add-option" onClick={() => setStep('describe')}>
              <span className="ao-icon">✏️</span>
              <span>
                <div className="ao-title">Describe it</div>
                <div className="ao-sub">Type what you ate, AI estimates the rest</div>
              </span>
            </button>
            <button className="add-option" onClick={() => setStep('manual')}>
              <span className="ao-icon">🔢</span>
              <span>
                <div className="ao-title">Manual entry</div>
                <div className="ao-sub">Enter the numbers yourself</div>
              </span>
            </button>
          </div>

          {quick.length > 0 && (
            <>
              <div className="section-title">Frequent &amp; recent</div>
              <div className="quick-list">
                {quick.map((f) => (
                  <button key={f.name} className="quick-item" onClick={() => quickAdd(f)}>
                    <span className="qi-emoji">{f.emoji}</span>
                    <span className="qi-main">
                      <div className="qi-name">{f.name}</div>
                      <div className="qi-sub">
                        {Math.round(f.kcal)} kcal · P {Math.round(f.protein)} · C {Math.round(f.carbs)} · F{' '}
                        {Math.round(f.fat)}
                        {f.count > 1 ? ` · logged ${f.count}×` : ''}
                      </div>
                    </span>
                    <span style={{ color: 'var(--accent)', fontSize: 22, fontWeight: 600 }}>＋</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {step === 'photo-confirm' && (
        <>
          <h2>Ready to analyze</h2>
          {preview && (
            <img
              src={preview}
              alt="Selected food"
              style={{ width: '100%', borderRadius: 16, maxHeight: 280, objectFit: 'cover', marginBottom: 12 }}
            />
          )}
          <div className="field">
            <span>Optional details — portions, brands, what's hidden</span>
            <input
              value={hint}
              placeholder={'e.g. "the chicken is about 200 g"'}
              onChange={(e) => setHint(e.target.value)}
            />
          </div>
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep('choose')}>
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => runAnalysis({ images: image ? [image] : [], text: hint })}
            >
              Analyze ✨
            </button>
          </div>
        </>
      )}

      {step === 'describe' && (
        <>
          <h2>Describe your food</h2>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <textarea
              rows={3}
              value={description}
              placeholder={'e.g. "chicken burrito with guac and a side of chips"'}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep('choose')}>
              Back
            </button>
            <button
              className="btn btn-primary"
              disabled={!description.trim()}
              onClick={() => runAnalysis({ text: description })}
            >
              Analyze ✨
            </button>
          </div>
        </>
      )}

      {step === 'analyzing' && (
        <div className="analyzing">
          <div className="spinner" />
          <div>
            <div style={{ fontWeight: 700 }}>Estimating macros…</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
              Claude is looking at your food
            </div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <>
          <h2>Review &amp; save</h2>
          {mealPicker}
          {notes && <div className="notes-box">💡 {notes}</div>}
          {error && <div className="error-box">{error}</div>}
          {items.map((item, idx) => (
            <div className="review-item" key={idx}>
              <ItemFields
                item={item}
                onChange={(next) => setItems(items.map((it, i) => (i === idx ? next : it)))}
              />
              {items.length > 1 && (
                <button
                  className="btn btn-danger"
                  style={{ padding: '8px 0 0', fontSize: 13 }}
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                >
                  Remove item
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-primary" onClick={() => saveItems(items)}>
            Add to {MEAL_LABELS[meal]}
          </button>
        </>
      )}

      {step === 'manual' && (
        <>
          <h2>Manual entry</h2>
          {mealPicker}
          {error && <div className="error-box">{error}</div>}
          <ManualEntry onSave={(item) => saveItems([item])} mealLabel={MEAL_LABELS[meal]} />
        </>
      )}
    </Sheet>
  );
}

function ManualEntry({ onSave, mealLabel }: { onSave: (item: EditableFood) => void; mealLabel: string }) {
  const [item, setItem] = useState<EditableFood>({ ...BLANK_ITEM });
  return (
    <>
      <div className="review-item">
        <ItemFields item={item} onChange={setItem} />
      </div>
      <button className="btn btn-primary" disabled={!item.name.trim()} onClick={() => onSave(item)}>
        Add to {mealLabel}
      </button>
    </>
  );
}
