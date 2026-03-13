import type { LessonModule } from "../types";

export const LESSONS: LessonModule[] = [
  {
    id: "opening-center-control",
    title: "Control the Center",
    theme: "opening_principles",
    difficulty: "beginner",
    objective: "Learn why central pawns and piece activity matter in the opening.",
    checklist: [
      "Play a central pawn in the first two moves",
      "Develop two minor pieces before move 8",
      "Avoid moving the same piece repeatedly without a reason"
    ]
  },
  {
    id: "opening-king-safety",
    title: "Castle Early, Stay Safe",
    theme: "opening_principles",
    difficulty: "beginner",
    objective: "Build a habit of castling and reducing king exposure.",
    checklist: [
      "Castle by move 10",
      "Do not weaken the king with unnecessary pawn pushes",
      "Connect rooks before forcing play"
    ]
  },
  {
    id: "tactics-forks",
    title: "Forks and Double Attacks",
    theme: "tactics",
    difficulty: "beginner",
    objective: "Spot opportunities where one move attacks two targets.",
    checklist: [
      "Scan for checks, captures, and threats",
      "Look for knight forks on king and queen",
      "Verify your own pieces are defended"
    ]
  },
  {
    id: "tactics-pins",
    title: "Pins and Skewers",
    theme: "tactics",
    difficulty: "developing",
    objective: "Recognize line tactics that trap valuable pieces.",
    checklist: [
      "Identify pieces lined up on files or diagonals",
      "Use bishops, rooks, and queen to pin defenders",
      "Look for overloaded defenders before trading"
    ]
  },
  {
    id: "endgame-king-pawn",
    title: "King and Pawn Basics",
    theme: "endgame",
    difficulty: "beginner",
    objective: "Use opposition and king activity in simple pawn endings.",
    checklist: [
      "Bring king toward the center",
      "Use opposition to gain key squares",
      "Calculate pawn races before pushing"
    ]
  },
  {
    id: "endgame-rook-activity",
    title: "Simple Rook Endgames",
    theme: "endgame",
    difficulty: "intermediate",
    objective: "Prioritize rook activity and support of passed pawns.",
    checklist: [
      "Put the rook behind the passed pawn",
      "Activate the king early",
      "Avoid passive rook defense"
    ]
  }
];
