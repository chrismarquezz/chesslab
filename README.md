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
- **Game review**: Navigate moves, engine lines, move classifications, time insights, and opening explorer.
- **Sandbox mode**: Make your own moves (click or drag); engine and explorer follow the sandbox, and you can reset back to the game line.
- **Puzzle trainer**: Generates tactics from your own games with hints, solutions, and progress tracking.
- **Themes & pieces**: Custom board/piece themes, keyboard shortcuts, and UI settings modal.

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
