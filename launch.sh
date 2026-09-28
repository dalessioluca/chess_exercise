#!/usr/bin/env bash
# Launches the Chess Visualization Trainer: starts a local web server
# and opens it in the default browser.
set -euo pipefail

PORT="${1:-8934}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URL="http://localhost:${PORT}"

cd "$DIR"

echo "Starting Chess Visualization Trainer at ${URL}"
echo "Press Ctrl+C to stop."

# Open the browser shortly after the server comes up.
(
  sleep 1
  if command -v open >/dev/null 2>&1; then
    open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"
  fi
) &

exec python3 -m http.server "$PORT"
