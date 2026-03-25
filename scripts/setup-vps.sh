#!/bin/bash
# ═══════════════════════════════════════════════════════════
# VPS Initial Setup — run ONCE on new VPS
# Installs Node.js, PM2, Git, creates .env, starts scanner
# ═══════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="/opt/sidra"
SCANNER_DIR="$APP_DIR/scanner"
LOG_DIR="$APP_DIR/logs"

echo "═══ VPS Setup for Sidra Scanner ═══"

# 1. System packages
echo "→ Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq curl git

# 2. Node.js 20 LTS
if ! command -v node &> /dev/null; then
  echo "→ Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
echo "  Node $(node -v) — npm $(npm -v)"

# 3. PM2
if ! command -v pm2 &> /dev/null; then
  echo "→ Installing PM2..."
  npm install -g pm2
fi
echo "  PM2 $(pm2 -v)"

# 4. Create directories
mkdir -p "$APP_DIR" "$LOG_DIR"

# 5. Clone repo
if [ ! -d "$APP_DIR/.git" ]; then
  echo "→ Cloning repository..."
  git clone --depth=1 --branch main https://github.com/SIDRATV/sidraprojecttvchannel.git "$APP_DIR"
else
  echo "→ Pulling latest..."
  cd "$APP_DIR" && git pull origin main
fi

# 6. Install scanner deps
echo "→ Installing scanner dependencies..."
cd "$SCANNER_DIR"
npm ci --production

# 7. Create .env file (fill in your real values)
if [ ! -f "$SCANNER_DIR/.env" ]; then
  echo "→ Creating .env template..."
  cat > "$SCANNER_DIR/.env" << 'ENVEOF'
# ─── Supabase ──────────────────────────────────────
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# ─── RPC URLs ─────────────────────────────────────
RPC_URL_SIDRA=https://node.sidrachain.com
RPC_URL_BSC=https://bsc-dataseed.binance.org

# ─── Hot Wallet Private Keys ─────────────────────
HOT_WALLET_PRIVATE_KEY_SIDRA=YOUR_SIDRA_HOT_WALLET_PRIVATE_KEY
HOT_WALLET_PRIVATE_KEY_BSC=YOUR_BSC_HOT_WALLET_PRIVATE_KEY

# ─── Encryption ──────────────────────────────────
ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY

# ─── Scanner ─────────────────────────────────────
SCAN_API_KEY=YOUR_SCAN_API_KEY
CRON_SECRET=YOUR_CRON_SECRET
ENVEOF
  chmod 600 "$SCANNER_DIR/.env"
  echo "  ⚠ EDIT $SCANNER_DIR/.env WITH YOUR REAL VALUES!"
else
  echo "  .env already exists"
fi

# 8. Setup PM2 startup on boot
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# 9. Start scanner
echo "→ Starting blockchain scanner..."
cd "$SCANNER_DIR"
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✓ VPS Setup Complete"
echo "  Scanner: pm2 status"
echo "  Logs:    pm2 logs blockchain-scanner"
echo "  Restart: pm2 restart blockchain-scanner"
echo "  .env:    $SCANNER_DIR/.env"
echo "═══════════════════════════════════════════════"
