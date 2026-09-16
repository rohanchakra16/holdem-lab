import { parseCard } from '../../engine/cards';
import { CardView } from '../common/CardView';
import { handCategoryName, HandCategory } from '../../engine/handEvaluator';

export type LessonVisualSpec =
  | { kind: 'cards'; cards: string[]; caption?: string }
  | { kind: 'hand-ladder'; highlight?: HandCategory[] }
  | { kind: 'pot-odds'; pot: number; call: number }
  | { kind: 'draw-bar'; outs: number; approx: number; exact: number }
  | { kind: 'board-texture'; boards: { cards: string[]; label: string }[] }
  | { kind: 'bayes-update'; priorPct: number; posteriorPct: number; priorLabel: string; posteriorLabel: string };

export function LessonVisual({ spec }: { spec: LessonVisualSpec }) {
  if (spec.kind === 'cards') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] bg-felt-900/40 px-5 py-5 ring-1 ring-felt-700/30">
        <div className="flex gap-2">
          {spec.cards.map((c, i) => (
            <CardView key={i} card={parseCard(c)} size="lg" />
          ))}
        </div>
        {spec.caption && <div className="mt-1 text-center text-[12.5px] text-sand-400">{spec.caption}</div>}
      </div>
    );
  }

  if (spec.kind === 'hand-ladder') {
    const categories = ([8, 7, 6, 5, 4, 3, 2, 1, 0] as HandCategory[]);
    return (
      <div className="overflow-hidden rounded-[var(--radius-md)] bg-ink-900 ring-1 ring-ink-700/60">
        {categories.map((cat, i) => {
          const isHighlighted = spec.highlight?.includes(cat);
          return (
            <div
              key={cat}
              className={`flex items-center gap-3 px-4 py-2 ${i !== categories.length - 1 ? 'border-b border-ink-800' : ''} ${isHighlighted ? 'bg-brass-500/10' : ''}`}
            >
              <span className="tabular w-4 text-[11px] text-sand-600">{9 - i}</span>
              <span className={`text-[12.5px] ${isHighlighted ? 'font-semibold text-brass-300' : 'text-sand-300'}`}>{handCategoryName(cat)}</span>
              {isHighlighted && <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-brass-500">this hand</span>}
            </div>
          );
        })}
      </div>
    );
  }

  if (spec.kind === 'pot-odds') {
    const total = spec.pot + spec.call;
    const potPct = (spec.pot / total) * 100;
    return (
      <div className="rounded-[var(--radius-md)] bg-ink-900 px-5 py-4 ring-1 ring-ink-700/60">
        <div className="flex h-8 overflow-hidden rounded-[var(--radius-xs)]">
          <div className="flex items-center justify-center bg-felt-700 text-[11px] font-semibold tabular text-ivory-100" style={{ width: `${potPct}%` }}>
            pot {spec.pot}
          </div>
          <div className="flex items-center justify-center bg-brass-500 text-[11px] font-semibold tabular text-ink-950" style={{ width: `${100 - potPct}%` }}>
            call {spec.call}
          </div>
        </div>
        <div className="mt-2 text-center text-[12px] text-sand-400">
          You need <span className="tabular font-semibold text-brass-300">{((spec.call / total) * 100).toFixed(1)}%</span> equity to break even on this call.
        </div>
      </div>
    );
  }

  if (spec.kind === 'draw-bar') {
    return (
      <div className="rounded-[var(--radius-md)] bg-ink-900 px-5 py-4 ring-1 ring-ink-700/60">
        <div className="flex flex-col gap-2.5">
          <BarRow label={`Rule of 4 (approx.)`} pct={spec.approx} tone="brass" />
          <BarRow label="Exact (hypergeometric)" pct={spec.exact} tone="felt" />
        </div>
        <div className="mt-2.5 text-center text-[11.5px] text-sand-500">{spec.outs} outs, two cards to come</div>
      </div>
    );
  }

  if (spec.kind === 'bayes-update') {
    return (
      <div className="rounded-[var(--radius-md)] bg-ink-900 px-5 py-4 ring-1 ring-ink-700/60">
        <div className="flex flex-col gap-2.5">
          <BarRow label={spec.priorLabel} pct={spec.priorPct} tone="brass" />
          <BarRow label={spec.posteriorLabel} pct={spec.posteriorPct} tone="felt" />
        </div>
        <div className="mt-2.5 text-center text-[11.5px] text-sand-500">
          New evidence moved the estimate {spec.posteriorPct > spec.priorPct ? 'up' : 'down'} by{' '}
          <span className="tabular font-semibold text-sand-300">{Math.abs(spec.posteriorPct - spec.priorPct).toFixed(1)} points</span> {'—'} but did not make it certain.
        </div>
      </div>
    );
  }

  if (spec.kind === 'board-texture') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {spec.boards.map((b, i) => (
          <div key={i} className="rounded-[var(--radius-md)] bg-ink-900 px-3 py-3 text-center ring-1 ring-ink-700/60">
            <div className="flex justify-center gap-1">
              {b.cards.map((c, j) => (
                <CardView key={j} card={parseCard(c)} size="sm" />
              ))}
            </div>
            <div className="mt-2 text-[11px] font-medium text-sand-400">{b.label}</div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function BarRow({ label, pct, tone }: { label: string; pct: number; tone: 'brass' | 'felt' }) {
  const color = tone === 'brass' ? 'bg-brass-500' : 'bg-felt-500';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11.5px] text-sand-400">
        <span>{label}</span>
        <span className="tabular font-semibold text-sand-200">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-700">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
