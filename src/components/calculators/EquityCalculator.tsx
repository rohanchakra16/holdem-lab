import { useState } from 'react';
import { parseCard } from '../../engine/cards';
import { equityVsRandomHands } from '../../math/equity';
import { Badge, Button, Panel } from '../common/ui';

export function EquityCalculator() {
  const [heroText, setHeroText] = useState('Ah Kh');
  const [boardText, setBoardText] = useState('');
  const [opponents, setOpponents] = useState(1);
  const [result, setResult] = useState<{ win: number; tie: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    try {
      const hero = heroText.trim().split(/\s+/).map(parseCard);
      const board = boardText.trim() ? boardText.trim().split(/\s+/).map(parseCard) : [];
      if (hero.length !== 2) throw new Error('Enter exactly 2 hero cards, e.g. "Ah Kh"');
      if (![0, 3, 4, 5].includes(board.length)) throw new Error('Board must have 0, 3, 4, or 5 cards');
      const r = equityVsRandomHands(hero, board, opponents, 4000);
      setResult({ win: r.winRate * 100, tie: r.tieRate * 100 });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input');
      setResult(null);
    }
  }

  return (
    <Panel title="Equity Calculator (Monte Carlo simulation)">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-sm text-sand-300">
          Hero cards
          <input className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500 font-mono" value={heroText} onChange={(e) => setHeroText(e.target.value)} placeholder="Ah Kh" />
        </label>
        <label className="text-sm text-sand-300">
          Board (optional)
          <input className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500 font-mono" value={boardText} onChange={(e) => setBoardText(e.target.value)} placeholder="e.g. 2c 7d Jh" />
        </label>
        <label className="text-sm text-sand-300">
          Opponents
          <input type="number" min={1} max={5} className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={opponents} onChange={(e) => setOpponents(Number(e.target.value))} />
        </label>
      </div>
      <Button className="mt-3" variant="primary" onClick={run}>
        Run simulation (4,000 trials)
      </Button>
      {error && <div className="mt-2 text-sm text-burgundy-400">{error}</div>}
      {result && (
        <div className="mt-3 flex items-center gap-3">
          <Badge tone="info">Simulation estimate</Badge>
          <div className="text-lg font-semibold text-felt-300">
            Win {result.win.toFixed(1)}% {result.tie > 0 && `· Tie ${result.tie.toFixed(1)}%`}
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-sand-500">
        This runs a real Monte Carlo simulation vs. random opponent hands — it is an estimate, not exact math, and will vary
        slightly on repeat runs.
      </p>
    </Panel>
  );
}
