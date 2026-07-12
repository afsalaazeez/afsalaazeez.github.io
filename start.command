#!/bin/bash
#
# start.command — double-click this in Finder to launch the portfolio.
#
# macOS runs *.command files in Terminal on double-click. This changes into
# the project folder, starts the Vite dev server, and opens the site in your
# browser. Keep the Terminal window open while you work; close it (or press
# Ctrl-C) to stop the server.
#
cd "$(dirname "$0")" || exit 1

# Open the site once Vite has had a moment to boot.
( sleep 3; open "http://localhost:5173" >/dev/null 2>&1 ) &

exec ./start.sh --port 5173 --strictPort
