import { Lesson, Level, CURRICULUM } from './data';

/** Estimated reading time from actual content length — not a fabricated number. */
export function estimateLessonMinutes(lesson: Lesson): number {
  const words = lesson.blocks.join(' ').split(/\s+/).length + (lesson.check ? 40 : 0);
  return Math.max(2, Math.round(words / 130));
}

export type LessonFormat = 'Lesson' | 'Interactive check';

export function lessonFormat(lesson: Lesson): LessonFormat {
  return lesson.check ? 'Interactive check' : 'Lesson';
}

export function levelMinutes(level: Level): number {
  return level.lessons.reduce((sum, l) => sum + estimateLessonMinutes(l), 0);
}

export type LessonState = 'completed' | 'recommended' | 'in-progress' | 'not-started';

export function lessonKey(levelId: string, lessonId: string): string {
  return `${levelId}/${lessonId}`;
}

export interface NextLesson {
  level: Level;
  lesson: Lesson;
}

/** First lesson in curriculum order that has not been completed. */
export function findNextLesson(completed: string[]): NextLesson | null {
  for (const level of CURRICULUM) {
    for (const lesson of level.lessons) {
      if (!completed.includes(lessonKey(level.id, lesson.id))) return { level, lesson };
    }
  }
  return null;
}

export function levelCompletion(level: Level, completed: string[]): { done: number; total: number; pct: number } {
  const done = level.lessons.filter((l) => completed.includes(lessonKey(level.id, l.id))).length;
  const total = level.lessons.length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}
