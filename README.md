# ChessLab

Personal chess analysis suite with game review, live engine lines, opening explorer, puzzle trainer, custom boards/pieces, and a sandbox to explore your own variations.

## Project structure
- `client/` – React + TypeScript + Vite frontend (review board, puzzle trainer, explorer, settings).
- `server/` – Express + TypeScript backend (Stockfish bridge, opening explorer proxy, analysis endpoints).

## Prerequisites
- Node.js 18+ and npm
- Stockfish available on the server machine (on `PATH` or via `STOCKFISH_PATH`)

## Setup
```bash
# Install dependencies
cd server && npm install
cd ../client && npm install
```

## Running locally
In one terminal, start the backend (defaults to http://localhost:5100):
```bash
cd server
npm start
```

In another terminal, start the frontend:
```bash
cd client
npm run dev
```
Then open the Vite dev URL (shown in the terminal, typically http://localhost:5173).

## Environment
- Frontend expects `VITE_SERVER_URL` (defaults to `http://localhost:5100`).
- Backend will auto-discover Stockfish on PATH; set `STOCKFISH_PATH` if needed.

## Key features
- **Game Review**: Engine lines, move classifications, time insights, and an opening explorer tied to the current position.
- **Sandbox**: Click or drag your own moves; engine and explorer follow the sandbox, with a quick reset back to the game line.
- **Puzzle Trainer**: Auto-builds tactics from your games with hints, solutions, and a progress tracker.
- **Themes & Shortcuts**: Custom board/piece themes and keyboard shortcuts for faster navigation.

## Feature highlights
- **Game Review**: Engine lines and move quality labels; opening explorer for the current FEN.
- **Sandbox**: Free-play on any position; engine/explorer stay in sync; reset to the main line anytime.
- **Puzzle Trainer**: User-game tactics with hint/solution flow and progress grid.
- **Themes & Shortcuts**: Board/piece theme picker and keyboard controls (Space, A, arrows, F, S).

## Keyboard shortcuts (review)
- Space: start/pause autoplay
- A: show/hide best-move arrow
- ← / →: previous / next move
- ↑ / ↓: first / last move
- F: flip board
- S: toggle settings

## Scripts
- `client`: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`
- `server`: `npm start` (runs `ts-node src/index.ts`)

## Notes
- Opening explorer is proxied through the backend.
- Stockfish depth/lines are capped server-side for responsiveness.

## Tech stack
- **Frontend**: React (Vite, TypeScript), Tailwind-ish styling, react-chessboard, chess.js, framer-motion, recharts, lucide-react.
- **Backend**: Express + TypeScript, Stockfish bridge for analysis/streaming eval, opening explorer proxy (lichess explorer).
