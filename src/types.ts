import type { Color, PieceSymbol, Square } from "chess.js";

export type DifficultyBand = "beginner" | "developing" | "intermediate";

export interface GameState {
  fen: string;
  pgn: string;
  turn: Color;
  moveCount: number;
  status: "active" | "checkmate" | "draw" | "stalemate";
}

export interface MoveAnalysis {
  move: string;
  bestMove?: string;
  evalBefore: number;
  evalAfter: number;
  evalSwing: number;
  classification: "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
  tacticalTheme?: string;
}

export interface CoachHint {
  type: "candidate_move" | "plan" | "tactical_warning" | "principle";
  title: string;
  message: string;
  suggestedMove?: string;
  actionableSteps: string[];
}

export interface LessonModule {
  id: string;
  title: string;
  theme: "opening_principles" | "tactics" | "endgame";
  difficulty: DifficultyBand;
  objective: string;
  checklist: string[];
}

export interface ReviewReport {
  summary: string;
  turningPoints: MoveAnalysis[];
  nextTacticalTheme: string;
  openingPrinciple: string;
  endgameTakeaway: string;
}

export interface TrainingProfile {
  id: string;
  createdAt: string;
  trainingRating: number;
  gamesPlayed: number;
  streakDays: number;
  completedLessons: string[];
  tacticalScore: number;
  accuracyHistory: number[];
  weeklyTargetGames: number;
  weekGamesCompleted: number;
  difficulty: DifficultyBand;
}

export interface StoredGame {
  id: string;
  playedAt: string;
  pgn: string;
  result: "win" | "loss" | "draw";
  review?: ReviewReport;
}

export interface BoardPiece {
  square: Square;
  type: PieceSymbol;
  color: Color;
}

export interface HintContext {
  fen: string;
  legalMoves: string[];
  profile: TrainingProfile;
}

export interface ReviewContext {
  pgn: string;
  analyses: MoveAnalysis[];
}
