import { useProgressStore } from '../state/progressStore';
import { CURRICULUM, totalLessonCount } from '../training/curriculum/data';
import { findNextLesson } from '../training/curriculum/meta';
import { LearnHero } from '../components/learn/LearnHero';
import { UpNextPanel } from '../components/learn/UpNextPanel';
import { LevelModule } from '../components/learn/LevelModule';

export default function Learn() {
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const total = totalLessonCount();
  const pct = Math.round((completedLessons.length / total) * 100);
  const next = findNextLesson(completedLessons);
  const currentLevelIndex = next ? CURRICULUM.findIndex((l) => l.id === next.level.id) : CURRICULUM.length - 1;

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-8">
      <LearnHero
        pct={pct}
        levelLabel={`Level ${currentLevelIndex + 1} of ${CURRICULUM.length}`}
        primaryHref={next ? `/learn/${next.level.id}/${next.lesson.id}` : `/learn/${CURRICULUM[0].id}/${CURRICULUM[0].lessons[0].id}`}
        primaryLabel={completedLessons.length === 0 ? 'Start first lesson' : next ? 'Continue learning' : 'Review the curriculum'}
      />

      {next && (
        <div className="mt-6">
          <UpNextPanel level={next.level} lesson={next.lesson} />
        </div>
      )}

      <div id="curriculum-path" className="relative mt-9 scroll-mt-6">
        <div className="pointer-events-none absolute left-[17px] top-2 bottom-8 w-px bg-ink-800" />
        <div className="flex flex-col">
          {CURRICULUM.map((level, i) => (
            <LevelModule
              key={level.id}
              level={level}
              index={i}
              completed={completedLessons}
              recommendedLessonId={next && next.level.id === level.id ? next.lesson.id : null}
              defaultOpen={i === currentLevelIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
