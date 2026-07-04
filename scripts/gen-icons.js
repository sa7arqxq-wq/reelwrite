// Generate PNG icons from the SVG favicon for PWA manifest
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const PUB = path.join(__dirname, "..", "public");
const svgPath = path.join(PUB, "icon.svg");
const svgBuffer = fs.readFileSync(svgPath);

const sizes = [
  { name: "icon-192.png", size: 192, padding: 0 },
  { name: "icon-512.png", size: 512, padding: 0 },
  { name: "icon-maskable-512.png", size: 512, padding: 64 }, // safe area for maskable
  { name: "apple-touch-icon.png", size: 180, padding: 0 },
  { name: "favicon-32.png", size: 32, padding: 0 },
  { name: "favicon-16.png", size: 16, padding: 0 },
];

(async () => {
  for (const { name, size, padding } of sizes) {
    const outPath = path.join(PUB, name);
    if (padding > 0) {
      // For maskable: render SVG on a larger background canvas
      const bgSize = size;
      const innerSize = size - padding * 2;
      const inner = await sharp(svgBuffer)
        .resize(innerSize, innerSize)
        .png()
        .toBuffer();
      await sharp({
        create: {
          width: bgSize,
          height: bgSize,
          channels: 4,
          background: { r: 10, g: 10, b: 10, alpha: 1 },
        },
      })
        .composite([{ input: inner, gravity: "center" }])
        .png()
        .toFile(outPath);
    } else {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outPath);
    }
    console.log(`✓ ${name} (${size}x${size})`);
  }
  console.log("All icons generated.");
})();
