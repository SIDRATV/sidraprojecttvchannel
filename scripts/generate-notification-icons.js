/**
 * Generates properly-sized PNG icons for PWA notifications and manifest.
 * Also generates a WAV notification sound.
 *
 * Run: node scripts/generate-notification-icons.js
 * Requires: sharp (already in node_modules)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function main() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const soundsDir = path.join(__dirname, '..', 'public', 'sounds');

  [iconsDir, soundsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const source = path.join(__dirname, '..', 'public', 'images', 'sda-logo.png');
  if (!fs.existsSync(source)) {
    console.error('❌ Source not found:', source);
    process.exit(1);
  }

  // Theme background color (#030712)
  const bg = { r: 3, g: 7, b: 18, alpha: 1 };
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

  console.log('📁 Output directory:', iconsDir);

  // ── Standard icons (any purpose) ────────────────────────────────────────────

  await sharp(source)
    .resize(192, 192, { fit: 'contain', background: bg })
    .png()
    .toFile(path.join(iconsDir, 'icon-192x192.png'));
  console.log('✅ icon-192x192.png');

  await sharp(source)
    .resize(512, 512, { fit: 'contain', background: bg })
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512.png'));
  console.log('✅ icon-512x512.png');

  // ── Maskable icons (logo at 80% with safe-zone padding) ─────────────────────
  // Safe zone: inner 80% of canvas — logo must fit within it for all shapes.

  for (const size of [192, 512]) {
    const logoSize = Math.round(size * 0.8);
    const pad = Math.round((size - logoSize) / 2);

    const logoBuffer = await sharp(source)
      .resize(logoSize, logoSize, { fit: 'contain', background: transparent })
      .png()
      .toBuffer();

    await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
      .composite([{ input: logoBuffer, top: pad, left: pad }])
      .png()
      .toFile(path.join(iconsDir, `icon-maskable-${size}x${size}.png`));
    console.log(`✅ icon-maskable-${size}x${size}.png`);
  }

  // ── Badge icon (72x72 — shown in Android status bar) ─────────────────────────
  // Should be monochrome-ready; keep transparent background so OS can tint it.
  await sharp(source)
    .resize(72, 72, { fit: 'contain', background: transparent })
    .png()
    .toFile(path.join(iconsDir, 'badge-72x72.png'));
  console.log('✅ badge-72x72.png');

  // ── Notification sound (WAV — reliable for all browsers) ────────────────────
  const wavBuffer = generateNotificationWav();
  fs.writeFileSync(path.join(soundsDir, 'notification.wav'), wavBuffer);
  console.log('✅ notification.wav');

  console.log('\n🎉 All notification assets generated!');
}

/**
 * Generates a two-tone "ding" notification sound as a PCM WAV Buffer.
 * 800 Hz → 50ms gap → 1050 Hz — pleasant and recognizable.
 */
function generateNotificationWav() {
  const SAMPLE_RATE = 22050;
  const CHANNELS = 1;
  const BITS = 16;

  const tone1 = generateTone(800, 0.18, 0.28, SAMPLE_RATE);
  const silence = Buffer.alloc(Math.floor(SAMPLE_RATE * 0.05) * 2); // 50ms
  const tone2 = generateTone(1050, 0.18, 0.22, SAMPLE_RATE);

  const pcm = Buffer.concat([tone1, silence, tone2]);
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * CHANNELS * BITS / 8, 28);
  header.writeUInt16LE(CHANNELS * BITS / 8, 32);
  header.writeUInt16LE(BITS, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

function generateTone(freq, duration, volume, sampleRate) {
  const n = Math.floor(sampleRate * duration);
  const buf = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const attack = Math.min(t / 0.01, 1);
    const decay = Math.max(1 - (t - 0.01) / (duration - 0.01), 0);
    const sample = Math.round(attack * decay * volume * 32767 * Math.sin(2 * Math.PI * freq * t));
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), i * 2);
  }
  return buf;
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
