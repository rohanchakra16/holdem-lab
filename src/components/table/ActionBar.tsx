import { useEffect, useMemo, useState } from 'react';
import { LegalActions, PlayerAction } from '../../engine/types';
import { Button } from '../common/ui';
import { Icon } from '../common/NavIcons';
import { betSizeFromPreset } from '../../math/potOdds';
import type { ActionSuggestion } from '../../training/coach';

interface Props {
  legal: LegalActions;
  pot: number;
  currentBet: number;
  effectiveStack: number;
  onAct: (action: PlayerAction, reasoning: string) => void;
  advisorEnabled?: boolean;
  advisorRevealed?: boolean;
  advisorSuggestion?: ActionSuggestion | null;
  onRevealAdvisor?: () => void;
}

export function ActionBar({
  legal,
  pot,
  currentBet,
  effectiveStack,
  onAct,
  advisorEnabled = false,
  advisorRevealed = false,
  advisorSuggestion = null,
  onRevealAdvisor,
}: Props) {
  const [customAmount, setCustomAmount] = useState<number>(legal.minRaiseTo);
  const [reasoning, setReasoning] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);
  const [staged, setStaged] = useState<PlayerAction | null>(null);

  useEffect(() => {
    setCustomAmount(legal.minRaiseTo);
  }, [legal.minRaiseTo]);

  const presets = useMemo(
    () =>
      (['third', 'half', 'twoThirds', 'pot'] as const).map((p) => ({
        key: p,
        label: p === 'third' ? '1/3 Pot' : p === 'half' ? '1/2 Pot' : p === 'twoThirds' ? '2/3 Pot' : 'Pot',
        amount: currentBet + betSizeFromPreset(p, pot, effectiveStack),
      })),
    [pot, effectiveStack, currentBet]
  );

  function confirm(action: PlayerAction) {
    if (showReasoning) {
      setStaged(action);
    } else {
      onAct(action, '');
    }
  }

  function confirmWithReasoning() {
    if (staged) {
      onAct(staged, reasoning);
      setStaged(null);
      setReasoning('');
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (staged) return;
      if ((e.key === 'f' || e.key === 'F') && legal.canFold) confirm({ type: 'fold' });
      if (e.key === 'c' || e.key === 'C') {
        if (legal.canCheck) confirm({ type: 'check' });
        else if (legal.canCall) confirm({ type: 'call' });
      }
      if ((e.key === 'r' || e.key === 'R') && legal.canBetOrRaise) {
        confirm({ type: legal.raiseIsAllInOnly ? 'all-in' : 'raise', amount: legal.raiseIsAllInOnly ? undefined : Math.max(legal.minRaiseTo, customAmount) });
      }
      if ((e.key === 'a' || e.key === 'A') && legal.canBetOrRaise) confirm({ type: 'all-in' });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legal, staged, customAmount, showReasoning]);

  if (staged) {
    return (
      <div className="rounded-[var(--radius-md)] bg-ink-850 p-4 ring-1 ring-felt-600/30">
        <div className="text-[13.5px] text-sand-300 mb-2">
          About to <span className="font-semibold text-felt-300">{staged.type}</span>
          {staged.amount ? ` to ${staged.amount}` : ''}. Explain your reasoning (optional):
        </div>
        <textarea
          className="w-full rounded-[var(--radius-sm)] bg-ink-800 p-2.5 text-[13.5px] text-sand-200 outline-none ring-1 ring-ink-700 focus:ring-felt-500"
          rows={2}
          placeholder="e.g. I have a flush draw and good pot odds..."
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
        />
        <div className="mt-2.5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setStaged(null)}>
            Back
          </Button>
          <Button variant="primary" onClick={confirmWithReasoning}>
            Confirm & see feedback
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-md)] bg-ink-850 p-4">
      {advisorEnabled && (
        <div className="mb-3">
          {!advisorRevealed ? (
            <button
              onClick={onRevealAdvisor}
              className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-brass-500/10 px-3 py-2 text-[12.5px] font-medium text-brass-400 ring-1 ring-brass-500/25 hover:bg-brass-500/20"
            >
              <Icon name="reference" size={14} />
              Reveal suggested move (heuristic)
            </button>
          ) : advisorSuggestion ? (
            <div className="rounded-[var(--radius-sm)] bg-brass-500/10 p-3 ring-1 ring-brass-500/25">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brass-400">
                <Icon name="reference" size={13} />
                Suggested: {advisorSuggestion.label}
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand-300">{advisorSuggestion.reasoning}</p>
              <p className="mt-1.5 text-[10.5px] text-sand-600">
                A simple pot-odds/equity heuristic, not a solver — it can't see implied odds, opponent tendencies, or multi-street plans.
              </p>
            </div>
          ) : null}
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11.5px] text-sand-600">
          Keyboard: <kbd className="tabular rounded bg-ink-800 px-1">F</kbd> fold · <kbd className="rounded bg-ink-800 px-1">C</kbd> check/call ·{' '}
          <kbd className="rounded bg-ink-800 px-1">R</kbd> raise · <kbd className="rounded bg-ink-800 px-1">A</kbd> all-in
        </div>
        <label className="flex items-center gap-1.5 text-[11.5px] text-sand-500">
          <input type="checkbox" checked={showReasoning} onChange={(e) => setShowReasoning(e.target.checked)} />
          Explain my reasoning before feedback
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="danger" disabled={!legal.canFold} onClick={() => confirm({ type: 'fold' })}>
          Fold
        </Button>
        {legal.canCheck ? (
          <Button variant="secondary" onClick={() => confirm({ type: 'check' })}>
            Check
          </Button>
        ) : (
          <Button variant="secondary" disabled={!legal.canCall} onClick={() => confirm({ type: 'call' })}>
            Call {legal.callAmount}
          </Button>
        )}
        {legal.canBetOrRaise && legal.raiseIsAllInOnly && (
          <Button variant="brass" onClick={() => confirm({ type: 'all-in' })}>
            All-in {legal.maxRaiseTo}
          </Button>
        )}
      </div>

      {legal.canBetOrRaise && !legal.raiseIsAllInOnly && (
        <div className="mt-3 rounded-[var(--radius-sm)] bg-ink-800/60 p-3">
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => setCustomAmount(Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, p.amount)))}
                className="tabular rounded-[var(--radius-xs)] bg-ink-800 px-2.5 py-1 text-[11.5px] text-sand-300 hover:bg-ink-700 hover:text-sand-100"
              >
                {p.label} ({Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, p.amount))})
              </button>
            ))}
            <button
              onClick={() => setCustomAmount(legal.maxRaiseTo)}
              className="tabular rounded-[var(--radius-xs)] bg-burgundy-600/25 px-2.5 py-1 text-[11.5px] text-burgundy-300 hover:bg-burgundy-600/40"
            >
              All-in ({legal.maxRaiseTo})
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={legal.minRaiseTo}
              max={legal.maxRaiseTo}
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
              className="flex-1 accent-felt-500"
            />
            <input
              type="number"
              min={legal.minRaiseTo}
              max={legal.maxRaiseTo}
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
              className="tabular w-24 rounded-[var(--radius-xs)] bg-ink-800 px-2 py-1.5 text-[13px] text-sand-200 ring-1 ring-ink-700 focus:ring-felt-500 outline-none"
            />
            <Button
              variant="primary"
              onClick={() => confirm({ type: 'raise', amount: Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, customAmount)) })}
            >
              Raise to {Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, customAmount))}
            </Button>
          </div>
          <div className="tabular mt-1.5 text-[11px] text-sand-600">
            Min raise to {legal.minRaiseTo} · Max (all-in) {legal.maxRaiseTo}
          </div>
        </div>
      )}
    </div>
  );
}
