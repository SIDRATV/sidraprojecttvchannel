#!/bin/bash
# ═══════════════════════════════════════════════════════════
# VPS Deploy Script — called by GitHub Actions after push
# Pulls latest code, installs deps, restarts scanner via PM2
# ═══════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="/opt/sidra"
SCANNER_DIR="$APP_DIR/scanner"
LOG_DIR="$APP_DIR/logs"
REPO_URL="https://github.com/SIDRATV/sidraprojecttvchannel.git"
BRANCH="main"

echo "═══ Deploy started at $(date -u) ═══"

# Ensure directories exist
mkdir -p "$APP_DIR" "$LOG_DIR"

# Clone or pull latest code
if [ -d "$APP_DIR/.git" ]; then
  echo "→ Pulling latest code..."
  cd "$APP_DIR"
  git fetch origin "$BRANCH" --depth=1
  git reset --hard "origin/$BRANCH"
else
  echo "→ Cloning repository..."
  git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

# Install scanner dependencies
echo "→ Installing scanner dependencies..."
cd "$SCANNER_DIR"
npm ci --production

# Ensure .env exists
if [ ! -f "$SCANNER_DIR/.env" ]; then
  echo "⚠ WARNING: $SCANNER_DIR/.env not found!"
  echo "  Run setup-vps.sh first or create it manually."
  exit 1
fi

# Restart scanner with PM2
echo "→ Restarting blockchain scanner..."
if pm2 describe blockchain-scanner > /dev/null 2>&1; then
  pm2 restart ecosystem.config.js
else
  pm2 start ecosystem.config.js
fi

pm2 save

echo "═══ Deploy completed at $(date -u) ═══"
pm2 status
