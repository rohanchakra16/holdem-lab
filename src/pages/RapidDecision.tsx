import { useState } from 'react';
import { DrillCategory, generateDrill } from '../training/drills/generators';
import { DrillRunner } from '../components/drills/DrillRunner';
import { PageHeading } from '../components/common/PageHeading';
import clsx from 'clsx';

const RAPID_DECISION_CATEGORIES: DrillCategory[] = [
  'pot-odds',
  'call-ev',
  'bet-ev-fold-equity',
  'draw-probability',
  'combinations-blockers',
  'outs',
];

const TIMER_OPTIONS = [
  { label: '20s', value: 20 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: 'Untimed', value: null },
];

function randomCategory(): DrillCategory {
  return RAPID_DECISION_CATEGORIES[Math.floor(Math.random() * RAPID_DECISION_CATEGORIES.length)];
}

export default function RapidDecision() {
  const [timer, setTimer] = useState<number | null>(30);
  const [thinkAloud, setThinkAloud] = useState(true);
  const [drill, setDrill] = useState(() => generateDrill(randomCategory()));

  function next() {
    setDrill(generateDrill(randomCategory()));
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-8">
      <PageHeading
        title="Rapid Decision Mode"
        subtitle="Fast probability calculations, EV comparisons, and decisions under uncertainty against a visible timer — practice explaining your reasoning and updating your beliefs without knowing the outcome in advance."
      />

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] bg-ink-850 px-4 py-3">
        <div className="text-[11px] font-medium text-sand-500">Timer</div>
        {TIMER_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setTimer(opt.value)}
            className={clsx(
              'rounded-[var(--radius-xs)] px-2.5 py-1 text-[12px] font-medium transition-colors',
              timer === opt.value ? 'bg-brass-500 text-ink-950' : 'bg-ink-800 text-sand-400 hover:text-sand-200'
            )}
          >
            {opt.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-[12px] text-sand-500">
          <input type="checkbox" checked={thinkAloud} onChange={(e) => setThinkAloud(e.target.checked)} />
          Think-aloud box
        </label>
        <button onClick={next} className="rounded-[var(--radius-sm)] px-3 py-1.5 text-[12.5px] font-medium text-sand-400 hover:bg-ink-800 hover:text-sand-200">
          New Scenario
        </button>
      </div>

      <div className="mt-4">
        <DrillRunner key={JSON.stringify(drill)} drill={drill} onNext={next} timerSeconds={timer} showReasoningBox={thinkAloud} kind="rapid-decision" />
      </div>

      <p className="mt-4 text-[11.5px] leading-relaxed text-sand-600">
        Feedback assesses whether your reasoning identifies the right quantities and trade-offs (pot odds, equity, EV, fold
        equity) and avoids outcome bias — not writing quality. Judge each decision independently of what actually happens
        next; poker and interview-style questions alike carry real variance.
      </p>
    </div>
  );
}
