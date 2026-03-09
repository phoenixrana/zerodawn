import { LessonModule } from "../types";

export const LESSONS: LessonModule[] = [
  {
    id: "opening-center-control",
    title: "Control the Center",
    theme: "opening_principles",
    difficulty: "beginner",
    objective: "Learn why central pawns and piece activity matter in the opening.",
    checklist: [
      "Play a central pawn in first two moves",
      "Develop at least two minor pieces before move 8",
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
      "Do not push pawns near your king unless needed",
      "Connect rooks before launching an attack"
    ]
  },
  {
    id: "tactics-forks",
    title: "Forks and Double Attacks",
    theme: "tactics",
    difficulty: "beginner",
    objective: "Spot opportunities where one move attacks two targets.",
    checklist: [
      "Check every move for checks, captures, threats",
      "Look for knight forks on king and queen",
      "Verify your own pieces are not hanging"
    ]
  },
  {
    id: "tactics-pins-and-skewers",
    title: "Pins and Skewers",
    theme: "tactics",
    difficulty: "developing",
    objective: "Recognize line tactics that trap valuable pieces.",
    checklist: [
      "Identify pieces behind defended targets",
      "Use bishops/rooks/queen to pin defenders",
      "Scan for tactical shots before trading"
    ]
  },
  {
    id: "endgame-king-pawn",
    title: "King and Pawn Basics",
    theme: "endgame",
    difficulty: "beginner",
    objective: "Use opposition and king activity to convert pawn endings.",
    checklist: [
      "Bring king toward center",
      "Use opposition to gain key squares",
      "Calculate pawn races before pushing"
    ]
  },
  {
    id: "endgame-rook-activity",
    title: "Simple Rook Endgames",
    theme: "endgame",
    difficulty: "intermediate",
    objective: "Prioritize active rook placement and passed pawn support.",
    checklist: [
      "Put rook behind passed pawn",
      "Keep king active",
      "Avoid passive rook defense"
    ]
  }
];