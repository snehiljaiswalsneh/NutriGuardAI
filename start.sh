#!/usr/bin/env bash
# =====================================================================
# NutriGuard AI — Start Background Services
# =====================================================================
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

node scripts/start-daemon.mjs

echo "NutriGuard AI is running:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
