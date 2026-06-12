interface RingProps {
  value: number;
  goal: number;
  size?: number;
  label?: string;
}

/** Calorie progress ring. Turns red when over goal. */
export function Ring({ value, goal, size = 140, label = 'kcal' }: RingProps) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = goal > 0 && value > goal;
  const remaining = Math.round(goal - value);

  return (
    <div className="ring-wrap" style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} role="img" aria-label={`${Math.round(value)} of ${goal} ${label}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? 'var(--danger)' : 'var(--kcal)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.2,0.8,0.2,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(value)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>/ {goal} {label}</div>
        <div style={{ fontSize: 11, color: over ? 'var(--danger)' : 'var(--text-dim)', marginTop: 2 }}>
          {over ? `${-remaining} over` : `${remaining} left`}
        </div>
      </div>
    </div>
  );
}
