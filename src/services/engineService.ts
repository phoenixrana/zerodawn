import { Chess, Move } from "chess.js";
import { MoveAnalysis } from "../types";

interface EngineResult {
  bestMove?: string;
  evaluation: number;
  principalVariation?: string[];
}

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0
};

function evaluateMaterial(fen: string): number {
  const board = new Chess(fen).board();
  let score = 0;
  for (const row of board) {
    for (const piece of row) {
      if (!piece) {
        continue;
      }
      const value = PIECE_VALUE[piece.type] ?? 0;
      score += piece.color === "w" ? value : -value;
    }
  }
  return score;
}

function classifySwing(swing: number): MoveAnalysis["classification"] {
  if (swing <= 40) {
    return "excellent";
  }
  if (swing <= 100) {
    return "good";
  }
  if (swing <= 200) {
    return "inaccuracy";
  }
  if (swing <= 350) {
    return "mistake";
  }
  return "blunder";
}

function detectTheme(move: Move): string | undefined {
  if (move.flags.includes("e") || move.flags.includes("c")) {
    return "forcing-capture";
  }
  if (move.san.includes("+")) {
    return "check-pressure";
  }
  if (move.piece === "n") {
    return "knight-fork-pattern";
  }
  return undefined;
}

export class EngineService {
  async evaluatePosition(fen: string): Promise<EngineResult> {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    let bestMove: string | undefined;
    let bestScore = chess.turn() === "w" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

    for (const move of moves) {
      chess.move(move);
      const score = evaluateMaterial(chess.fen());
      chess.undo();

      if (chess.turn() === "w") {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move.san;
        }
      } else if (score < bestScore) {
        bestScore = score;
        bestMove = move.san;
      }
    }

    const fallback = evaluateMaterial(fen);
    const evaluation = Number.isFinite(bestScore) ? bestScore : fallback;
    return {
      bestMove,
      evaluation,
      principalVariation: bestMove ? [bestMove] : undefined
    };
  }

  async analyzeMove(beforeFen: string, moveSan: string, afterFen: string): Promise<MoveAnalysis> {
    const before = await this.evaluatePosition(beforeFen);
    const after = await this.evaluatePosition(afterFen);
    const mover = new Chess(beforeFen).turn();
    const rawSwing = mover === "w" ? before.evaluation - after.evaluation : after.evaluation - before.evaluation;
    const evalSwing = Math.max(0, Math.round(rawSwing));

    const beforeChess = new Chess(beforeFen);
    const move = beforeChess
      .moves({ verbose: true })
      .find((candidate) => candidate.san === moveSan || `${candidate.from}${candidate.to}` === moveSan);

    return {
      move: moveSan,
      bestMove: before.bestMove,
      evalBefore: before.evaluation,
      evalAfter: after.evaluation,
      evalSwing,
      classification: classifySwing(evalSwing),
      tacticalTheme: move ? detectTheme(move) : undefined
    };
  }
}