import { useState } from 'react';
import { combinations } from '../../math/combinatorics';
import { Panel } from '../common/ui';

export function CombinationsCalculator() {
  const [n, setN] = useState(52);
  const [k, setK] = useState(5);
  const result = combinations(n, k);

  return (
    <Panel title="Combination Calculator (n choose k)">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-sand-300">
          n
          <input type="number" className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <label className="text-sm text-sand-300">
          k
          <input type="number" className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={k} onChange={(e) => setK(Number(e.target.value))} />
        </label>
      </div>
      <div className="mt-4 rounded-[var(--radius-sm)] bg-ink-800/60 p-3 text-sm">
        <div className="text-sand-400">
          C(n, k) = n! / (k! × (n−k)!)
        </div>
        <div className="mt-2 text-lg font-semibold text-felt-300">{result.toLocaleString()} combinations</div>
      </div>
      <p className="mt-3 text-xs text-sand-500">
        Quick references: C(52,5) = 2,598,960 total 5-card hands · C(4,2) = 6 combos of a specific pocket pair · 4×4 = 16
        combos of a specific unpaired two-card hand.
      </p>
    </Panel>
  );
}
