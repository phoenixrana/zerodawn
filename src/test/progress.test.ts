import { describe, expect, it } from "vitest";
import { LESSONS } from "../data/lessons";
import { getNextLesson } from "../services/curriculumService";
import { applySessionOutcome, createDefaultProfile, markLessonComplete } from "../services/progressService";

describe("progress and curriculum", () => {
  it("returns a lesson for current difficulty", () => {
    const profile = createDefaultProfile();
    const lesson = getNextLesson(profile);
    expect(LESSONS.some((item) => item.id === lesson.id)).toBe(true);
    expect(lesson.difficulty).toBe("beginner");
  });

  it("adjusts rating and difficulty from session outcomes", () => {
    const profile = createDefaultProfile();
    const updated = applySessionOutcome(profile, {
      accuracy: 90,
      tacticalScore: 3,
      playedToday: true
    });

    expect(updated.trainingRating).toBeGreaterThan(profile.trainingRating);
    expect(updated.gamesPlayed).toBe(1);
  });

  it("marks lesson complete only once", () => {
    const profile = createDefaultProfile();
    const once = markLessonComplete(profile, "opening-center-control");
    const twice = markLessonComplete(once, "opening-center-control");

    expect(once.completedLessons.length).toBe(1);
    expect(twice.completedLessons.length).toBe(1);
  });
});