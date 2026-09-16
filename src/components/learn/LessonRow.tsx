import { Link } from 'react-router-dom';
import { Lesson } from '../../training/curriculum/data';
import { estimateLessonMinutes, lessonFormat } from '../../training/curriculum/meta';
import { Icon } from '../common/NavIcons';
import clsx from 'clsx';

export type LessonRowState = 'completed' | 'recommended' | 'not-started';

export function LessonRow({ levelId, lesson, state }: { levelId: string; lesson: Lesson; state: LessonRowState }) {
  const minutes = estimateLessonMinutes(lesson);

  return (
    <Link
      to={`/learn/${levelId}/${lesson.id}`}
      className={clsx(
        'group flex items-center gap-3.5 px-4 py-3 transition-colors',
        state === 'recommended' ? 'bg-felt-800/25 hover:bg-felt-800/35' : 'hover:bg-ink-800/60'
      )}
    >
      <div
        className={clsx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular',
          state === 'completed'
            ? 'bg-felt-700/50 text-felt-200'
            : state === 'recommended'
              ? 'bg-brass-500 text-ink-950'
              : 'bg-ink-700 text-sand-400'
        )}
      >
        {state === 'completed' && <Icon name="check" size={13} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={clsx('truncate text-[13.5px] font-medium', state === 'not-started' ? 'text-sand-300' : 'text-ivory-100')}>{lesson.title}</span>
          {state === 'recommended' && <span className="shrink-0 rounded-[3px] bg-brass-500/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-brass-400">Next</span>}
        </div>
        <div className="mt-0.5 hidden truncate text-[12px] text-sand-500 sm:block">{lesson.description}</div>
      </div>

      <div className="hidden shrink-0 items-center gap-2 text-[11px] text-sand-500 md:flex">
        <span className="tabular">{minutes} min</span>
        <span className="text-sand-700">·</span>
        <span>{lessonFormat(lesson)}</span>
      </div>

      <Icon name="chevron" size={16} className="shrink-0 text-sand-600 transition-transform group-hover:translate-x-0.5 group-hover:text-sand-400" />
    </Link>
  );
}
