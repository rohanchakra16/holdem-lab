import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CURRICULUM, findLesson } from '../training/curriculum/data';
import { useProgressStore } from '../state/progressStore';
import { Badge } from '../components/common/ui';
import { Icon } from '../components/common/NavIcons';
import { LessonVisual } from '../components/learn/LessonVisual';
import { estimateLessonMinutes } from '../training/curriculum/meta';
import clsx from 'clsx';

function ContentBlock({ text }: { text: string }) {
  if (text.startsWith('- ')) {
    return <li className="text-[14.5px] leading-relaxed text-sand-300">{text.slice(2)}</li>;
  }
  return <p className="text-[14.5px] leading-relaxed text-sand-300">{text}</p>;
}

export default function LessonView() {
  const { levelId, lessonId } = useParams();
  const navigate = useNavigate();
  const found = levelId && lessonId ? findLesson(levelId, lessonId) : null;
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const lessonKey = found ? `${found.level.id}/${found.lesson.id}` : null;
  const [quizLessonKey, setQuizLessonKey] = useState(lessonKey);
  if (lessonKey !== quizLessonKey) {
    setQuizLessonKey(lessonKey);
    setSelected(null);
    setSubmitted(false);
  }

  const nextLesson = useMemo(() => {
    if (!found) return null;
    const levelIdx = CURRICULUM.findIndex((l) => l.id === found.level.id);
    const lessonIdx = found.level.lessons.findIndex((l) => l.id === found.lesson.id);
    if (lessonIdx < found.level.lessons.length - 1) {
      return { levelId: found.level.id, lessonId: found.level.lessons[lessonIdx + 1].id };
    }
    if (levelIdx < CURRICULUM.length - 1) {
      const nextLevel = CURRICULUM[levelIdx + 1];
      return { levelId: nextLevel.id, lessonId: nextLevel.lessons[0].id };
    }
    return null;
  }, [found]);

  if (!found) {
    return (
      <div className="p-8 text-sand-300">
        Lesson not found. <Link to="/learn" className="text-felt-300">Back to Learn</Link>
      </div>
    );
  }

  const { level, lesson } = found;
  const key = `${level.id}/${lesson.id}`;
  const isDone = completedLessons.includes(key);
  const blocks: string[][] = [];
  let currentGroup: string[] = [];
  for (const b of lesson.blocks) {
    if (b.startsWith('- ')) {
      currentGroup.push(b);
    } else {
      if (currentGroup.length) {
        blocks.push(currentGroup);
        currentGroup = [];
      }
      blocks.push([b]);
    }
  }
  if (currentGroup.length) blocks.push(currentGroup);

  function markDone() {
    completeLesson(key);
  }

  function submitAnswer() {
    setSubmitted(true);
    if (lesson.check && selected === lesson.check.correctIndex) {
      markDone();
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex items-center gap-1.5 text-[12px] text-sand-500">
        <Link to="/learn" className="hover:text-sand-300">
          Learn
        </Link>
        <Icon name="chevron" size={12} />
        <span>{level.title.replace(/^Level \d+ · /, '')}</span>
      </div>

      <div className="mt-2 flex items-center gap-2.5">
        <h1 className="font-display text-[22px] font-semibold text-ivory-100">{lesson.title}</h1>
        {isDone && <Badge tone="good">Completed</Badge>}
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[12px] text-sand-500">
        <span className="tabular">{estimateLessonMinutes(lesson)} min</span>
        <span>·</span>
        <span>{lesson.check ? 'Interactive check' : 'Lesson'}</span>
      </div>

      {lesson.visual && (
        <div className="mt-5">
          <LessonVisual spec={lesson.visual} />
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3.5">
        {blocks.map((group, i) =>
          group[0].startsWith('- ') ? (
            <ul key={i} className="flex flex-col gap-2 pl-1">
              {group.map((line, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-felt-400" />
                  <ContentBlock text={line} />
                </li>
              ))}
            </ul>
          ) : (
            <ContentBlock key={i} text={group[0]} />
          )
        )}
      </div>

      {lesson.check && (
        <div className="mt-7 rounded-[var(--radius-md)] bg-ink-850 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brass-400">Check your understanding</div>
          <p className="mt-2 text-[14px] font-medium text-ivory-100">{lesson.check.question}</p>
          <div className="mt-3 flex flex-col gap-2">
            {lesson.check.options.map((opt, i) => {
              const isCorrect = i === lesson.check!.correctIndex;
              const showState = submitted;
              return (
                <button
                  key={i}
                  onClick={() => !submitted && setSelected(i)}
                  className={clsx(
                    'rounded-[var(--radius-sm)] px-3.5 py-2.5 text-left text-[13.5px] transition-colors',
                    showState && isCorrect
                      ? 'bg-felt-800/60 text-felt-100 ring-1 ring-felt-500/50'
                      : showState && selected === i
                        ? 'bg-burgundy-600/30 text-burgundy-200 ring-1 ring-burgundy-500/40'
                        : selected === i
                          ? 'bg-ink-700 text-ivory-100 ring-1 ring-brass-400/40'
                          : 'bg-ink-800/70 text-sand-300 hover:bg-ink-700/70'
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {!submitted ? (
            <button
              onClick={submitAnswer}
              disabled={selected === null}
              className="mt-3.5 rounded-[var(--radius-sm)] bg-felt-500 px-4 py-2 text-[13px] font-semibold text-ivory-100 transition-colors hover:bg-felt-400 disabled:opacity-40"
            >
              Submit answer
            </button>
          ) : (
            <div className="mt-3.5 flex gap-2.5 rounded-[var(--radius-sm)] bg-ink-800/70 p-3">
              <Icon name={selected === lesson.check.correctIndex ? 'check' : 'chevron'} size={16} className={selected === lesson.check.correctIndex ? 'mt-0.5 shrink-0 text-felt-400' : 'mt-0.5 shrink-0 text-brass-400'} />
              <p className="text-[13px] leading-relaxed text-sand-300">{lesson.check.explanation}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-7 flex items-center justify-between">
        {!lesson.check && !isDone && (
          <button onClick={markDone} className="rounded-[var(--radius-sm)] bg-felt-500 px-4 py-2 text-[13px] font-semibold text-ivory-100 hover:bg-felt-400">
            Mark as read
          </button>
        )}
        <div className="flex-1" />
        {nextLesson && (
          <button
            onClick={() => navigate(`/learn/${nextLesson.levelId}/${nextLesson.lessonId}`)}
            className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-ink-800 px-4 py-2 text-[13px] font-medium text-sand-200 hover:bg-ink-700"
          >
            Next lesson
            <Icon name="chevron" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
