// Usage: npm run optimize-image -- <input> <output-name> [maxWidth]
// Writes assets/images/optimized/<output-name>.jpg and .webp, resized to maxWidth (default 1280).
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "assets", "images", "optimized");

const [input, name, maxWidthArg] = process.argv.slice(2);
if (!input || !name) {
  console.error("Uso: npm run optimize-image -- <imagem-de-entrada> <nome-de-saida> [largura-maxima]");
  process.exit(1);
}

const maxWidth = Number(maxWidthArg) || 1280;
const source = path.resolve(ROOT, input);
const base = sharp(source).resize({ width: maxWidth, withoutEnlargement: true });

const jpgPath = path.join(OUT_DIR, `${name}.jpg`);
const webpPath = path.join(OUT_DIR, `${name}.webp`);

const [jpg, webp] = await Promise.all([
  base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(jpgPath),
  base.clone().webp({ quality: 80 }).toFile(webpPath),
]);

const kb = (size) => `${Math.round(size / 1024)} KB`;
console.log(`${path.relative(ROOT, jpgPath)} — ${jpg.width}x${jpg.height}, ${kb(jpg.size)}`);
console.log(`${path.relative(ROOT, webpPath)} — ${webp.width}x${webp.height}, ${kb(webp.size)}`);
