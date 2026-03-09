import { useMemo, useState } from "react";
import { Chess, Square } from "chess.js";
import { ChessBoard3D } from "./components/ChessBoard3D";
import { CoachService } from "./services/coachService";
import { getNextLesson } from "./services/curriculumService";
import { EngineService } from "./services/engineService";
import { applySessionOutcome, markLessonComplete } from "./services/progressService";
import { loadGames, loadProfile, saveGame, saveProfile } from "./services/storageService";
import { BoardPiece, CoachHint, MoveAnalysis, ReviewReport, StoredGame, TrainingProfile } from "./types";

const engine = new EngineService();
const coach = new CoachService(engine);

function boardPieces(chess: Chess): BoardPiece[] {
  const board = chess.board();
  const pieces: BoardPiece[] = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const cell = board[r][c];
      if (!cell) {
        continue;
      }
      const square = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
      pieces.push({
        square,
        color: cell.color,
        type: cell.type
      });
    }
  }
  return pieces;
}

function outcomeFromResult(result: string): StoredGame["result"] {
  if (result === "1-0") {
    return "win";
  }
  if (result === "0-1") {
    return "loss";
  }
  return "draw";
}

function calculateAccuracy(analyses: MoveAnalysis[]): number {
  if (analyses.length === 0) {
    return 70;
  }
  const penalties = analyses.reduce((sum, item) => {
    if (item.classification === "blunder") return sum + 18;
    if (item.classification === "mistake") return sum + 10;
    if (item.classification === "inaccuracy") return sum + 4;
    return sum;
  }, 0);
  return Math.max(35, Math.min(96, Math.round(100 - penalties / analyses.length)));
}

export default function App() {
  const [profile, setProfile] = useState<TrainingProfile>(() => loadProfile());
  const [games, setGames] = useState<StoredGame[]>(() => loadGames());
  const [chess, setChess] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string>();
  const [analyses, setAnalyses] = useState<MoveAnalysis[]>([]);
  const [feedback, setFeedback] = useState<string>("Welcome. Start with center control and quick development.");
  const [hint, setHint] = useState<CoachHint | null>(null);
  const [review, setReview] = useState<ReviewReport | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  const legalTargets = useMemo(() => {
    if (!selectedSquare) {
      return [];
    }
    return chess
      .moves({ square: selectedSquare as Square, verbose: true })
      .map((move) => move.to)
      .filter(Boolean);
  }, [chess, selectedSquare]);

  const pieces = useMemo(() => boardPieces(chess), [chess]);

  const nextLesson = useMemo(() => getNextLesson(profile), [profile]);

  async function attemptMove(from: Square, to: Square): Promise<void> {
    const beforeFen = chess.fen();
    const clone = new Chess(beforeFen);
    const move = clone.move({ from, to, promotion: "q" });
    if (!move) {
      return;
    }

    setChess(clone);
    setSelectedSquare(undefined);

    const moveAnalysis = await engine.analyzeMove(beforeFen, move.san, clone.fen());
    setAnalyses((prev) => [...prev, moveAnalysis]);

    if (moveAnalysis.classification === "mistake" || moveAnalysis.classification === "blunder") {
      setFeedback(
        `Coach: ${moveAnalysis.classification.toUpperCase()} detected. Consider ${moveAnalysis.bestMove ?? "improving piece safety"}.`
      );
    } else {
      setFeedback(`Coach: ${moveAnalysis.classification}. Keep building pressure and king safety.`);
    }

    if (clone.isGameOver()) {
      await finalizeGame(clone, [...analyses, moveAnalysis]);
    }
  }

  async function finalizeGame(game: Chess, moveAnalyses: MoveAnalysis[]): Promise<void> {
    const report = await coach.buildReview({ pgn: game.pgn(), analyses: moveAnalyses });
    setReview(report);

    const accuracy = calculateAccuracy(moveAnalyses);
    const tacticalScore = moveAnalyses.reduce((sum, item) => {
      if (item.classification === "excellent" || item.classification === "good") {
        return sum + 1;
      }
      if (item.classification === "blunder") {
        return sum - 1;
      }
      return sum;
    }, 0);

    const updatedProfile = applySessionOutcome(profile, {
      accuracy,
      tacticalScore,
      playedToday: true
    });

    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    const storedGame: StoredGame = {
      id: `${Date.now()}`,
      playedAt: new Date().toISOString(),
      pgn: game.pgn(),
      result: outcomeFromResult(game.header().Result ?? "1/2-1/2"),
      review: report
    };

    const nextGames = saveGame(storedGame);
    setGames(nextGames);
  }

  async function handleHint(): Promise<void> {
    setLoadingHint(true);
    const generated = await coach.getHint({
      fen: chess.fen(),
      legalMoves: chess.moves(),
      profile
    });
    setHint(generated);
    setFeedback(`Coach hint: ${generated.message}`);
    setLoadingHint(false);
  }

  function handleSquareClick(square: string): void {
    const piece = chess.get(square as Square);

    if (!selectedSquare) {
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(undefined);
      return;
    }

    const selectedPiece = chess.get(selectedSquare as Square);
    if (piece && selectedPiece && piece.color === selectedPiece.color) {
      setSelectedSquare(square);
      return;
    }

    void attemptMove(selectedSquare as Square, square as Square);
  }

  function resetGame(): void {
    setChess(new Chess());
    setSelectedSquare(undefined);
    setAnalyses([]);
    setHint(null);
    setReview(null);
    setFeedback("New game started. Focus on development and king safety.");
  }

  function completeLesson(): void {
    const updated = markLessonComplete(profile, nextLesson.id);
    setProfile(updated);
    saveProfile(updated);
    setFeedback(`Lesson complete: ${nextLesson.title}. Rating bonus applied.`);
  }

  return (
    <main className="app-shell">
      <section className="board-panel">
        <h1>3D Chess Coach Trainer</h1>
        <p className="subtitle">Target: move from 500 to 1000 with guided fundamentals.</p>
        <div className="board-wrap">
          <ChessBoard3D
            pieces={pieces}
            selectedSquare={selectedSquare}
            legalTargets={legalTargets}
            onSquareClick={handleSquareClick}
          />
        </div>
        <div className="controls">
          <button onClick={handleHint} disabled={loadingHint}>
            {loadingHint ? "Thinking..." : "Hint"}
          </button>
          <button onClick={resetGame}>New Game</button>
          <button onClick={completeLesson}>Mark Lesson Done</button>
        </div>
      </section>

      <section className="sidebar">
        <article className="card">
          <h2>Coach Feed</h2>
          <p>{feedback}</p>
          {hint ? (
            <div className="hint-box">
              <strong>{hint.title}</strong>
              <p>{hint.message}</p>
              {hint.suggestedMove ? <p>Suggested: {hint.suggestedMove}</p> : null}
            </div>
          ) : null}
        </article>

        <article className="card">
          <h2>Training Profile</h2>
          <ul>
            <li>Training Rating: {profile.trainingRating}</li>
            <li>Difficulty: {profile.difficulty}</li>
            <li>Games Played: {profile.gamesPlayed}</li>
            <li>Streak Days: {profile.streakDays}</li>
            <li>
              Weekly Goal: {profile.weekGamesCompleted}/{profile.weeklyTargetGames}
            </li>
          </ul>
        </article>

        <article className="card">
          <h2>Next Lesson</h2>
          <p>{nextLesson.title}</p>
          <p>{nextLesson.objective}</p>
          <ul>
            {nextLesson.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        {review ? (
          <article className="card review">
            <h2>Post Game Review</h2>
            <p>{review.summary}</p>
            <p>Tactical theme: {review.nextTacticalTheme}</p>
            <p>Opening principle: {review.openingPrinciple}</p>
            <p>Endgame takeaway: {review.endgameTakeaway}</p>
            <h3>Turning Points</h3>
            <ol>
              {review.turningPoints.map((point, index) => (
                <li key={`${point.move}-${index}`}>
                  {point.move} ({point.classification}, swing {point.evalSwing})
                </li>
              ))}
            </ol>
          </article>
        ) : null}

        <article className="card">
          <h2>Recent Games</h2>
          <ul>
            {games.slice(0, 5).map((game) => (
              <li key={game.id}>
                {new Date(game.playedAt).toLocaleDateString()} - {game.result}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}