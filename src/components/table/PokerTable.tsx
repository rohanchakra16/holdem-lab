import { isSessionOver, useTableStore } from '../../state/tableStore';
import { CardRow } from '../common/CardView';
import { Chip } from '../common/Chip';
import { Seat } from './Seat';
import { MobileTable } from './MobileTable';
import { ActionBar } from './ActionBar';
import { CoachPanel } from './CoachPanel';
import { ShowdownBanner } from './ShowdownBanner';
import { Badge } from '../common/ui';
import { Icon } from '../common/NavIcons';
import { computeLegalActionsForPlayer } from '../../engine/legalActions';
import { getTotalPot } from '../../engine/engine';

const HERO_ID = 'human';

export default function PokerTable() {
  const version = useTableStore((s) => s.version);
  void version;
  const engine = useTableStore((s) => s.engine);
  const settings = useTableStore((s) => s.settings);
  const isPaused = useTableStore((s) => s.isPaused);
  const pendingFeedback = useTableStore((s) => s.pendingFeedback);
  const handOverAwaitingContinue = useTableStore((s) => s.handOverAwaitingContinue);
  const humanAct = useTableStore((s) => s.humanAct);
  const dealNextHand = useTableStore((s) => s.dealNextHand);
  const togglePause = useTableStore((s) => s.togglePause);
  const dismissFeedback = useTableStore((s) => s.dismissFeedback);
  const endSession = useTableStore((s) => s.endSession);
  const advisorSuggestion = useTableStore((s) => s.advisorSuggestion);
  const advisorRevealed = useTableStore((s) => s.advisorRevealed);
  const revealAdvisor = useTableStore((s) => s.revealAdvisor);

  if (!engine) return null;
  const state = engine.getState();
  const hero = state.players.find((p) => p.id === HERO_ID)!;
  const isHeroTurn = state.actingSeat === hero.seat && !state.isHandComplete;
  const legal = isHeroTurn ? computeLegalActionsForPlayer(state, hero) : null;
  const pot = getTotalPot(state);
  const sessionOver = isSessionOver(state);
  const heroBusted = !hero.isActive;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-ink-800 bg-ink-900 px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto text-[12px] text-sand-400 sm:gap-3 sm:text-[12.5px]">
          <Badge tone="info">{settings.mode === 'guided' ? 'Guided' : 'Free'}</Badge>
          <span className="tabular hidden sm:inline">Blinds {state.config.smallBlind}/{state.config.bigBlind}</span>
          <span className="tabular hidden sm:inline">Hand #{state.handNumber}</span>
          <span className="capitalize text-sand-300">{state.street}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {settings.mode === 'free' && (
            <button onClick={togglePause} className="rounded-[var(--radius-sm)] px-2 py-1.5 text-[12px] font-medium text-sand-300 hover:bg-ink-800 sm:px-3 sm:text-[12.5px]">
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
          <button onClick={endSession} className="rounded-[var(--radius-sm)] px-2 py-1.5 text-[12px] font-medium text-sand-400 hover:bg-ink-800 sm:px-3 sm:text-[12.5px]">
            End
          </button>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="relative mx-auto mt-5 aspect-[16/9] w-[95%] max-w-4xl shrink-0 rounded-[999px] border-[12px] border-[#3a2a1a] bg-gradient-to-b from-felt-800 to-felt-900 shadow-[var(--shadow-raised)] felt-texture">
          <div className="pointer-events-none absolute inset-0 rounded-[999px] shadow-[inset_0_0_60px_20px_rgba(0,0,0,0.35)]" />
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2.5">
            <Chip value={pot} size="md" />
            <div className="tabular text-[11px] font-medium uppercase tracking-wide text-felt-200/70">Pot</div>
            <CardRow cards={state.community} size="md" />
          </div>
          {state.players.map((p) => (
            <Seat key={p.id} state={state} player={p} heroSeat={hero.seat} />
          ))}
        </div>
        <div className="mx-auto flex w-[95%] max-w-4xl justify-end pt-2.5">
          <div className="flex items-center gap-2.5 rounded-[var(--radius-sm)] bg-ink-900/95 px-3.5 py-2.5 shadow-[var(--shadow-card)] ring-1 ring-black/30">
            <span className="text-[10px] font-medium uppercase tracking-wide text-sand-500">Your hand</span>
            <CardRow cards={hero.holeCards} size="lg" />
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <MobileTable state={state} heroId={HERO_ID} />
      </div>

      <div className="mx-auto w-full max-w-4xl px-3 pb-5 flex flex-col gap-3 sm:w-[95%] sm:px-0">
        {state.isHandComplete && <ShowdownBanner state={state} />}
        {pendingFeedback && <CoachPanel feedback={pendingFeedback} onDismiss={dismissFeedback} />}

        {sessionOver ? (
          <div className="rounded-[var(--radius-md)] bg-brass-900/20 ring-1 ring-brass-600/30 p-4 text-center text-brass-200">
            {heroBusted ? "Session over — you're out of chips." : 'Session over — only one player has chips remaining.'}
            <div className="mt-2">
              <button onClick={endSession} className="rounded-[var(--radius-sm)] bg-brass-500 px-4 py-2 text-[13px] font-semibold text-ink-950 hover:bg-brass-400">
                Back to setup
              </button>
            </div>
          </div>
        ) : isHeroTurn && legal ? (
          <ActionBar
            legal={legal}
            pot={pot}
            currentBet={state.currentBet}
            effectiveStack={hero.stack + hero.committedThisStreet}
            onAct={(action, reasoning) => humanAct(action, reasoning)}
            advisorEnabled={settings.advisorEnabled}
            advisorRevealed={advisorRevealed}
            advisorSuggestion={advisorSuggestion}
            onRevealAdvisor={revealAdvisor}
          />
        ) : handOverAwaitingContinue && settings.mode === 'guided' ? (
          <div className="flex justify-center">
            <button onClick={dealNextHand} className="rounded-[var(--radius-sm)] bg-felt-500 px-5 py-2.5 text-[13.5px] font-semibold text-ivory-100 hover:bg-felt-400">
              Deal Next Hand
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2 text-[12.5px] text-sand-500">
            {!state.isHandComplete && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass-400" />}
            {state.isHandComplete ? 'Hand complete.' : `Waiting for ${state.players.find((p) => p.seat === state.actingSeat)?.name}…`}
          </div>
        )}

        <ActionLog />
      </div>
    </div>
  );
}

function ActionLog() {
  const version = useTableStore((s) => s.version);
  void version;
  const engine = useTableStore((s) => s.engine);
  if (!engine) return null;
  const state = engine.getState();
  const recent = state.actionHistory.slice(-8).reverse();
  return (
    <div className="rounded-[var(--radius-md)] bg-ink-900/70 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-sand-500">
        <Icon name="history" size={13} />
        Action History
      </div>
      <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
        {recent.map((a, i) => {
          const player = state.players.find((p) => p.id === a.playerId);
          return (
            <div key={i} className="text-[12px] text-sand-500">
              <span className="text-sand-300">{player?.name}</span> {a.action.type}
              {a.action.amount !== undefined ? <span className="tabular"> {a.action.amount}</span> : ''}{' '}
              <span className="text-sand-700">· {a.street}</span>
            </div>
          );
        })}
        {recent.length === 0 && <div className="text-[12px] text-sand-700">No actions yet.</div>}
      </div>
    </div>
  );
}
