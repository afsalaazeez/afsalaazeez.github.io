#!/usr/bin/env bash
#
# start.sh — start the portfolio dev server (Vite).
#
# Usage:
#   ./start.sh                 # start the dev server on http://localhost:5173
#   ./start.sh --port 3000     # any extra args are passed straight to vite
#   ./start.sh --host          # expose on the local network
#
set -euo pipefail
cd "$(dirname "$0")"

# Install dependencies on first run.
if [ ! -d node_modules ]; then
  echo "→ Installing dependencies (first run)…"
  npm install
fi

echo "→ Starting Vite dev server…"
exec npm run dev -- "$@"
