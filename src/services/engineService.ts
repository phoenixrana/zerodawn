import { Chess, type Move } from "chess.js";
import type { MoveAnalysis } from "../types";

interface EngineResult {
  bestMove?: string;
  evaluation: number;
}

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0
};

const CENTER_BONUS: Record<string, number> = {
  d4: 24,
  e4: 24,
  d5: 24,
  e5: 24,
  c3: 14,
  d3: 14,
  e3: 14,
  f3: 14,
  c4: 14,
  f4: 14,
  c5: 14,
  f5: 14,
  c6: 14,
  d6: 14,
  e6: 14,
  f6: 14
};

function signedValue(color: "w" | "b", value: number): number {
  return color === "w" ? value : -value;
}

function detectTheme(move: Move): string | undefined {
  if (move.flags.includes("e") || move.flags.includes("c")) return "forcing-capture";
  if (move.san.includes("+")) return "check-pressure";
  if (move.piece === "n") return "knight-fork-pattern";
  return undefined;
}

function classifySwing(swing: number): MoveAnalysis["classification"] {
  if (swing <= 40) return "excellent";
  if (swing <= 100) return "good";
  if (swing <= 200) return "inaccuracy";
  if (swing <= 350) return "mistake";
  return "blunder";
}

function squareBonus(square: string): number {
  return CENTER_BONUS[square] ?? 0;
}

function openingMoveBonus(move: Move): number {
  if (move.san === "O-O" || move.san === "O-O-O") return 70;
  if (move.piece === "p" && ["d4", "e4", "d5", "e5"].includes(move.to)) return 42;
  if (move.piece === "n" && ["c3", "f3", "c6", "f6"].includes(move.to)) return 36;
  if (move.piece === "b" && ["c4", "f4", "c5", "f5", "e2", "d3", "e7", "d6"].includes(move.to)) {
    return 18;
  }
  if (move.flags.includes("c")) return 12;
  if (move.san.includes("+")) return 14;
  return 0;
}

function evaluatePosition(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === "w" ? -100000 : 100000;
  }

  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (!piece) continue;

      const square = `${String.fromCharCode(97 + file)}${8 - rank}`;
      score += signedValue(piece.color, PIECE_VALUE[piece.type] ?? 0);
      score += signedValue(piece.color, squareBonus(square));

      if (piece.type === "n" || piece.type === "b") {
        const homeRank = piece.color === "w" ? 1 : 8;
        if (Number(square[1]) !== homeRank) {
          score += signedValue(piece.color, 14);
        }
      }

      if (piece.type === "k") {
        const castledSquares = piece.color === "w" ? ["g1", "c1"] : ["g8", "c8"];
        if (castledSquares.includes(square)) {
          score += signedValue(piece.color, 28);
        }
      }
    }
  }

  const mobility = chess.moves().length;
  score += chess.turn() === "w" ? mobility * 2 : -mobility * 2;

  return score;
}

function search(chess: Chess, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess);
  }

  const maximizing = chess.turn() === "w";
  const moves = chess.moves({ verbose: true });

  if (maximizing) {
    let value = Number.NEGATIVE_INFINITY;
    for (const move of moves) {
      chess.move(move);
      value = Math.max(value, search(chess, depth - 1, alpha, beta));
      chess.undo();
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  let value = Number.POSITIVE_INFINITY;
  for (const move of moves) {
    chess.move(move);
    value = Math.min(value, search(chess, depth - 1, alpha, beta));
    chess.undo();
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return value;
}

export class EngineService {
  async chooseMove(fen: string): Promise<string | undefined> {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    const maximizing = chess.turn() === "w";
    let bestMove: string | undefined;
    let bestEval = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    let bestBonus = Number.NEGATIVE_INFINITY;

    for (const move of moves) {
      chess.move(move);
      const evaluation = search(chess, 1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
      chess.undo();

      const bonus = openingMoveBonus(move);
      const isBetter = maximizing ? evaluation > bestEval : evaluation < bestEval;
      const isTieBreak =
        evaluation === bestEval && bonus > bestBonus;

      if (bestMove === undefined || isBetter || isTieBreak) {
        bestMove = move.san;
        bestEval = evaluation;
        bestBonus = bonus;
      }
    }

    return bestMove;
  }

  async evaluatePosition(fen: string): Promise<EngineResult> {
    const chess = new Chess(fen);
    const bestMove = await this.chooseMove(fen);
    const evaluation = evaluatePosition(chess);
    return { bestMove, evaluation };
  }

  async analyzeMove(beforeFen: string, moveSan: string, afterFen: string): Promise<MoveAnalysis> {
    const before = await this.evaluatePosition(beforeFen);
    const after = await this.evaluatePosition(afterFen);
    const mover = new Chess(beforeFen).turn();
    const rawSwing =
      mover === "w" ? before.evaluation - after.evaluation : after.evaluation - before.evaluation;
    const evalSwing = Math.max(0, Math.round(rawSwing));

    const chess = new Chess(beforeFen);
    const move = chess
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
