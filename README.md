# 3D Chess Coach Trainer (V1)

A web-first chess training app with a 3D board, move analysis, on-demand coaching hints, curriculum guidance, and local progress tracking.

## Stack
- React + TypeScript + Vite
- react-three-fiber + drei + three
- chess.js for rules/state
- Local persistence (localStorage)

## Features in this V1
- Playable 3D chessboard with legal move enforcement.
- Move-by-move classification (`excellent` to `blunder`) using evaluation swing.
- Hint-on-demand coaching with optional cloud LLM augmentation.
- Post-game review with top turning points + tactical/opening/endgame takeaways.
- Fundamentals-first curriculum and adaptive training rating.
- Anonymous local profile and recent game history.

## Optional cloud coach endpoint
Set `VITE_COACH_API_URL` in `.env` to enrich explanations.

Expected endpoint shape:
- Request: `{ type: "hint" | "review", input: { ... } }`
- Response: `{ message: "plain language coaching response" }`

## Run
```bash
npm install
npm run dev
```

## Test
```bash
npm run test
```