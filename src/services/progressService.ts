import { TrainingProfile } from "../types";

interface SessionOutcome {
  accuracy: number;
  tacticalScore: number;
  playedToday: boolean;
}

const DEFAULT_TARGET = 10;

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
    weeklyTargetGames: DEFAULT_TARGET,
    weekGamesCompleted: 0,
    difficulty: "beginner"
  };
}

function getDifficulty(rating: number): TrainingProfile["difficulty"] {
  if (rating < 850) {
    return "beginner";
  }
  if (rating < 1200) {
    return "developing";
  }
  return "intermediate";
}

export function applySessionOutcome(profile: TrainingProfile, outcome: SessionOutcome): TrainingProfile {
  const accuracyDelta = Math.round((outcome.accuracy - 70) * 1.4);
  const tacticalDelta = Math.round(outcome.tacticalScore * 4);
  const ratingGain = Math.max(-12, Math.min(28, accuracyDelta + tacticalDelta));

  const nextRating = Math.max(400, profile.trainingRating + ratingGain);
  const updatedHistory = [...profile.accuracyHistory, outcome.accuracy].slice(-30);

  return {
    ...profile,
    gamesPlayed: profile.gamesPlayed + 1,
    trainingRating: nextRating,
    tacticalScore: Math.max(0, profile.tacticalScore + outcome.tacticalScore),
    accuracyHistory: updatedHistory,
    weekGamesCompleted: profile.weekGamesCompleted + 1,
    streakDays: outcome.playedToday ? profile.streakDays + 1 : profile.streakDays,
    difficulty: getDifficulty(nextRating)
  };
}

export function markLessonComplete(profile: TrainingProfile, lessonId: string): TrainingProfile {
  if (profile.completedLessons.includes(lessonId)) {
    return profile;
  }

  const completedLessons = [...profile.completedLessons, lessonId];
  const bonus = 15;
  const nextRating = profile.trainingRating + bonus;

  return {
    ...profile,
    completedLessons,
    trainingRating: nextRating,
    difficulty: getDifficulty(nextRating)
  };
}