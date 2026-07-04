// Generate an Open Graph image (1200x630) for social sharing
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const PUB = path.join(__dirname, "..", "public");

// Build a simple SVG OG image
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1408"/>
      <stop offset="50%" stop-color="#2d1565"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Logo -->
  <text x="600" y="180" text-anchor="middle" font-family="Georgia, serif" font-size="48" fill="#f59e0b" font-weight="bold">✒️ ReelWrite</text>

  <!-- Headline -->
  <text x="600" y="290" text-anchor="middle" font-family="Georgia, serif" font-size="84" fill="#ffffff" font-weight="bold">Market your book</text>
  <text x="600" y="380" text-anchor="middle" font-family="Georgia, serif" font-size="84" fill="url(#accent)" font-weight="bold">in 7 seconds</text>

  <!-- Subtitle -->
  <text x="600" y="460" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.7)">A TikTok-style platform for writers</text>

  <!-- Mood emojis floating -->
  <text x="200" y="540" font-size="48" opacity="0.4">🕯️</text>
  <text x="350" y="580" font-size="40" opacity="0.3">🌹</text>
  <text x="850" y="580" font-size="40" opacity="0.3">🌿</text>
  <text x="1000" y="540" font-size="48" opacity="0.4">🔮</text>
</svg>`;

(async () => {
  const outPath = path.join(PUB, "og-image.png");
  await sharp(Buffer.from(ogSvg))
    .png()
    .toFile(outPath);
  console.log(`✓ og-image.png (1200x630) -> ${outPath}`);
})();
