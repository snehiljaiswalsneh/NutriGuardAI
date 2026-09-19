#!/usr/bin/env bash
# =====================================================================
# NutriGuard AI — Double-click to Launch App (macOS)
# =====================================================================
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "================================================="
echo "   Starting NutriGuard AI (Backend & Frontend)   "
echo "================================================="
echo ""

# Ensure dependencies are available
if [ ! -d "nutriguard-backend/node_modules" ] || [ ! -d "nutriguard-frontend/node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Open the browser automatically after 2 seconds
(sleep 2 && open "http://localhost:5173") &

# Start both servers concurrently
npm run dev
