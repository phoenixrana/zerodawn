import type { TrainingProfile } from "../types";

interface SessionOutcome {
  accuracy: number;
  tacticalScore: number;
  playedToday: boolean;
}

function getDifficulty(rating: number): TrainingProfile["difficulty"] {
  if (rating < 850) return "beginner";
  if (rating < 1200) return "developing";
  return "intermediate";
}

export function createDefaultProfile(): TrainingProfile {
  return {
    id: "local-anon",
    createdAt: new Date().toISOString(),
    trainingRating: 500,
    gamesPlayed: 0,
    streakDays: 1,
    completedLessons: [],
    tacticalScore: 0,
    accuracyHistory: [],
    weeklyTargetGames: 10,
    weekGamesCompleted: 0,
    difficulty: "beginner"
  };
}

export function applySessionOutcome(
  profile: TrainingProfile,
  outcome: SessionOutcome
): TrainingProfile {
  const accuracyDelta = Math.round((outcome.accuracy - 70) * 1.4);
  const tacticalDelta = Math.round(outcome.tacticalScore * 4);
  const ratingGain = Math.max(-12, Math.min(28, accuracyDelta + tacticalDelta));
  const nextRating = Math.max(400, profile.trainingRating + ratingGain);

  return {
    ...profile,
    trainingRating: nextRating,
    gamesPlayed: profile.gamesPlayed + 1,
    tacticalScore: Math.max(0, profile.tacticalScore + outcome.tacticalScore),
    accuracyHistory: [...profile.accuracyHistory, outcome.accuracy].slice(-30),
    weekGamesCompleted: profile.weekGamesCompleted + 1,
    streakDays: outcome.playedToday ? profile.streakDays + 1 : profile.streakDays,
    difficulty: getDifficulty(nextRating)
  };
}

export function markLessonComplete(profile: TrainingProfile, lessonId: string): TrainingProfile {
  if (profile.completedLessons.includes(lessonId)) {
    return profile;
  }

  const nextRating = profile.trainingRating + 15;
  return {
    ...profile,
    completedLessons: [...profile.completedLessons, lessonId],
    trainingRating: nextRating,
    difficulty: getDifficulty(nextRating)
  };
}
