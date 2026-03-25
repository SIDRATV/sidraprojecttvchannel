/**
 * Continuous Scanner Loop for VPS (PM2)
 * ======================================
 * Runs deposit scanning + withdrawal processing in a loop every 3 minutes.
 * Replaces the GitHub Actions cron — runs permanently on VPS via PM2.
 *
 * Uses the same index.js (deposit scanner) and process-withdrawals.js
 * that were previously called by GitHub Actions.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load .env file manually (PM2 env_file doesn't always propagate to child processes)
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const SCAN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

function timestamp() {
  return new Date().toISOString();
}

async function runCycle() {
  console.log(`\n[${timestamp()}] ═══ Scanner cycle starting ═══`);

  // Phase 1: Deposit scanner
  try {
    console.log(`[${timestamp()}] Running deposit scanner...`);
    execFileSync('node', [path.join(__dirname, 'index.js')], {
      stdio: 'inherit',
      env: process.env,
      timeout: 4 * 60 * 1000, // 4 min max
    });
    console.log(`[${timestamp()}] Deposit scanner completed`);
  } catch (err) {
    console.error(`[${timestamp()}] Deposit scanner error: ${err.message}`);
  }

  // Phase 2: Withdrawal processor
  try {
    console.log(`[${timestamp()}] Running withdrawal processor...`);
    execFileSync('node', [path.join(__dirname, 'process-withdrawals.js')], {
      stdio: 'inherit',
      env: process.env,
      timeout: 4 * 60 * 1000,
    });
    console.log(`[${timestamp()}] Withdrawal processor completed`);
  } catch (err) {
    console.error(`[${timestamp()}] Withdrawal processor error: ${err.message}`);
  }

  console.log(`[${timestamp()}] ═══ Cycle done — next in ${SCAN_INTERVAL_MS / 1000}s ═══`);
}

// Initial run + interval
runCycle().then(() => {
  setInterval(() => {
    runCycle().catch((err) => {
      console.error(`[${timestamp()}] Fatal cycle error: ${err.message}`);
    });
  }, SCAN_INTERVAL_MS);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`[${timestamp()}] Scanner stopped (SIGINT)`);
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log(`[${timestamp()}] Scanner stopped (SIGTERM)`);
  process.exit(0);
});
