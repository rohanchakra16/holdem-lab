import type { TableState } from '../../engine/types';
import { handCategoryName } from '../../engine/handEvaluator';
import { Icon } from '../common/NavIcons';

const HERO_ID = 'human';

export function ShowdownBanner({ state }: { state: TableState }) {
  if (!state.isHandComplete || !state.showdownResults) return null;
  const winners = state.showdownResults.filter((r) => r.amountWon > 0);
  if (winners.length === 0) return null;

  const heroWon = winners.some((w) => w.playerId === HERO_ID);
  const isSplit = winners.length > 1;

  function nameFor(id: string) {
    if (id === HERO_ID) return 'You';
    return state.players.find((p) => p.id === id)?.name ?? id;
  }

  const headline = isSplit
    ? 'Split pot'
    : heroWon
      ? 'You win the pot!'
      : `${nameFor(winners[0].playerId)} wins the pot`;

  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] px-5 py-3.5 text-center shadow-[var(--shadow-panel)]"
      style={{
        background: heroWon ? 'linear-gradient(135deg, var(--color-felt-700), var(--color-felt-900))' : 'var(--color-ink-850)',
        boxShadow: heroWon ? '0 0 0 1px var(--color-brass-500), var(--shadow-panel)' : undefined,
      }}
    >
      <div className="flex items-center gap-2 text-[15px] font-semibold text-ivory-100">
        {heroWon && <Icon name="check" size={16} className="text-brass-400" />}
        {headline}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] text-sand-300">
        {winners.map((w) => (
          <span key={w.playerId} className="tabular">
            <span className="font-medium text-sand-100">{nameFor(w.playerId)}</span>
            {w.handValue ? ` — ${handCategoryName(w.handValue.category)}` : ' — uncontested'} · +{w.amountWon}
          </span>
        ))}
      </div>
    </div>
  );
}
