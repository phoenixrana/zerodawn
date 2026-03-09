import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";

describe("chess.js rule integrity", () => {
  it("handles castling legality", () => {
    const chess = new Chess("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    const moves = chess.moves();
    expect(moves).toContain("O-O");
    expect(moves).toContain("O-O-O");
  });

  it("handles en passant", () => {
    const chess = new Chess();
    chess.move("e4");
    chess.move("a5");
    chess.move("e5");
    chess.move("d5");
    const moves = chess.moves();
    expect(moves).toContain("exd6");
  });

  it("detects checkmate", () => {
    const chess = new Chess();
    chess.move("f3");
    chess.move("e5");
    chess.move("g4");
    chess.move("Qh4#");
    expect(chess.isCheckmate()).toBe(true);
  });
});