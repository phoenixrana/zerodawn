import type { Square } from "chess.js";
import type { BoardPiece } from "../types";

interface ChessBoard2DProps {
  pieces: BoardPiece[];
  legalTargets: string[];
  selectedSquare?: string;
  lastMoveSquares?: string[];
  disabled?: boolean;
  onSquareClick: (square: string) => void;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const PIECE_LABEL: Record<string, string> = {
  wp: "P",
  wn: "N",
  wb: "B",
  wr: "R",
  wq: "Q",
  wk: "K",
  bp: "P",
  bn: "N",
  bb: "B",
  br: "R",
  bq: "Q",
  bk: "K"
};

export function ChessBoard2D({
  pieces,
  legalTargets,
  selectedSquare,
  lastMoveSquares = [],
  disabled = false,
  onSquareClick
}: ChessBoard2DProps) {
  const pieceMap = new Map(pieces.map((piece) => [piece.square, piece]));

  return (
    <div className="board2d" role="grid" aria-label="Chess board">
      {RANKS.map((rank) =>
        FILES.map((file, fileIndex) => {
          const square = `${file}${rank}` as Square;
          const piece = pieceMap.get(square);
          const isDark = (fileIndex + rank) % 2 === 0;
          const isSelected = selectedSquare === square;
          const isTarget = legalTargets.includes(square);
          const isCaptureTarget = isTarget && Boolean(piece);
          const isLastMove = lastMoveSquares.includes(square);
          const pieceTone = piece?.color === "w" ? "white" : "black";
          const showFile = rank === 1;
          const showRank = file === "a";

          return (
            <button
              key={square}
              type="button"
              data-square={square}
              aria-label={
                piece
                  ? `${piece.color === "w" ? "White" : "Black"} ${piece.type} on ${square}`
                  : `Square ${square}`
              }
              className={[
                "board2d-square",
                isDark ? "dark" : "light",
                isSelected ? "selected" : "",
                isTarget ? "target" : "",
                isCaptureTarget ? "capture-target" : "",
                isLastMove ? "last-move" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSquareClick(square)}
              disabled={disabled}
            >
              {piece ? (
                <span className={`board2d-piece ${pieceTone}`}>
                  {PIECE_LABEL[`${piece.color}${piece.type}`]}
                </span>
              ) : null}
              {showFile ? <span className="board2d-file">{file}</span> : null}
              {showRank ? <span className="board2d-rank">{rank}</span> : null}
            </button>
          );
        })
      )}
    </div>
  );
}
