import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgressStore } from '../state/progressStore';
import { Button, Panel } from '../components/common/ui';
import { SuitIcon } from '../components/common/SuitIcon';
import clsx from 'clsx';

const OPTIONS = [
  { id: 'beginner', label: "I'm brand new to poker", desc: "I don't know the rules or hand rankings yet." },
  { id: 'some-experience', label: "I've played casually", desc: 'I know the rules but want sharper decision-making and math.' },
  { id: 'experienced', label: "I'm an experienced player", desc: 'I want to sharpen GTO/exploitative concepts and drill fast math.' },
] as const;

export default function Onboarding() {
  const [selected, setSelected] = useState<(typeof OPTIONS)[number]['id'] | null>(null);
  const setExperienceLevel = useProgressStore((s) => s.setExperienceLevel);
  const completeOnboarding = useProgressStore((s) => s.completeOnboarding);
  const navigate = useNavigate();

  function finish(skip: boolean) {
    if (selected) setExperienceLevel(selected);
    completeOnboarding();
    if (!skip && selected === 'beginner') navigate('/learn');
    else if (!skip) navigate('/play');
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-felt-800 ring-1 ring-felt-600/50">
            <SuitIcon suit="s" size={20} className="text-ivory-100" />
          </div>
          <div className="font-display text-[24px] font-semibold text-ivory-100">Welcome to Holdem Lab</div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-sand-400">
            A probability and decision-making trainer built around real No-Limit Hold'em — for interview and trading-style
            reasoning practice. Fictional chips only.
          </p>
        </div>
        <Panel title="How much poker experience do you have?" tone="raised">
          <div className="flex flex-col gap-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={clsx(
                  'rounded-[var(--radius-sm)] px-4 py-3 text-left transition-colors',
                  selected === opt.id ? 'bg-felt-800/40 ring-1 ring-felt-500/50' : 'bg-ink-800/50 hover:bg-ink-800 ring-1 ring-transparent'
                )}
              >
                <div className="text-[13.5px] font-semibold text-sand-100">{opt.label}</div>
                <div className="mt-0.5 text-[12px] text-sand-500">{opt.desc}</div>
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <button className="text-[12px] text-sand-500 hover:text-sand-300" onClick={() => finish(true)}>
              Skip — let me explore everything
            </button>
            <Button variant="primary" disabled={!selected} onClick={() => finish(false)}>
              {selected === 'beginner' ? 'Start with the basics' : 'Continue'}
            </Button>
          </div>
        </Panel>
        <p className="mt-4 text-center text-[11.5px] text-sand-600">
          Every mode stays unlocked regardless of your answer — this just picks a sensible starting point.
        </p>
      </div>
    </div>
  );
}
