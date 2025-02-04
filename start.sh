#!/bin/sh
set -e

echo "🚀 Starting Vite UI..."
npm run dev &  # Run Vite in the background

sleep 2  # Give Vite time to start

# Auto-detect host OS and open browser
if [ "$(uname)" = "Darwin" ]; then
  # macOS
  open http://localhost:5173/
elif [ "$(uname -s)" = "Linux" ]; then
  # Linux (Check if `xdg-open` is available)
  if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5173/
  else
    echo "❌ Could not auto-open browser. Open manually: http://localhost:5173/"
  fi
elif [ "$(uname -s)" = "MINGW64_NT"* ] || [ "$(uname -s)" = "MSYS_NT"* ] || [ "$(uname -s)" = "CYGWIN_NT"* ]; then
  # Windows (Git Bash, Cygwin, MSYS)
  start http://localhost:5173/
else
  echo "❌ Unknown OS. Open manually: http://localhost:5173/"
fi

wait  # Keep script running