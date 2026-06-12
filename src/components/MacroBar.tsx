interface MacroBarProps {
  name: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
}

export function MacroBar({ name, value, goal, color, unit = 'g' }: MacroBarProps) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div className="macro-bar">
      <div className="mb-head">
        <span className="mb-name">{name}</span>
        <span className="mb-val">
          {Math.round(value)} / {goal} {unit}
        </span>
      </div>
      <div className="mb-track">
        <div className="mb-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
