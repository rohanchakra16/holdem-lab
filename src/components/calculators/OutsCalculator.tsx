import { useState } from 'react';
import { exactOutsEquity, ruleOfTwoAndFour } from '../../math/outs';
import { Panel } from '../common/ui';

export function OutsCalculator() {
  const [outs, setOuts] = useState(9);
  const [street, setStreet] = useState<'flop' | 'turn'>('flop');
  const cardsToCome = street === 'flop' ? 2 : 1;
  const unseen = street === 'flop' ? 47 : 46;
  const exact = exactOutsEquity(Math.min(outs, unseen), unseen, cardsToCome) * 100;
  const approx = ruleOfTwoAndFour(outs, cardsToCome);

  return (
    <Panel title="Outs Calculator">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-sand-300">
          Outs
          <input type="number" min={0} max={47} className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={outs} onChange={(e) => setOuts(Number(e.target.value))} />
        </label>
        <label className="text-sm text-sand-300">
          Street
          <select className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={street} onChange={(e) => setStreet(e.target.value as 'flop' | 'turn')}>
            <option value="flop">On the flop (2 cards to come)</option>
            <option value="turn">On the turn (1 card to come)</option>
          </select>
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[var(--radius-sm)] bg-ink-800/60 p-3">
          <div className="text-xs text-sand-500">Rule of {cardsToCome === 2 ? 4 : 2} (approximation)</div>
          <div className="text-lg font-semibold text-brass-300">{approx.toFixed(0)}%</div>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-ink-800/60 p-3">
          <div className="text-xs text-sand-500">Exact (hypergeometric)</div>
          <div className="text-lg font-semibold text-felt-300">{exact.toFixed(1)}%</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-sand-500">
        Exact formula: 1 − C(unseen−outs, cardsToCome) / C(unseen, cardsToCome), with {unseen} unseen cards.
      </p>
    </Panel>
  );
}
