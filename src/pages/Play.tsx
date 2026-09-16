import { useState } from 'react';
import { useTableStore, DEFAULT_SETTINGS, TableSettings, CoachingLevel, GameMode } from '../state/tableStore';
import { BotPersonality } from '../engine/types';
import { Button, Panel } from '../components/common/ui';
import { PageHeading } from '../components/common/PageHeading';
import PokerTable from '../components/table/PokerTable';

const PERSONALITY_LABELS: Record<BotPersonality, string> = {
  'tight-passive': 'Tight-Passive (Beginner)',
  'loose-passive': 'Loose-Passive (Caller)',
  'tight-aggressive': 'Tight-Aggressive (Reg)',
  'loose-aggressive': 'Loose-Aggressive',
  'balanced-advanced': 'Balanced (Advanced)',
};

const fieldClass = 'rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 text-[13.5px] text-sand-200 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500';
const labelClass = 'flex flex-col gap-1.5 text-[12.5px] font-medium text-sand-400';

function SetupForm() {
  const [settings, setSettings] = useState<TableSettings>(DEFAULT_SETTINGS);
  const startSession = useTableStore((s) => s.startSession);

  function update<K extends keyof TableSettings>(key: K, value: TableSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-8">
      <PageHeading
        title="Play"
        subtitle="Full No-Limit Hold’em against computer opponents — fictional chips only. Choose Guided Play for step-by-step feedback, or Free Play for uninterrupted sessions."
      />

      <Panel className="mt-6" title="Session setup">
        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Mode
            <select className={fieldClass} value={settings.mode} onChange={(e) => update('mode', e.target.value as GameMode)}>
              <option value="guided">Guided Play (pauses for feedback)</option>
              <option value="free">Free Play (uninterrupted)</option>
            </select>
          </label>
          <label className={labelClass}>
            Table size
            <select className={fieldClass} value={settings.numPlayers} onChange={(e) => update('numPlayers', Number(e.target.value))}>
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n === 2 ? 'Heads-up (2)' : `${n}-handed`}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Starting stack (big blinds)
            <input
              type="number"
              min={10}
              max={500}
              className={fieldClass}
              value={settings.startingStack}
              onChange={(e) => update('startingStack', Number(e.target.value))}
            />
          </label>
          <label className={labelClass}>
            Blinds (SB / BB)
            <div className="flex gap-2">
              <input type="number" min={1} className={`${fieldClass} w-full`} value={settings.smallBlind} onChange={(e) => update('smallBlind', Number(e.target.value))} />
              <input type="number" min={1} className={`${fieldClass} w-full`} value={settings.bigBlind} onChange={(e) => update('bigBlind', Number(e.target.value))} />
            </div>
          </label>
          <label className={labelClass}>
            Coaching level
            <select className={fieldClass} value={settings.coachingLevel} onChange={(e) => update('coachingLevel', e.target.value as CoachingLevel)}>
              <option value="full">Full coaching every decision</option>
              <option value="important">Only important decisions / errors</option>
              <option value="none">No coaching until hand ends</option>
            </select>
          </label>
          <label className={labelClass}>
            Game speed
            <select className={fieldClass} value={settings.gameSpeedMs} onChange={(e) => update('gameSpeedMs', Number(e.target.value))}>
              <option value={1800}>Slow</option>
              <option value={900}>Normal</option>
              <option value={300}>Fast</option>
            </select>
          </label>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-[12.5px] font-medium text-sand-400">Bot personalities (assigned in order, repeating if fewer than seats)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {settings.botPersonalities.slice(0, settings.numPlayers - 1).map((p, i) => (
              <select
                key={i}
                className={`${fieldClass} text-[13px]`}
                value={p}
                onChange={(e) => {
                  const next = [...settings.botPersonalities];
                  next[i] = e.target.value as BotPersonality;
                  update('botPersonalities', next);
                }}
              >
                {Object.entries(PERSONALITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    Seat {i + 1}: {label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={() => startSession(settings)}>
            Start Session
          </Button>
        </div>
      </Panel>
    </div>
  );
}

export default function Play() {
  const engine = useTableStore((s) => s.engine);
  if (!engine) return <SetupForm />;
  return <PokerTable />;
}
