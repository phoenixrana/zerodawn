import { StoredGame, TrainingProfile } from "../types";
import { createDefaultProfile } from "./progressService";

const PROFILE_KEY = "chess-coach-profile";
const GAMES_KEY = "chess-coach-games";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadProfile(): TrainingProfile {
  return safeParse(localStorage.getItem(PROFILE_KEY), createDefaultProfile());
}

export function saveProfile(profile: TrainingProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadGames(): StoredGame[] {
  return safeParse(localStorage.getItem(GAMES_KEY), [] as StoredGame[]);
}

export function saveGame(game: StoredGame): StoredGame[] {
  const games = loadGames();
  const next = [game, ...games].slice(0, 50);
  localStorage.setItem(GAMES_KEY, JSON.stringify(next));
  return next;
}