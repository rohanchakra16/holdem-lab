import { useState } from 'react';
import { ALL_CATEGORIES, DrillCategory, generateDrill } from '../training/drills/generators';
import { pickAdaptiveCategory, weakestCategories } from '../training/drills/adaptive';
import { DrillRunner } from '../components/drills/DrillRunner';
import { PageHeading } from '../components/common/PageHeading';
import { useProgressStore } from '../state/progressStore';
import clsx from 'clsx';

const CATEGORY_LABELS = Object.fromEntries(ALL_CATEGORIES.map((c) => [c.id, c.label]));

export default function Drills() {
  const drillStats = useProgressStore((s) => s.drillStats);
  const [adaptive, setAdaptive] = useState(true);
  const [category, setCategory] = useState<DrillCategory>(() => pickAdaptiveCategory({}));
  const [timed, setTimed] = useState(false);
  const [drill, setDrill] = useState(() => generateDrill(category));

  function next(cat?: DrillCategory) {
    const resolved = cat ?? (adaptive ? pickAdaptiveCategory(drillStats) : category);
    setCategory(resolved);
    setDrill(generateDrill(resolved));
  }

  const focus = weakestCategories(drillStats, 3);

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-8">
      <PageHeading title="Decision Drills" subtitle="Focused, repeatable practice problems. One problem at a time — the answer stays hidden until you submit." />

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] bg-ink-850 px-4 py-3">
        <button
          onClick={() => {
            setAdaptive(true);
            next(pickAdaptiveCategory(drillStats));
          }}
          className={clsx(
            'rounded-[var(--radius-xs)] px-2.5 py-1.5 text-[12px] font-medium transition-colors',
            adaptive ? 'bg-felt-600 text-ivory-100' : 'bg-ink-800 text-sand-400 hover:text-sand-200'
          )}
        >
          Focus on weak areas
        </button>
        <select
          className="rounded-[var(--radius-sm)] bg-ink-800 px-2.5 py-1.5 text-[13px] text-sand-200 ring-1 ring-ink-700 focus:outline-none focus:ring-felt-500 disabled:opacity-40"
          value={category}
          disabled={adaptive}
          onChange={(e) => {
            setAdaptive(false);
            next(e.target.value as DrillCategory);
          }}
        >
          {ALL_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-[12px] text-sand-500">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
          Timed mode (30s)
        </label>
        <div className="flex-1" />
        <button onClick={() => next()} className="rounded-[var(--radius-sm)] px-3 py-1.5 text-[12.5px] font-medium text-sand-400 hover:bg-ink-800 hover:text-sand-200">
          Skip / New Problem
        </button>
      </div>

      {adaptive && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-sand-600">
          <span>Weighted toward your weakest categories, e.g.</span>
          {focus.map((f) => (
            <span key={f.id} className="text-sand-500">
              {f.label} ({f.accuracy === null ? 'untried' : `${Math.round(f.accuracy * 100)}%`})
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <DrillRunner key={JSON.stringify(drill)} drill={drill} onNext={() => next()} timerSeconds={timed ? 30 : null} />
      </div>

      {!adaptive && (
        <p className="mt-3 px-1 text-[11px] text-sand-600">
          Currently browsing <span className="text-sand-400">{CATEGORY_LABELS[category]}</span> manually.
        </p>
      )}
    </div>
  );
}
