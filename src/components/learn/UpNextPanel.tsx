import { Link } from 'react-router-dom';
import { Lesson, Level } from '../../training/curriculum/data';
import { estimateLessonMinutes, lessonFormat, levelCompletion } from '../../training/curriculum/meta';
import { Icon } from '../common/NavIcons';
import { useProgressStore } from '../../state/progressStore';

export function UpNextPanel({ level, lesson }: { level: Level; lesson: Lesson }) {
  const completed = useProgressStore((s) => s.completedLessons);
  const { done, total } = levelCompletion(level, completed);
  const minutes = estimateLessonMinutes(lesson);

  return (
    <Link
      to={`/learn/${level.id}/${lesson.id}`}
      className="group relative flex items-center gap-5 overflow-hidden rounded-[var(--radius-md)] bg-ink-850 px-5 py-4 shadow-[var(--shadow-card)] ring-1 ring-brass-500/20 transition-colors hover:ring-brass-400/40"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-brass-500" />
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-brass-500/15 text-brass-400">
        <Icon name="arrowRight" size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brass-400">
          <span>Up next</span>
          <span className="text-sand-600">·</span>
          <span className="text-sand-500">{level.title.replace(/^Level \d+ · /, '')}</span>
        </div>
        <div className="mt-1 truncate font-display text-[17px] font-semibold text-ivory-100">{lesson.title}</div>
        <div className="mt-0.5 truncate text-[12.5px] text-sand-400">{lesson.description}</div>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-sand-500">
          <span className="tabular">{minutes} min</span>
          <span>·</span>
          <span>{lessonFormat(lesson)}</span>
          <span>·</span>
          <span className="tabular">
            Lesson {done + 1} of {total} in this level
          </span>
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-2 rounded-[var(--radius-sm)] bg-brass-500 px-4 py-2 text-[13px] font-semibold text-ink-950 sm:flex">
        {done === 0 ? 'Start' : 'Continue'}
        <Icon name="chevron" size={15} />
      </div>
    </Link>
  );
}
