import { Panel } from '../common/ui';
import { HAND_CATEGORY_NAMES } from '../../engine/handEvaluator';

export function HandRankingsReference() {
  const ordered = Object.entries(HAND_CATEGORY_NAMES)
    .map(([k, v]) => ({ rank: Number(k), name: v }))
    .sort((a, b) => b.rank - a.rank);
  return (
    <Panel title="Hand Rankings Reference">
      <ol className="flex flex-col gap-1.5">
        {ordered.map((h, i) => (
          <li key={h.rank} className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-ink-800/50 px-3 py-1.5 text-sm">
            <span className="w-5 text-sand-500">{i + 1}</span>
            <span className="text-sand-100 font-medium">{h.name}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function PositionReference() {
  const rows = [
    { pos: 'UTG (Under the Gun)', note: 'First to act preflop. Tightest range — most players still to act behind you.' },
    { pos: 'Middle Position', note: 'A bit more information than UTG; range widens slightly.' },
    { pos: 'Cutoff', note: 'One seat before the button. Wide, aggressive range — great position most of the time.' },
    { pos: 'Button', note: 'Best seat at the table — acts last on every postflop street. Widest opening range.' },
    { pos: 'Small Blind', note: 'Posts a forced bet, acts early postflop (out of position for the rest of the hand).' },
    { pos: 'Big Blind', note: 'Posts the largest forced bet, gets a preflop "option," but is out of position postflop.' },
  ];
  return (
    <Panel title="Position Reference">
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.pos} className="rounded-[var(--radius-sm)] bg-ink-800/50 px-3 py-2">
            <div className="text-sm font-semibold text-sand-100">{r.pos}</div>
            <div className="text-xs text-sand-400">{r.note}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const GLOSSARY: { term: string; def: string }[] = [
  { term: 'Blocker', def: 'A card you hold that removes possible combinations of a hand your opponent could have.' },
  { term: 'C-bet (continuation bet)', def: 'A bet by the preflop aggressor on the flop, regardless of whether it improved their hand.' },
  { term: 'Effective stack', def: 'The smaller of two players’ stacks — the most either can win or lose in the hand.' },
  { term: 'Equity', def: 'Your share of the pot on average, given the range of ways the hand could play out.' },
  { term: 'Fold equity', def: 'The extra value a bet/raise creates purely from the chance your opponent folds.' },
  { term: 'Implied odds', def: 'Extra value from chips you expect to win on later streets if you hit your draw.' },
  { term: 'MDF (Minimum Defence Frequency)', def: 'The minimum fraction of your range you must continue with vs. a bet to prevent an automatically profitable bluff.' },
  { term: 'Nut advantage', def: 'Having more very strong hands than your opponent on a given board.' },
  { term: 'Outs', def: 'Unseen cards that improve your hand to (likely) the best hand.' },
  { term: 'Pot odds', def: 'The ratio of the cost to call versus the resulting pot size.' },
  { term: 'Range', def: 'The full set of hands a player might hold in a given spot.' },
  { term: 'Range advantage', def: 'Having more total equity across your whole range than your opponent on a given board.' },
  { term: 'Semi-bluff', def: 'Betting a hand that isn’t currently best but has strong equity to improve.' },
  { term: 'SPR (Stack-to-Pot Ratio)', def: 'Effective remaining stack divided by the pot size.' },
  { term: 'Thin value', def: 'Betting a modest made hand for value against a range with many worse calling hands.' },
];

export function Glossary() {
  return (
    <Panel title="Glossary">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {GLOSSARY.map((g) => (
          <div key={g.term} className="rounded-[var(--radius-sm)] bg-ink-800/50 px-3 py-2">
            <div className="text-sm font-semibold text-felt-300">{g.term}</div>
            <div className="text-xs text-sand-400">{g.def}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
