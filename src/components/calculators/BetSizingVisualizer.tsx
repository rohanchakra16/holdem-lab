import { useState } from 'react';
import { betSizeFromPreset, stackToPotRatio } from '../../math/potOdds';
import { Panel } from '../common/ui';

const PRESETS = ['third', 'half', 'twoThirds', 'pot', 'allIn'] as const;
const PRESET_LABELS: Record<(typeof PRESETS)[number], string> = { third: '1/3 Pot', half: '1/2 Pot', twoThirds: '2/3 Pot', pot: 'Pot', allIn: 'All-in' };

export function BetSizingVisualizer() {
  const [pot, setPot] = useState(100);
  const [stack, setStack] = useState(400);

  return (
    <Panel title="Bet Sizing Visualiser">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-sand-300">
          Pot
          <input type="number" className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={pot} onChange={(e) => setPot(Number(e.target.value))} />
        </label>
        <label className="text-sm text-sand-300">
          Effective stack
          <input type="number" className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={stack} onChange={(e) => setStack(Number(e.target.value))} />
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {PRESETS.map((p) => {
          const amount = betSizeFromPreset(p, pot, stack);
          const widthPct = Math.min(100, (amount / (pot * 1.5)) * 100);
          return (
            <div key={p} className="flex items-center gap-3">
              <div className="w-16 text-xs text-sand-400">{PRESET_LABELS[p]}</div>
              <div className="flex-1 h-4 rounded bg-ink-800 overflow-hidden">
                <div className="h-full bg-felt-600" style={{ width: `${widthPct}%` }} />
              </div>
              <div className="w-16 text-right text-sm text-sand-200">{amount}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-sand-500">Stack-to-pot ratio (SPR): {stackToPotRatio(stack, pot).toFixed(1)}</div>
    </Panel>
  );
}
