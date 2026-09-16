import { useEffect, useRef, useState } from 'react';
import { ALL_CATEGORIES, Drill } from '../../training/drills/generators';
import { Badge, Button } from '../common/ui';
import { Icon } from '../common/NavIcons';
import { useProgressStore } from '../../state/progressStore';
import clsx from 'clsx';

interface Props {
  drill: Drill;
  onNext: () => void;
  timerSeconds?: number | null; // null = untimed
  showReasoningBox?: boolean;
  kind?: 'drill' | 'rapid-decision';
}

const CATEGORY_LABELS = Object.fromEntries(ALL_CATEGORIES.map((c) => [c.id, c.label]));

export function DrillRunner({ drill, onNext, timerSeconds = null, showReasoningBox = false, kind = 'drill' }: Props) {
  const [choiceIndex, setChoiceIndex] = useState<number | null>(null);
  const [numericInput, setNumericInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reasoning, setReasoning] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(timerSeconds);
  const [timedOut, setTimedOut] = useState(false);
  const startRef = useRef(Date.now());
  const recordDrillResult = useProgressStore((s) => s.recordDrillResult);
  const logMistake = useProgressStore((s) => s.logMistake);

  useEffect(() => {
    setChoiceIndex(null);
    setNumericInput('');
    setSubmitted(false);
    setReasoning('');
    setTimeLeft(timerSeconds);
    setTimedOut(false);
    startRef.current = Date.now();
  }, [drill, timerSeconds]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) {
      setTimedOut(true);
      submit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => (v !== null ? v - 1 : v)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submitted]);

  function isCorrect(): boolean {
    if (drill.answerKind === 'choice') return choiceIndex === drill.correctIndex;
    const val = Number(numericInput);
    if (Number.isNaN(val)) return false;
    return Math.abs(val - (drill.correctValue ?? 0)) <= (drill.tolerance ?? 0);
  }

  function submit() {
    if (submitted) return;
    const responseMs = Date.now() - startRef.current;
    const correct = isCorrect();
    setSubmitted(true);
    recordDrillResult(drill.category, correct, responseMs, kind);
    if (!correct) logMistake(drill.category, drill.prompt);
  }

  const correct = submitted && isCorrect();

  return (
    <div className="rounded-[var(--radius-md)] bg-ink-850 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sand-500">{CATEGORY_LABELS[drill.category] ?? drill.category}</span>
        {timeLeft !== null && !submitted ? (
          <Badge tone={timeLeft <= 5 ? 'bad' : 'brass'}>{timeLeft}s</Badge>
        ) : timerSeconds !== null ? (
          <Badge tone="neutral">untimed</Badge>
        ) : undefined}
      </div>

      <div className="px-4 pb-4">
        <p className="text-[15px] font-medium leading-snug text-ivory-100">{drill.prompt}</p>
        {drill.context && <p className="font-mono tabular mt-2.5 rounded-[var(--radius-sm)] bg-ink-950 p-3 text-[13.5px] text-sand-300 ring-1 ring-ink-700">{drill.context}</p>}

        {showReasoningBox && !submitted && (
          <textarea
            className="mt-3 w-full rounded-[var(--radius-sm)] bg-ink-800 p-2.5 text-[13.5px] text-sand-200 outline-none ring-1 ring-ink-700 focus:ring-felt-500"
            rows={2}
            placeholder="Think aloud: what quantities and trade-offs matter here?"
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
          />
        )}

        <div className="mt-3.5">
          {drill.answerKind === 'choice' ? (
            <div className="flex flex-col gap-2">
              {drill.choices!.map((choice, i) => {
                const showState = submitted;
                const isRight = i === drill.correctIndex;
                return (
                  <button
                    key={i}
                    disabled={submitted}
                    onClick={() => setChoiceIndex(i)}
                    className={clsx(
                      'rounded-[var(--radius-sm)] px-3.5 py-2.5 text-left text-[13.5px] transition-colors',
                      showState && isRight
                        ? 'bg-felt-800/60 text-felt-100 ring-1 ring-felt-500/50'
                        : showState && choiceIndex === i
                          ? 'bg-burgundy-600/30 text-burgundy-200 ring-1 ring-burgundy-500/40'
                          : choiceIndex === i
                            ? 'bg-ink-700 text-ivory-100 ring-1 ring-brass-400/40'
                            : 'bg-ink-800/70 text-sand-300 hover:bg-ink-700/70'
                    )}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <input
                type="number"
                disabled={submitted}
                value={numericInput}
                onChange={(e) => setNumericInput(e.target.value)}
                placeholder={drill.unit ?? 'answer'}
                className="tabular w-32 rounded-[var(--radius-sm)] bg-ink-800 px-3 py-2 text-[14px] text-sand-100 ring-1 ring-ink-700 outline-none focus:ring-felt-500"
              />
              {drill.unit && <span className="text-[13px] text-sand-500">{drill.unit}</span>}
            </div>
          )}
        </div>

        {!submitted ? (
          <Button className="mt-3.5" variant="primary" disabled={drill.answerKind === 'choice' ? choiceIndex === null : numericInput === ''} onClick={submit}>
            Submit
          </Button>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <div className={clsx('flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[13.5px] font-semibold', correct ? 'bg-felt-800/50 text-felt-200' : 'bg-burgundy-700/30 text-burgundy-200')}>
              <Icon name={correct ? 'check' : 'chevron'} size={16} />
              {timedOut ? 'Time’s up. ' : ''}
              {correct ? 'Correct' : 'Not quite'}
              {drill.answerKind === 'numeric' && (
                <span className="tabular ml-auto font-normal text-sand-400">
                  Answer: {drill.correctValue}
                  {drill.unit}
                </span>
              )}
            </div>

            <div className="rounded-[var(--radius-sm)] bg-brass-500/10 p-3 ring-1 ring-brass-500/25">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brass-400">
                <Icon name="clock" size={13} />
                Fastest mental method
              </div>
              <div className="text-[13px] leading-relaxed text-sand-200">{drill.fastestMethod}</div>
            </div>

            <Detail label="Calculation">
              <ol className="flex flex-col gap-1 pl-5 list-decimal">
                {drill.calculationSteps.map((s, i) => (
                  <li key={i} className="tabular text-[12.5px] text-sand-400">
                    {s}
                  </li>
                ))}
              </ol>
            </Detail>
            <Detail label="Strategic interpretation">{drill.interpretation}</Detail>
            <Detail label="Why tempting alternatives are wrong">{drill.whyAlternativesWrong}</Detail>
            <Detail label="Assumptions">{drill.assumptions}</Detail>
            <Button variant="secondary" onClick={onNext}>
              Next problem →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-ink-800/60 p-2.5">
      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-sand-500">{label}</div>
      <div className="text-[12.5px] leading-relaxed text-sand-400">{children}</div>
    </div>
  );
}
