import { useState } from 'react';
import { evOfCall, evOfBet } from '../../math/ev';
import { Panel } from '../common/ui';

export function EvCalculator() {
  const [mode, setMode] = useState<'call' | 'bet'>('call');
  const [pot, setPot] = useState(100);
  const [amount, setAmount] = useState(50);
  const [winPct, setWinPct] = useState(40);
  const [foldPct, setFoldPct] = useState(40);

  const evCall = evOfCall({ potBeforeCall: pot, callAmount: amount, winProbability: winPct / 100 });
  const evBet = evOfBet({ potBeforeBet: pot, betAmount: amount, foldProbability: foldPct / 100, winProbabilityIfCalled: winPct / 100 });

  return (
    <Panel title="Expected Value Calculator">
      <div className="flex gap-2 mb-3">
        <button onClick={() => setMode('call')} className={`rounded-[var(--radius-xs)] px-3 py-1.5 text-sm transition-colors ${mode === 'call' ? 'bg-felt-600 text-ivory-100' : 'bg-ink-800 text-sand-400 hover:text-sand-200'}`}>
          EV of Calling
        </button>
        <button onClick={() => setMode('bet')} className={`rounded-[var(--radius-xs)] px-3 py-1.5 text-sm transition-colors ${mode === 'bet' ? 'bg-felt-600 text-ivory-100' : 'bg-ink-800 text-sand-400 hover:text-sand-200'}`}>
          EV of Betting
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="text-sm text-sand-300">
          Pot before
          <input type="number" className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={pot} onChange={(e) => setPot(Number(e.target.value))} />
        </label>
        <label className="text-sm text-sand-300">
          {mode === 'call' ? 'Call amount' : 'Bet amount'}
          <input type="number" className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </label>
        <label className="text-sm text-sand-300">
          Win % {mode === 'bet' && 'if called'}
          <input type="number" className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={winPct} onChange={(e) => setWinPct(Number(e.target.value))} />
        </label>
        {mode === 'bet' && (
          <label className="text-sm text-sand-300">
            Fold %
            <input type="number" className="mt-1 w-full rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-2 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500" value={foldPct} onChange={(e) => setFoldPct(Number(e.target.value))} />
          </label>
        )}
      </div>
      <div className="mt-4 rounded-[var(--radius-sm)] bg-ink-800/60 p-3 text-sm">
        {mode === 'call' ? (
          <>
            <div className="text-sand-400">EV(call) = win% × (pot + call) − call</div>
            <div className="text-sand-400">
              = {(winPct / 100).toFixed(2)} × {pot + amount} − {amount}
            </div>
          </>
        ) : (
          <>
            <div className="text-sand-400">EV(bet) = fold%×pot + (1−fold%)×[win%×(pot+2×bet) − (1−win%)×bet]</div>
          </>
        )}
        <div className="mt-2 text-lg font-semibold text-felt-300">{(mode === 'call' ? evCall : evBet).toFixed(1)} chips</div>
      </div>
    </Panel>
  );
}
