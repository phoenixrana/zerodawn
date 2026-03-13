import { LESSONS } from "../data/lessons";
import type { LessonModule, TrainingProfile } from "../types";

export function getNextLesson(profile: TrainingProfile): LessonModule {
  const completed = new Set(profile.completedLessons);
  const remaining = LESSONS.filter((lesson) => !completed.has(lesson.id));

  if (remaining.length === 0) {
    return LESSONS[0];
  }

  return remaining.find((lesson) => lesson.difficulty === profile.difficulty) ?? remaining[0];
}
