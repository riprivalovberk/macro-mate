import { useEffect, useMemo, useState } from 'react';
import { totalsByDate } from '../lib/db';
import { lastNDays, monthGrid, todayKey } from '../lib/dates';
import { useSettings } from '../lib/settings';
import type { MacroSet } from '../types';

interface HistoryProps {
  onSelectDate: (d: string) => void;
}

export function History({ onSelectDate }: HistoryProps) {
  const [view, setView] = useState<'calendar' | 'trends'>('calendar');
  return (
    <div className="page">
      <div className="day-nav">
        <h1>History</h1>
      </div>
      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
          Calendar
        </button>
        <button className={view === 'trends' ? 'active' : ''} onClick={() => setView('trends')}>
          Trends
        </button>
      </div>
      {view === 'calendar' ? <Calendar onSelectDate={onSelectDate} /> : <Trends />}
    </div>
  );
}

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function Calendar({ onSelectDate }: { onSelectDate: (d: string) => void }) {
  const settings = useSettings();
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const grid = useMemo(() => monthGrid(ym.year, ym.month), [ym]);
  const [data, setData] = useState<Map<string, MacroSet>>(new Map());

  useEffect(() => {
    const days = grid.weeks.flat().filter((d): d is string => d !== null);
    totalsByDate(days).then(setData);
  }, [grid]);

  const goal = settings.goals.kcal;
  const today = todayKey();

  function dotColor(kcal: number): string {
    if (goal <= 0) return 'var(--kcal)';
    const ratio = kcal / goal;
    if (ratio > 1.1) return 'var(--danger)';
    if (ratio >= 0.85) return 'var(--carbs)';
    return 'var(--kcal)';
  }

  return (
    <div className="card">
      <div className="cal-head">
        <button
          aria-label="Previous month"
          onClick={() => setYm(({ year, month }) => (month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }))}
          style={{ color: 'var(--accent)', fontSize: 18, padding: '4px 10px' }}
        >
          ‹
        </button>
        <span className="cal-label">{grid.label}</span>
        <button
          aria-label="Next month"
          onClick={() => setYm(({ year, month }) => (month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }))}
          style={{ color: 'var(--accent)', fontSize: 18, padding: '4px 10px' }}
        >
          ›
        </button>
      </div>
      <div className="cal-grid">
        {DOW.map((d, i) => (
          <div className="cal-dow" key={i}>
            {d}
          </div>
        ))}
        {grid.weeks.flat().map((day, i) => {
          if (!day) return <div key={i} />;
          const t = data.get(day);
          return (
            <button
              key={day}
              className={`cal-day ${t ? 'has-data' : ''} ${day === today ? 'today' : ''}`}
              onClick={() => onSelectDate(day)}
            >
              <span>{Number(day.slice(8))}</span>
              {t && <span className="dot" style={{ background: dotColor(t.kcal) }} />}
            </button>
          );
        })}
      </div>
      <div className="chart-legend" style={{ marginTop: 12 }}>
        <span className="lg">
          <span className="sw" style={{ background: 'var(--carbs)' }} /> near goal
        </span>
        <span className="lg">
          <span className="sw" style={{ background: 'var(--kcal)' }} /> under
        </span>
        <span className="lg">
          <span className="sw" style={{ background: 'var(--danger)' }} /> over
        </span>
      </div>
    </div>
  );
}

function Trends() {
  const settings = useSettings();
  const [range, setRange] = useState<7 | 30>(7);
  const days = useMemo(() => lastNDays(range, todayKey()), [range]);
  const [data, setData] = useState<Map<string, MacroSet>>(new Map());

  useEffect(() => {
    totalsByDate(days).then(setData);
  }, [days]);

  const series = days.map((d) => ({ day: d, t: data.get(d) }));
  const logged = series.filter((s) => s.t);
  const avg = (key: keyof MacroSet) =>
    logged.length ? Math.round(logged.reduce((s, x) => s + (x.t?.[key] ?? 0), 0) / logged.length) : 0;

  const goal = settings.goals.kcal;
  const maxKcal = Math.max(goal, ...series.map((s) => s.t?.kcal ?? 0)) * 1.1 || 1;

  const W = 320;
  const H = 150;
  const barW = (W / series.length) * 0.7;
  const gap = W / series.length;
  const goalY = H - (goal / maxKcal) * H;

  return (
    <>
      <div className="card">
        <div className="seg" style={{ marginBottom: 14 }}>
          <button className={range === 7 ? 'active' : ''} onClick={() => setRange(7)}>
            7 days
          </button>
          <button className={range === 30 ? 'active' : ''} onClick={() => setRange(30)}>
            30 days
          </button>
        </div>
        <div className="chart-wrap">
          <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" role="img" aria-label="Calories per day">
            {series.map((s, i) => {
              const kcal = s.t?.kcal ?? 0;
              const h = (kcal / maxKcal) * H;
              const over = goal > 0 && kcal > goal;
              return (
                <rect
                  key={s.day}
                  x={i * gap + (gap - barW) / 2}
                  y={H - h}
                  width={barW}
                  height={Math.max(h, kcal > 0 ? 2 : 0)}
                  rx={3}
                  fill={over ? 'var(--danger)' : 'var(--kcal)'}
                  opacity={0.9}
                />
              );
            })}
            {goal > 0 && (
              <line x1={0} x2={W} y1={goalY} y2={goalY} stroke="var(--accent)" strokeDasharray="5 4" strokeWidth={1.5} />
            )}
            {series.map((s, i) =>
              range === 7 || i % 5 === 0 ? (
                <text
                  key={`l${s.day}`}
                  x={i * gap + gap / 2}
                  y={H + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--text-dim)"
                >
                  {Number(s.day.slice(8))}
                </text>
              ) : null,
            )}
          </svg>
          <div className="chart-legend">
            <span className="lg">
              <span className="sw" style={{ background: 'var(--kcal)' }} /> calories
            </span>
            <span className="lg">
              <span className="sw" style={{ background: 'var(--accent)' }} /> goal ({goal})
            </span>
          </div>
        </div>
      </div>

      <div className="section-title">Daily averages (days you logged)</div>
      <div className="card">
        <table className="avg-table">
          <tbody>
            <tr>
              <td>Calories</td>
              <td>{avg('kcal')} kcal</td>
            </tr>
            <tr>
              <td>Protein</td>
              <td>{avg('protein')} g</td>
            </tr>
            <tr>
              <td>Carbs</td>
              <td>{avg('carbs')} g</td>
            </tr>
            <tr>
              <td>Fat</td>
              <td>{avg('fat')} g</td>
            </tr>
            <tr>
              <td>Fiber</td>
              <td>{avg('fiber')} g</td>
            </tr>
            <tr>
              <td>Sugar</td>
              <td>{avg('sugar')} g</td>
            </tr>
            <tr>
              <td>Sodium</td>
              <td>{avg('sodium')} mg</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
