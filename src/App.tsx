import { useState } from 'react';
import { todayKey } from './lib/dates';
import { parseAddParams, type AddParams } from './lib/addparams';
import { useSettings } from './lib/settings';
import { History } from './pages/History';
import { Onboarding } from './pages/Onboarding';
import { SettingsPage } from './pages/Settings';
import { Today } from './pages/Today';

type Tab = 'today' | 'history' | 'settings';

function consumeAddParams(): AddParams | null {
  const params = parseAddParams(window.location.search);
  if (params) {
    // Remove ?add=... from the URL so a refresh doesn't re-trigger the flow.
    const clean = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', clean);
  }
  return params;
}

export default function App() {
  const settings = useSettings();
  const [tab, setTab] = useState<Tab>('today');
  const [date, setDate] = useState(todayKey());
  const [initialAdd] = useState<AddParams | null>(consumeAddParams);

  if (!settings.onboarded) return <Onboarding />;

  return (
    <>
      {tab === 'today' && <Today date={date} onDateChange={setDate} initialAdd={initialAdd} />}
      {tab === 'history' && (
        <History
          onSelectDate={(d) => {
            setDate(d);
            setTab('today');
          }}
        />
      )}
      {tab === 'settings' && <SettingsPage />}

      <nav className="tabbar">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
          <span className="tab-icon">🍽️</span>
          Today
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          <span className="tab-icon">📅</span>
          History
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          <span className="tab-icon">⚙️</span>
          Settings
        </button>
      </nav>
    </>
  );
}
