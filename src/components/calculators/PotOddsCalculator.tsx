import { useState } from 'react';
import { requiredEquityToCall, potOddsRatio } from '../../math/potOdds';
import { Panel } from '../common/ui';

export function PotOddsCalculator() {
  const [pot, setPot] = useState(100);
  const [call, setCall] = useState(50);
  const required = requiredEquityToCall(pot, call);
  const ratio = potOddsRatio(pot, call);

  return (
    <Panel title="Pot Odds Calculator">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-sand-300">
          Pot before your call
          <input type="number" className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={pot} onChange={(e) => setPot(Number(e.target.value))} />
        </label>
        <label className="text-sm text-sand-300">
          Amount to call
          <input type="number" className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={call} onChange={(e) => setCall(Number(e.target.value))} />
        </label>
      </div>
      <div className="mt-4 rounded-[var(--radius-sm)] bg-ink-800/60 p-3 text-sm">
        <div className="text-sand-400">Formula: required equity = call ÷ (pot + call)</div>
        <div className="text-sand-400">
          = {call} ÷ ({pot} + {call}) = {call} ÷ {pot + call}
        </div>
        <div className="mt-2 text-lg font-semibold text-felt-300">{(required * 100).toFixed(1)}% required equity</div>
        <div className="text-sand-500 text-xs mt-1">Expressed as odds: {Number.isFinite(ratio.potToOne) ? `${ratio.potToOne.toFixed(2)} : 1` : '—'}</div>
      </div>
    </Panel>
  );
}
