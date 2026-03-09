import { Chess } from "chess.js";
import { CoachHint, HintContext, MoveAnalysis, ReviewContext, ReviewReport } from "../types";
import { EngineService } from "./engineService";

const COACH_API_URL = import.meta.env.VITE_COACH_API_URL as string | undefined;

interface CoachMessagePayload {
  type: "hint" | "review";
  input: Record<string, unknown>;
}

async function tryCloudCoach(payload: CoachMessagePayload): Promise<string | null> {
  if (!COACH_API_URL) {
    return null;
  }

  try {
    const response = await fetch(COACH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { message?: string };
    return data.message ?? null;
  } catch {
    return null;
  }
}

function beginnerMessageFromAnalysis(analysis: MoveAnalysis): CoachHint {
  if (analysis.classification === "blunder" || analysis.classification === "mistake") {
    return {
      type: "tactical_warning",
      title: "Watch for tactical danger",
      message: "This move likely loses too much value. Slow down and re-check checks, captures, and threats.",
      suggestedMove: analysis.bestMove,
      actionableSteps: [
        "Look at all forcing moves before you commit",
        "Check if any piece is left undefended",
        "Prefer safer development if no tactic is clear"
      ]
    };
  }

  return {
    type: "candidate_move",
    title: "Solid training move",
    message: "Play moves that improve piece activity and king safety.",
    suggestedMove: analysis.bestMove,
    actionableSteps: [
      "Develop a minor piece toward the center",
      "Castle if your king is still in the center",
      "Avoid one-move threats that weaken your position"
    ]
  };
}

function detectStrategicTheme(fen: string): string {
  const chess = new Chess(fen);
  const moveCount = chess.history().length;
  if (moveCount < 12) {
    return "opening-principles";
  }
  if (moveCount < 28) {
    return "tactical-awareness";
  }
  return "endgame-activity";
}

function pickOpeningPrinciple(analyses: MoveAnalysis[]): string {
  const heavy = analyses.find((item) => item.classification === "mistake" || item.classification === "blunder");
  if (heavy) {
    return "Develop pieces before launching pawn attacks to avoid tactical collapses.";
  }
  return "Control the center and finish development before move 10 whenever possible.";
}

function pickEndgameTakeaway(analyses: MoveAnalysis[]): string {
  const endgameMistake = analyses
    .slice(Math.max(0, analyses.length - 15))
    .find((item) => item.classification === "mistake" || item.classification === "blunder");

  if (endgameMistake) {
    return "In simplified positions, activate your king earlier and avoid passive piece placement.";
  }
  return "In endgames, improve king activity and push passed pawns with piece support.";
}

export class CoachService {
  constructor(private readonly engine: EngineService) {}

  async getHint(context: HintContext): Promise<CoachHint> {
    const engineLine = await this.engine.evaluatePosition(context.fen);
    const moveAnalysis: MoveAnalysis = {
      move: "hint",
      bestMove: engineLine.bestMove,
      evalBefore: engineLine.evaluation,
      evalAfter: engineLine.evaluation,
      evalSwing: 0,
      classification: "good",
      tacticalTheme: detectStrategicTheme(context.fen)
    };

    const fallback = beginnerMessageFromAnalysis(moveAnalysis);

    const cloudMessage = await tryCloudCoach({
      type: "hint",
      input: {
        fen: context.fen,
        legalMoves: context.legalMoves.slice(0, 12),
        difficulty: context.profile.difficulty,
        bestMove: engineLine.bestMove
      }
    });

    if (!cloudMessage) {
      return fallback;
    }

    return {
      ...fallback,
      message: cloudMessage
    };
  }

  async buildReview(context: ReviewContext): Promise<ReviewReport> {
    const sorted = [...context.analyses]
      .filter((item) => item.classification === "blunder" || item.classification === "mistake" || item.classification === "inaccuracy")
      .sort((a, b) => b.evalSwing - a.evalSwing);

    const turningPoints = sorted.slice(0, 3);
    const nextTacticalTheme = turningPoints[0]?.tacticalTheme ?? "hanging-piece-check";

    const fallbackSummary =
      turningPoints.length > 0
        ? "You had strong chances, but a few tactical slips changed the game. Focus on forcing moves before every decision."
        : "You played a stable training game. Keep improving calculation speed and king safety habits.";

    const cloudMessage = await tryCloudCoach({
      type: "review",
      input: {
        pgn: context.pgn,
        turningPoints,
        tacticalTheme: nextTacticalTheme
      }
    });

    return {
      summary: cloudMessage ?? fallbackSummary,
      turningPoints,
      nextTacticalTheme,
      openingPrinciple: pickOpeningPrinciple(context.analyses),
      endgameTakeaway: pickEndgameTakeaway(context.analyses)
    };
  }
}