import type { Player, TableState } from '../../engine/types';
import { CardRow } from '../common/CardView';
import { Chip } from '../common/Chip';
import { Badge } from '../common/ui';
import { seatPosition } from './seatLayout';
import clsx from 'clsx';

export function Seat({ state, player, heroSeat }: { state: TableState; player: Player; heroSeat: number }) {
  const pos = seatPosition(player.seat, state.players.length, heroSeat);
  const isActing = state.actingSeat === player.seat && !state.isHandComplete;
  const isButton = state.buttonSeat === player.seat;
  const showdown = state.isHandComplete ? state.showdownResults : null;
  const showdownResult = showdown?.find((r) => r.playerId === player.id);
  const revealCards = player.isHuman || (showdownResult && showdownResult.handValue);
  const wonAmount = showdownResult?.amountWon ?? 0;

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5" style={{ left: pos.left, top: pos.top }}>
      {isButton && (
        <div className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-ivory-100 text-[10px] font-bold text-ink-950 shadow-[var(--shadow-card)] ring-1 ring-black/20">
          D
        </div>
      )}
      <div
        className={clsx(
          'relative flex min-w-[108px] flex-col items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2.5 shadow-[var(--shadow-card)] transition-shadow duration-[var(--duration-base)]',
          isActing ? 'bg-ink-800 ring-2 ring-brass-400 shadow-[var(--shadow-felt-glow)]' : 'bg-ink-900/95 ring-1 ring-black/30',
          player.hasFolded && 'opacity-40'
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="truncate max-w-[92px] text-[12px] font-semibold text-sand-100">{player.name}</span>
          {player.isHuman && <span className="h-1.5 w-1.5 rounded-full bg-felt-400" />}
        </div>
        <div className="tabular text-[11px] text-sand-500">{player.stack.toLocaleString()}</div>
        <CardRow cards={player.holeCards} faceDown={!revealCards} size="sm" />
        {wonAmount > 0 && <Badge tone="good">+{wonAmount}</Badge>}
        {player.hasFolded && <Badge tone="neutral">Folded</Badge>}
        {player.isAllIn && !player.hasFolded && <Badge tone="warn">All-in</Badge>}
      </div>
      {player.committedThisStreet > 0 && <Chip value={player.committedThisStreet} />}
    </div>
  );
}
