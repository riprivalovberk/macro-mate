// Generates the PWA icons (rounded dark tile with a calorie-ring motif)
// without any native image dependencies. Run: npm run icons
import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public');
mkdirSync(outDir, { recursive: true });

const BG = [16, 16, 22];
const RING = [255, 159, 10]; // kcal orange
const RING2 = [255, 55, 95]; // protein pink
const RING3 = [50, 215, 75]; // carbs green

function inRoundedRect(x, y, size, radius) {
  const r = radius;
  const cx = Math.max(r, Math.min(size - r, x));
  const cy = Math.max(r, Math.min(size - r, y));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function makeIcon(size, rounded) {
  const png = new PNG({ width: size, height: size });
  const c = size / 2;
  const rOuter = size * 0.36;
  const rWidth = size * 0.085;
  const corner = size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const inside = rounded ? inRoundedRect(x + 0.5, y + 0.5, size, corner) : true;
      if (!inside) {
        png.data[idx + 3] = 0;
        continue;
      }
      let [r, g, b] = BG;
      const dx = x + 0.5 - c;
      const dy = y + 0.5 - c;
      const dist = Math.hypot(dx, dy);
      // three-color segmented ring
      if (Math.abs(dist - rOuter) <= rWidth / 2) {
        let angle = Math.atan2(dy, dx) + Math.PI / 2; // 0 at top
        if (angle < 0) angle += Math.PI * 2;
        const seg = angle / (Math.PI * 2);
        const color = seg < 0.45 ? RING : seg < 0.75 ? RING2 : RING3;
        const edge = Math.abs(dist - rOuter) / (rWidth / 2);
        const t = Math.min(1, Math.max(0, (1 - edge) * 4)); // soft edges
        r = Math.round(color[0] * t + BG[0] * (1 - t));
        g = Math.round(color[1] * t + BG[1] * (1 - t));
        b = Math.round(color[2] * t + BG[2] * (1 - t));
      }
      // center dot
      if (dist < size * 0.09) {
        [r, g, b] = [240, 240, 245];
      }
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

writeFileSync(join(outDir, 'pwa-192.png'), makeIcon(192, false));
writeFileSync(join(outDir, 'pwa-512.png'), makeIcon(512, false));
writeFileSync(join(outDir, 'apple-touch-icon.png'), makeIcon(180, false));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect width="100" height="100" rx="22" fill="#101016"/>
<circle cx="50" cy="50" r="36" fill="none" stroke="#ff9f0a" stroke-width="9" stroke-dasharray="101 125" stroke-linecap="round" transform="rotate(-90 50 50)"/>
<circle cx="50" cy="50" r="36" fill="none" stroke="#ff375f" stroke-width="9" stroke-dasharray="56 170" stroke-dashoffset="-104" stroke-linecap="round" transform="rotate(-90 50 50)"/>
<circle cx="50" cy="50" r="36" fill="none" stroke="#32d74b" stroke-width="9" stroke-dasharray="50 176" stroke-dashoffset="-163" stroke-linecap="round" transform="rotate(-90 50 50)"/>
<circle cx="50" cy="50" r="9" fill="#f0f0f5"/>
</svg>`;
writeFileSync(join(outDir, 'icon.svg'), svg);

console.log('Icons written to public/');
