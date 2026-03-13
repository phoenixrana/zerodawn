import { Chess } from "chess.js";
import type { CoachHint, MoveAnalysis, HintContext, ReviewContext, ReviewReport } from "../types";
import { EngineService } from "./engineService";

const COACH_API_URL = import.meta.env.VITE_COACH_API_URL as string | undefined;

async function tryCloudCoach(
  type: "hint" | "review",
  input: Record<string, unknown>
): Promise<string | null> {
  if (!COACH_API_URL) return null;

  try {
    const response = await fetch(COACH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, input })
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { message?: string };
    return data.message ?? null;
  } catch {
    return null;
  }
}

function strategicTheme(fen: string): string {
  const moveCount = new Chess(fen).history().length;
  if (moveCount < 12) return "opening-principles";
  if (moveCount < 28) return "tactical-awareness";
  return "endgame-activity";
}

function fallbackHint(analysis: MoveAnalysis): CoachHint {
  if (analysis.classification === "mistake" || analysis.classification === "blunder") {
    return {
      type: "tactical_warning",
      title: "Check tactical danger first",
      message:
        "This position is sharp. Before moving, scan every check, capture, and threat so you do not hang material.",
      suggestedMove: analysis.bestMove,
      actionableSteps: [
        "Ask what your opponent threatens right now",
        "Check whether any piece is undefended",
        "Prefer a safe developing move if the tactic is unclear"
      ]
    };
  }

  return {
    type: "candidate_move",
    title: "Solid improving move",
    message:
      "Look for a move that improves development, fights for the center, or gets your king safer.",
    suggestedMove: analysis.bestMove,
    actionableSteps: [
      "Develop a minor piece toward the center",
      "Castle if the king is still in the middle",
      "Avoid one-move threats that weaken your position"
    ]
  };
}

function openingPrinciple(analyses: MoveAnalysis[]): string {
  const seriousError = analyses.find(
    (item) => item.classification === "mistake" || item.classification === "blunder"
  );
  if (seriousError) {
    return "Develop pieces before starting pawn storms so your king and center stay protected.";
  }
  return "Fight for the center and complete development before looking for tactics.";
}

function endgameTakeaway(analyses: MoveAnalysis[]): string {
  const lateError = analyses
    .slice(Math.max(0, analyses.length - 15))
    .find((item) => item.classification === "mistake" || item.classification === "blunder");

  if (lateError) {
    return "In simplified positions, activate the king earlier and avoid passive defense.";
  }

  return "In endgames, improve king activity and support passed pawns with pieces.";
}

export class CoachService {
  constructor(private readonly engine: EngineService) {}

  async getHint(context: HintContext): Promise<CoachHint> {
    const engineLine = await this.engine.evaluatePosition(context.fen);
    const base = fallbackHint({
      move: "hint",
      bestMove: engineLine.bestMove,
      evalBefore: engineLine.evaluation,
      evalAfter: engineLine.evaluation,
      evalSwing: 0,
      classification: "good",
      tacticalTheme: strategicTheme(context.fen)
    });

    const cloud = await tryCloudCoach("hint", {
      fen: context.fen,
      legalMoves: context.legalMoves.slice(0, 12),
      difficulty: context.profile.difficulty,
      bestMove: engineLine.bestMove
    });

    return cloud ? { ...base, message: cloud } : base;
  }

  async buildReview(context: ReviewContext): Promise<ReviewReport> {
    const turningPoints = [...context.analyses]
      .filter((item) =>
        ["inaccuracy", "mistake", "blunder"].includes(item.classification)
      )
      .sort((a, b) => b.evalSwing - a.evalSwing)
      .slice(0, 3);

    const nextTacticalTheme = turningPoints[0]?.tacticalTheme ?? "hanging-piece-check";
    const fallbackSummary =
      turningPoints.length > 0
        ? "A few tactical mistakes changed the game. Slow down on forcing moves and scan what becomes undefended."
        : "This was a stable training game. Keep improving development and king safety habits.";

    const cloud = await tryCloudCoach("review", {
      pgn: context.pgn,
      turningPoints,
      tacticalTheme: nextTacticalTheme
    });

    return {
      summary: cloud ?? fallbackSummary,
      turningPoints,
      nextTacticalTheme,
      openingPrinciple: openingPrinciple(context.analyses),
      endgameTakeaway: endgameTakeaway(context.analyses)
    };
  }
}
