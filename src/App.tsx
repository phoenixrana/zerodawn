import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Brain, Flag, GraduationCap, History, Sparkles, Target } from "lucide-react";
import "./App.css";
import { ChessBoard2D } from "./components/ChessBoard2D";
import { ChessBoard3D } from "./components/ChessBoard3D";
import { CoachService } from "./services/coachService";
import { getNextLesson } from "./services/curriculumService";
import { EngineService } from "./services/engineService";
import { applySessionOutcome, markLessonComplete } from "./services/progressService";
import { loadGames, loadProfile, saveGame, saveProfile } from "./services/storageService";
import type {
  BoardPiece,
  CoachHint,
  MoveAnalysis,
  ReviewReport,
  StoredGame,
  TrainingProfile
} from "./types";

const engine = new EngineService();
const coach = new CoachService(engine);

function boardPieces(chess: Chess): BoardPiece[] {
  const board = chess.board();
  const pieces: BoardPiece[] = [];

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const cell = board[rank][file];
      if (!cell) continue;
      const square = `${String.fromCharCode(97 + file)}${8 - rank}` as Square;
      pieces.push({ square, type: cell.type, color: cell.color });
    }
  }

  return pieces;
}

function outcomeFromResult(result: string): StoredGame["result"] {
  if (result === "1-0") return "win";
  if (result === "0-1") return "loss";
  return "draw";
}

function calculateAccuracy(analyses: MoveAnalysis[]): number {
  if (analyses.length === 0) return 70;

  const penalties = analyses.reduce((sum, item) => {
    if (item.classification === "blunder") return sum + 18;
    if (item.classification === "mistake") return sum + 10;
    if (item.classification === "inaccuracy") return sum + 4;
    return sum;
  }, 0);

  return Math.max(35, Math.min(96, Math.round(100 - penalties / analyses.length)));
}

function StatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

export default function App() {
  const [boardMode, setBoardMode] = useState<"2d" | "3d">("2d");
  const [profile, setProfile] = useState<TrainingProfile>(() => loadProfile());
  const [games, setGames] = useState<StoredGame[]>(() => loadGames());
  const [chess, setChess] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string>();
  const [lastMoveSquares, setLastMoveSquares] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<MoveAnalysis[]>([]);
  const [feedback, setFeedback] = useState(
    "Start by occupying the center, developing knights and bishops, and castling early."
  );
  const [hint, setHint] = useState<CoachHint | null>(null);
  const [review, setReview] = useState<ReviewReport | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [isEngineThinking, setIsEngineThinking] = useState(false);

  const pieces = useMemo(() => boardPieces(chess), [chess]);
  const nextLesson = useMemo(() => getNextLesson(profile), [profile]);

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    return chess
      .moves({ square: selectedSquare as Square, verbose: true })
      .map((move) => move.to)
      .filter(Boolean);
  }, [chess, selectedSquare]);

  async function finalizeGame(game: Chess, nextAnalyses: MoveAnalysis[]): Promise<void> {
    const report = await coach.buildReview({ pgn: game.pgn(), analyses: nextAnalyses });
    setReview(report);

    const accuracy = calculateAccuracy(nextAnalyses);
    const tacticalScore = nextAnalyses.reduce((sum, item) => {
      if (item.classification === "excellent" || item.classification === "good") return sum + 1;
      if (item.classification === "blunder") return sum - 1;
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

    setGames(saveGame(storedGame));
  }

  async function runEngineReply(position: Chess, existingAnalyses: MoveAnalysis[]): Promise<void> {
    setIsEngineThinking(true);
    setFeedback("Coach: Black is thinking. Stay ready for the next training decision.");

    await new Promise((resolve) => window.setTimeout(resolve, 450));

    const bestMove = await engine.chooseMove(position.fen());
    if (!bestMove) {
      setIsEngineThinking(false);
      return;
    }

    const beforeFen = position.fen();
    const clone = new Chess(beforeFen);
    const reply = clone.move(bestMove);
    if (!reply) {
      setIsEngineThinking(false);
      return;
    }

    setChess(clone);
    setLastMoveSquares([reply.from, reply.to]);
    const replyAnalysis = await engine.analyzeMove(beforeFen, reply.san, clone.fen());
    const nextAnalyses = [...existingAnalyses, replyAnalysis];
    setAnalyses(nextAnalyses);
    setIsEngineThinking(false);

    if (clone.isGameOver()) {
      await finalizeGame(clone, nextAnalyses);
      return;
    }

    setFeedback(
      `Coach: Black played ${reply.san}. Your turn. Look for checks, captures, and safe developing moves.`
    );
  }

  async function attemptMove(from: Square, to: Square): Promise<void> {
    if (isEngineThinking) return;

    const beforeFen = chess.fen();
    const clone = new Chess(beforeFen);
    const move = clone.move({ from, to, promotion: "q" });
    if (!move) return;

    setChess(clone);
    setLastMoveSquares([move.from, move.to]);
    setSelectedSquare(undefined);

    const moveAnalysis = await engine.analyzeMove(beforeFen, move.san, clone.fen());
    const nextAnalyses = [...analyses, moveAnalysis];
    setAnalyses(nextAnalyses);

    if (moveAnalysis.classification === "mistake" || moveAnalysis.classification === "blunder") {
      setFeedback(
        `Coach alert: ${moveAnalysis.classification}. Recheck checks, captures, and undefended pieces. Better try: ${moveAnalysis.bestMove ?? "a safer developing move"}.`
      );
    } else {
      setFeedback(
        `Coach: ${moveAnalysis.classification}. Keep improving piece activity and king safety.`
      );
    }

    if (clone.isGameOver()) {
      await finalizeGame(clone, nextAnalyses);
      return;
    }

    if (clone.turn() === "b") {
      await runEngineReply(clone, nextAnalyses);
    }
  }

  function handleSquareClick(square: string): void {
    if (isEngineThinking || chess.turn() !== "w") {
      return;
    }

    const piece = chess.get(square as Square);

    if (!selectedSquare) {
      if (piece && piece.color === "w") {
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

  async function handleHint(): Promise<void> {
    if (isEngineThinking) {
      return;
    }

    setLoadingHint(true);
    const generated = await coach.getHint({
      fen: chess.fen(),
      legalMoves: chess.moves(),
      profile
    });
    setHint(generated);
    setFeedback(`Hint: ${generated.message}`);
    setLoadingHint(false);
  }

  function resetGame(): void {
    setChess(new Chess());
    setSelectedSquare(undefined);
    setLastMoveSquares([]);
    setAnalyses([]);
    setHint(null);
    setReview(null);
    setIsEngineThinking(false);
    setFeedback("New training game started. Develop cleanly and castle before forcing play.");
  }

  function completeLesson(): void {
    const updated = markLessonComplete(profile, nextLesson.id);
    setProfile(updated);
    saveProfile(updated);
    setFeedback(`Lesson completed: ${nextLesson.title}. Progress recorded.`);
  }

  const gameStatus = chess.isCheckmate()
    ? "Checkmate"
    : chess.isDraw()
      ? "Draw"
      : chess.isStalemate()
        ? "Stalemate"
        : isEngineThinking
          ? "Black is thinking"
          : chess.turn() === "w"
            ? "Your move"
            : "Black to move";

  return (
    <main className="trainer-shell">
      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">Adaptive Chess Trainer</p>
          <h1>3D Chess Coach</h1>
          <p className="hero-text">
            A web-first solo trainer built to take a 500-rated player toward 1000 with guided
            games, tactical correction, and lesson-driven progression.
          </p>
        </div>
        <div className="hero-stats">
          <StatCard label="Target Track" value="500 -> 1000" detail="3 month fundamentals push" />
          <StatCard label="Coaching Mode" value="Hint on demand" detail="Beginner-first language" />
          <StatCard label="Current Status" value={gameStatus} detail="You play White from the near side" />
        </div>
      </section>

      <section className="main-grid">
        <section className="board-column">
          <article className="board-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Live Board</p>
                <h2>Training game</h2>
              </div>
              <span className="status-pill">{gameStatus}</span>
            </div>
            <div className="view-toggle" role="tablist" aria-label="Board style">
              <button
                type="button"
                className={boardMode === "2d" ? "view-chip active" : "view-chip"}
                onClick={() => setBoardMode("2d")}
              >
                Classic board
              </button>
              <button
                type="button"
                className={boardMode === "3d" ? "view-chip active" : "view-chip"}
                onClick={() => setBoardMode("3d")}
              >
                3D board
              </button>
            </div>
            <p className="board-help">
              Click a white piece, then click one of the highlighted target squares. Black replies automatically.
            </p>
            <div className="board-wrap">
              {boardMode === "3d" ? (
                <ChessBoard3D
                  pieces={pieces}
                  legalTargets={legalTargets}
                  selectedSquare={selectedSquare}
                  onSquareClick={handleSquareClick}
                />
              ) : (
                <ChessBoard2D
                  pieces={pieces}
                  legalTargets={legalTargets}
                  selectedSquare={selectedSquare}
                  lastMoveSquares={lastMoveSquares}
                  disabled={isEngineThinking}
                  onSquareClick={handleSquareClick}
                />
              )}
            </div>
            <div className="toolbar">
              <button className="primary-button" onClick={() => void handleHint()} disabled={loadingHint}>
                <Sparkles size={16} />
                {loadingHint ? "Thinking..." : "Hint"}
              </button>
              <button className="secondary-button" onClick={resetGame}>
                <Flag size={16} />
                New game
              </button>
              <button className="secondary-button" onClick={completeLesson}>
                <GraduationCap size={16} />
                Mark lesson done
              </button>
            </div>
          </article>

          <article className="review-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Coach Feed</p>
                <h2>Move guidance</h2>
              </div>
              <Brain size={18} />
            </div>
            <p className="feedback">{feedback}</p>
            {hint ? (
              <div className="hint-panel">
                <strong>{hint.title}</strong>
                <p>{hint.message}</p>
                {hint.suggestedMove ? <p>Suggested move: {hint.suggestedMove}</p> : null}
                <ul>
                  {hint.actionableSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        </section>

        <aside className="sidebar">
          <article className="sidebar-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Training Profile</p>
                <h2>Progress</h2>
              </div>
              <Target size={18} />
            </div>
            <div className="profile-grid">
              <StatCard label="Rating" value={profile.trainingRating} detail={profile.difficulty} />
              <StatCard label="Games" value={profile.gamesPlayed} detail={`${profile.streakDays} day streak`} />
              <StatCard
                label="Weekly goal"
                value={`${profile.weekGamesCompleted}/${profile.weeklyTargetGames}`}
                detail="guided games completed"
              />
            </div>
          </article>

          <article className="sidebar-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Curriculum</p>
                <h2>Next lesson</h2>
              </div>
              <GraduationCap size={18} />
            </div>
            <p className="lesson-title">{nextLesson.title}</p>
            <p className="lesson-objective">{nextLesson.objective}</p>
            <ul className="checklist">
              {nextLesson.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          {review ? (
            <article className="sidebar-card review-sidebar">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Post Game Review</p>
                  <h2>Turning points</h2>
                </div>
                <Sparkles size={18} />
              </div>
              <p>{review.summary}</p>
              <p>Tactical theme: {review.nextTacticalTheme}</p>
              <p>Opening principle: {review.openingPrinciple}</p>
              <p>Endgame takeaway: {review.endgameTakeaway}</p>
              <ol className="turning-points">
                {review.turningPoints.map((point, index) => (
                  <li key={`${point.move}-${index}`}>
                    {point.move} - {point.classification} ({point.evalSwing} centipawns)
                  </li>
                ))}
              </ol>
            </article>
          ) : null}

          <article className="sidebar-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">History</p>
                <h2>Recent games</h2>
              </div>
              <History size={18} />
            </div>
            <ul className="history-list">
              {games.slice(0, 5).map((game) => (
                <li key={game.id}>
                  <span>{new Date(game.playedAt).toLocaleDateString()}</span>
                  <strong>{game.result}</strong>
                </li>
              ))}
              {games.length === 0 ? <li className="empty-history">No saved games yet.</li> : null}
            </ul>
          </article>
        </aside>
      </section>
    </main>
  );
}
