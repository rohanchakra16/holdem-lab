import type { Player, TableState } from '../../engine/types';
import { CardRow } from '../common/CardView';
import { Chip } from '../common/Chip';
import { Badge } from '../common/ui';
import clsx from 'clsx';

/** A compact, purpose-built mobile layout — not a shrunk version of the oval desktop table. */
export function MobileTable({ state, heroId }: { state: TableState; heroId: string }) {
  const hero = state.players.find((p) => p.id === heroId)!;
  const opponents = state.players.filter((p) => p.id !== heroId);
  const pot = state.players.reduce((sum, p) => sum + p.committedTotal, 0);

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <div className="grid grid-cols-3 gap-2">
        {opponents.map((p) => (
          <OpponentTile key={p.id} state={state} player={p} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-b from-felt-800 to-felt-900 py-4 shadow-[var(--shadow-card)] felt-texture">
        <Chip value={pot} size="md" />
        <div className="tabular text-[10px] font-medium uppercase tracking-wide text-felt-200/70">Pot</div>
        <CardRow cards={state.community} size="md" />
      </div>

      <HeroTile state={state} player={hero} />
    </div>
  );
}

function OpponentTile({ state, player }: { state: TableState; player: Player }) {
  const isActing = state.actingSeat === player.seat && !state.isHandComplete;
  const isButton = state.buttonSeat === player.seat;
  const showdown = state.isHandComplete ? state.showdownResults : null;
  const showdownResult = showdown?.find((r) => r.playerId === player.id);
  const revealCards = showdownResult && showdownResult.handValue;
  const wonAmount = showdownResult?.amountWon ?? 0;

  return (
    <div
      className={clsx(
        'relative flex flex-col items-center gap-1 rounded-[var(--radius-sm)] px-2 py-2 shadow-[var(--shadow-card)]',
        isActing ? 'bg-ink-800 ring-2 ring-brass-400' : 'bg-ink-900/95 ring-1 ring-black/30',
        player.hasFolded && 'opacity-40'
      )}
    >
      {isButton && (
        <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ivory-100 text-[8px] font-bold text-ink-950 ring-1 ring-black/20">
          D
        </div>
      )}
      <span className="max-w-full truncate text-[11px] font-semibold text-sand-100">{player.name}</span>
      <span className="tabular text-[10px] text-sand-500">{player.stack}</span>
      <CardRow cards={player.holeCards} faceDown={!revealCards} size="sm" />
      {player.committedThisStreet > 0 && <Chip value={player.committedThisStreet} />}
      {wonAmount > 0 && <Badge tone="good">+{wonAmount}</Badge>}
      {player.hasFolded && <span className="text-[9px] text-sand-600">folded</span>}
      {player.isAllIn && !player.hasFolded && <span className="text-[9px] text-brass-400">all-in</span>}
    </div>
  );
}

function HeroTile({ state, player }: { state: TableState; player: Player }) {
  const isActing = state.actingSeat === player.seat && !state.isHandComplete;
  return (
    <div className={clsx('flex items-center justify-between rounded-[var(--radius-md)] px-4 py-3', isActing ? 'bg-ink-800 ring-2 ring-brass-400' : 'bg-ink-900 ring-1 ring-black/30')}>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-sand-100">You</span>
          <span className="h-1.5 w-1.5 rounded-full bg-felt-400" />
        </div>
        <span className="tabular text-[11px] text-sand-500">{player.stack} chips</span>
      </div>
      <div className="flex items-center gap-2">
        {player.committedThisStreet > 0 && <Chip value={player.committedThisStreet} />}
        <CardRow cards={player.holeCards} size="lg" />
      </div>
    </div>
  );
}
