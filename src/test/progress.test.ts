import { describe, expect, it } from "vitest";
import { LESSONS } from "../data/lessons";
import { getNextLesson } from "../services/curriculumService";
import { EngineService } from "../services/engineService";
import { applySessionOutcome, createDefaultProfile, markLessonComplete } from "../services/progressService";

describe("progress and curriculum", () => {
  it("returns a beginner lesson for the default profile", () => {
    const lesson = getNextLesson(createDefaultProfile());
    expect(LESSONS.some((entry) => entry.id === lesson.id)).toBe(true);
    expect(lesson.difficulty).toBe("beginner");
  });

  it("increases rating after a strong session", () => {
    const base = createDefaultProfile();
    const updated = applySessionOutcome(base, {
      accuracy: 90,
      tacticalScore: 3,
      playedToday: true
    });

    expect(updated.trainingRating).toBeGreaterThan(base.trainingRating);
    expect(updated.gamesPlayed).toBe(1);
  });

  it("does not duplicate completed lessons", () => {
    const once = markLessonComplete(createDefaultProfile(), "opening-center-control");
    const twice = markLessonComplete(once, "opening-center-control");

    expect(once.completedLessons).toHaveLength(1);
    expect(twice.completedLessons).toHaveLength(1);
  });

  it("selects a legal engine move", async () => {
    const engine = new EngineService();
    const bestMove = await engine.chooseMove("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");

    expect(bestMove).toBeTruthy();
  });
});
