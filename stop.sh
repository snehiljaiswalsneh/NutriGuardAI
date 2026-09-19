#!/usr/bin/env bash
# =====================================================================
# NutriGuard AI — Stop Background Services
# =====================================================================
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

node scripts/stop-daemon.mjs
