import { useState } from 'react';
import { Level } from '../../training/curriculum/data';
import { lessonKey, levelCompletion, levelMinutes } from '../../training/curriculum/meta';
import { Icon } from '../common/NavIcons';
import { LessonRow, LessonRowState } from './LessonRow';
import { ReadyState, ProgressBar } from '../common/ui';
import clsx from 'clsx';

export function LevelModule({
  level,
  index,
  completed,
  recommendedLessonId,
  defaultOpen,
}: {
  level: Level;
  index: number;
  completed: string[];
  recommendedLessonId: string | null;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { done, total, pct } = levelCompletion(level, completed);
  const isComplete = done === total;
  const totalMinutes = levelMinutes(level);

  return (
    <div className="relative flex gap-4">
      <div className="relative z-10 flex w-9 shrink-0 flex-col items-center pt-0.5">
        <div
          className={clsx(
            'flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold tabular ring-4 ring-ink-950',
            isComplete
              ? 'bg-felt-600 text-ivory-100'
              : recommendedLessonId
                ? 'bg-brass-500 text-ink-950'
                : 'bg-ink-800 text-sand-400'
          )}
        >
          {isComplete ? <Icon name="check" size={16} /> : index + 1}
        </div>
      </div>

      <div className="mb-4 flex-1 overflow-hidden rounded-[var(--radius-md)] bg-ink-850">
        <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-4 px-4 py-3.5 text-left">
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[15px] font-semibold text-ivory-100">
              {level.title.replace(/^Level \d+ · /, '')}
            </div>
            <div className="mt-0.5 truncate text-[12.5px] text-sand-500">{level.description}</div>
          </div>

          <div className="hidden shrink-0 items-center gap-4 text-[11.5px] text-sand-500 sm:flex">
            <span className="tabular">{total} lessons</span>
            <span className="tabular">~{totalMinutes} min</span>
          </div>

          <div className="w-14 shrink-0 sm:w-24">
            {done === 0 ? (
              <span className="text-[10.5px] font-medium text-sand-500">New</span>
            ) : isComplete ? (
              <span className="text-[10.5px] font-semibold text-felt-300">Done</span>
            ) : (
              <div>
                <div className="tabular text-[11px] text-sand-400">{done}/{total}</div>
                <div className="mt-1 hidden sm:block">
                  <ProgressBar value={pct} />
                </div>
              </div>
            )}
          </div>

          <Icon name="chevron" size={16} className={clsx('shrink-0 text-sand-500 transition-transform', open && 'rotate-90')} />
        </button>

        {open && (
          <div className="divide-y divide-ink-800/70 border-t border-ink-800/70">
            {done === 0 && (
              <div className="px-4 py-3">
                <ReadyState label="No lessons started in this level yet" actionLabel="Start first lesson" />
              </div>
            )}
            {level.lessons.map((lesson) => {
              const key = lessonKey(level.id, lesson.id);
              const state: LessonRowState = completed.includes(key) ? 'completed' : lesson.id === recommendedLessonId ? 'recommended' : 'not-started';
              return <LessonRow key={lesson.id} levelId={level.id} lesson={lesson} state={state} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
