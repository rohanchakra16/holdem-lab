import { Link } from 'react-router-dom';
import { CardView } from '../common/CardView';
import { parseCard } from '../../engine/cards';

export function LearnHero({
  pct,
  levelLabel,
  primaryHref,
  primaryLabel,
}: {
  pct: number;
  levelLabel: string;
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-felt-800 via-felt-900 to-ink-900 px-6 py-7 sm:px-8 sm:py-8 shadow-[var(--shadow-panel)]">
      <div className="pointer-events-none absolute inset-0 felt-texture opacity-40" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brass-300">Learning Path</div>
          <h1 className="font-display mt-2 text-[26px] font-semibold leading-[1.15] text-ivory-100 sm:text-[30px]">
            Learn poker from first principles
          </h1>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-sand-300/90">
            A progressive path from the rules to range-based strategy — every idea drilled with real numbers, not just theory.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div>
              <div className="tabular text-lg font-semibold text-ivory-100">{pct}%</div>
              <div className="text-[11px] text-sand-400">Overall complete</div>
            </div>
            <div className="h-8 w-px bg-ivory-100/10" />
            <div>
              <div className="text-lg font-semibold text-ivory-100">{levelLabel}</div>
              <div className="text-[11px] text-sand-400">Current level</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              to={primaryHref}
              className="rounded-[var(--radius-sm)] bg-brass-500 px-5 py-2.5 text-[13.5px] font-semibold text-ink-950 shadow-[0_1px_0_0_theme(colors.brass.300/50%)_inset,0_4px_10px_-2px_theme(colors.brass.900/60%)] transition-[background-color,transform] duration-[var(--duration-fast)] hover:bg-brass-400 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory-100"
            >
              {primaryLabel}
            </Link>
            <a href="#curriculum-path" className="text-[13px] font-medium text-sand-300 hover:text-ivory-100 underline decoration-sand-500/40 underline-offset-4">
              Browse all topics
            </a>
          </div>
        </div>

        <HeroCardMotif />
      </div>
    </div>
  );
}

function HeroCardMotif() {
  return (
    <div className="relative hidden h-28 w-40 shrink-0 sm:block">
      <div className="absolute left-0 top-2 rotate-[-8deg]">
        <CardView card={parseCard('Kh')} size="lg" />
      </div>
      <div className="absolute left-14 top-0 rotate-[6deg]">
        <CardView card={parseCard('As')} size="lg" />
      </div>
    </div>
  );
}
