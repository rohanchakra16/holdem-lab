import { useMemo, useState } from 'react';
import { clearHandHistory, filterHands, handToJSON, handToPlainText, loadHandHistory } from '../handHistory/handHistoryStore';
import { HandHistoryEntry } from '../handHistory/types';
import { Badge, Button, Panel } from '../components/common/ui';
import { PageHeading } from '../components/common/PageHeading';
import { CardRow } from '../components/common/CardView';
import { handCategoryName } from '../engine/handEvaluator';

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

function HandDetail({ hand }: { hand: HandHistoryEntry }) {
  const [notes, setNotes] = useState(hand.notes);
  const [streetIndex, setStreetIndex] = useState(0);
  const streets = ['preflop', 'flop', 'turn', 'river'] as const;
  const boardByStreet = [0, 3, 4, 5];
  const visibleBoard = hand.community.slice(0, boardByStreet[streetIndex]);
  const actionsForStreet = hand.actionHistory.filter((a) => a.street === streets[streetIndex]);

  const hero = hand.players.find((p) => p.id === hand.heroId);

  return (
    <Panel
      title={`Hand #${hand.handNumber}`}
      right={
        <div className="flex gap-2">
          <button className="text-xs text-sand-500 hover:text-sand-300" onClick={() => copyToClipboard(handToPlainText(hand))}>
            Copy text
          </button>
          <button className="text-xs text-sand-500 hover:text-sand-300" onClick={() => copyToClipboard(handToJSON(hand))}>
            Copy JSON
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge tone={hand.heroNetResult > 0 ? 'good' : hand.heroNetResult < 0 ? 'bad' : 'neutral'}>
          {hand.heroNetResult > 0 ? '+' : ''}
          {hand.heroNetResult} chips
        </Badge>
        <Badge tone="info">{hand.mode}</Badge>
        <span className="text-xs text-sand-500">{new Date(hand.timestamp).toLocaleString()}</span>
      </div>

      {hero && (
        <div className="mb-3">
          <div className="text-xs text-sand-500 mb-1">Your hole cards</div>
          <CardRow cards={hero.holeCards} size="sm" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        {streets.map((s, i) => (
          <button
            key={s}
            onClick={() => setStreetIndex(i)}
            className={`rounded-[var(--radius-xs)] px-2 py-1 text-xs capitalize ${streetIndex === i ? 'bg-felt-600 text-ivory-100' : 'bg-ink-800 text-sand-400 hover:bg-ink-700'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs text-sand-500">Board:</span>
        <CardRow cards={visibleBoard} size="sm" />
      </div>
      <div className="flex flex-col gap-1 mb-3">
        {actionsForStreet.map((a, i) => (
          <div key={i} className="text-xs text-sand-400">
            <span className="text-sand-300">{a.playerId}</span> {a.action.type}
            {a.action.amount !== undefined ? ` ${a.action.amount}` : ''} <span className="text-sand-600">(pot was {a.potBefore})</span>
          </div>
        ))}
        {actionsForStreet.length === 0 && <div className="text-xs text-sand-600">No actions recorded on this street.</div>}
      </div>

      {hand.showdownResults && (
        <div className="mb-3 rounded-[var(--radius-sm)] bg-ink-800/50 p-2.5">
          <div className="text-xs font-semibold text-sand-400 mb-1">Showdown</div>
          {hand.showdownResults
            .filter((r) => r.amountWon > 0 || r.handValue)
            .map((r, i) => (
              <div key={i} className="text-xs text-sand-300">
                {r.playerId}: {r.handValue ? handCategoryName(r.handValue.category) : 'uncontested'} — won {r.amountWon}
              </div>
            ))}
        </div>
      )}

      <div>
        <div className="text-xs text-sand-500 mb-1">Your notes</div>
        <textarea
          className="w-full rounded-[var(--radius-sm)] bg-ink-800 p-2.5 text-sm text-sand-200 ring-1 ring-ink-700 outline-none focus:ring-felt-500"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note about this hand..."
        />
      </div>
    </Panel>
  );
}

export default function HandReview() {
  const [hands, setHands] = useState(() => loadHandHistory());
  const [selected, setSelected] = useState<string | null>(null);
  const [resultFilter, setResultFilter] = useState<'all' | 'won' | 'lost' | 'chopped'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'guided' | 'free'>('all');

  const filtered = useMemo(
    () =>
      filterHands(hands, {
        result: resultFilter === 'all' ? undefined : resultFilter,
        mode: modeFilter === 'all' ? undefined : modeFilter,
      }),
    [hands, resultFilter, modeFilter]
  );

  const selectedHand = filtered.find((h) => h.id === selected) ?? filtered[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex items-center justify-between">
        <PageHeading title="Hand Review" subtitle="Every played hand, with street-by-street playback and export." />
        <Button
          variant="ghost"
          onClick={() => {
            clearHandHistory();
            setHands([]);
          }}
        >
          Clear history
        </Button>
      </div>

      <div className="mt-4 flex gap-2">
        <select
          className="rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-1.5 text-[13px] text-sand-200 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500"
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value as typeof resultFilter)}
        >
          <option value="all">All results</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="chopped">Chopped</option>
        </select>
        <select
          className="rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-1.5 text-[13px] text-sand-200 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500"
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value as typeof modeFilter)}
        >
          <option value="all">All modes</option>
          <option value="guided">Guided</option>
          <option value="free">Free</option>
        </select>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 flex flex-col gap-1.5 max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 && <div className="text-sm text-sand-500 p-4">No hands played yet — play a session first.</div>}
          {filtered.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelected(h.id)}
              className={`rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition-colors ${
                selectedHand?.id === h.id ? 'bg-felt-800/40 ring-1 ring-felt-500/50' : 'bg-ink-800/50 hover:bg-ink-800'
              }`}
            >
              <div className="flex justify-between">
                <span className="text-sand-200">Hand #{h.handNumber}</span>
                <span className={h.heroNetResult >= 0 ? 'text-felt-300' : 'text-burgundy-400'}>
                  {h.heroNetResult > 0 ? '+' : ''}
                  {h.heroNetResult}
                </span>
              </div>
              <div className="text-xs text-sand-500">{new Date(h.timestamp).toLocaleTimeString()}</div>
            </button>
          ))}
        </div>
        <div className="md:col-span-2">{selectedHand ? <HandDetail hand={selectedHand} /> : null}</div>
      </div>
    </div>
  );
}
