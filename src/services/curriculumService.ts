import { LESSONS } from "../data/lessons";
import { LessonModule, TrainingProfile } from "../types";

export function getNextLesson(profile: TrainingProfile): LessonModule {
  const completed = new Set(profile.completedLessons);
  const candidates = LESSONS.filter((lesson) => !completed.has(lesson.id));

  if (candidates.length === 0) {
    return LESSONS[0];
  }

  const targetDifficulty = profile.difficulty;
  const matchingDifficulty = candidates.find((lesson) => lesson.difficulty === targetDifficulty);
  if (matchingDifficulty) {
    return matchingDifficulty;
  }

  return candidates[0];
}