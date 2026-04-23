/**
 * Extracts the embedded PNG from logo-optimized.svg (which wraps a raster image in SVG)
 * and converts it to compact WebP + PNG files for use in <Image> tags.
 * Also converts fallback.jpg → fallback.webp.
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();

async function extractLogoFromSvg() {
  const svgPath = path.join(rootDir, "public/assets/logos/logo-optimized.svg");
  const svgContent = await readFile(svgPath, "utf8");

  // Find the embedded base64 PNG data
  const match = svgContent.match(/data:image\/png;base64,([A-Za-z0-9+/=\s]+)/);
  if (!match) {
    console.log("No embedded base64 PNG found in SVG. SVG may be a true vector — skipping logo extraction.");
    return;
  }

  const base64Data = match[1].replace(/\s/g, "");
  const pngBuffer = Buffer.from(base64Data, "base64");

  const svgStatsBefore = (await stat(svgPath)).size;

  // Create logo.webp (128px — 4× retina for 32px display)
  const webpPath = path.join(rootDir, "public/assets/logos/logo.webp");
  await sharp(pngBuffer)
    .resize({ width: 128, height: 128, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, lossless: false })
    .toFile(webpPath);

  // Create logo.avif
  const avifPath = path.join(rootDir, "public/assets/logos/logo.avif");
  await sharp(pngBuffer)
    .resize({ width: 128, height: 128, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .avif({ quality: 65 })
    .toFile(avifPath);

  // Create logo.png (fallback for browsers that don't support WebP/AVIF)
  const pngPath = path.join(rootDir, "public/assets/logos/logo.png");
  await sharp(pngBuffer)
    .resize({ width: 128, height: 128, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(pngPath);

  const webpStats = (await stat(webpPath)).size;
  const avifStats = (await stat(avifPath)).size;
  const pngStats = (await stat(pngPath)).size;

  console.log(`Logo SVG (original): ${(svgStatsBefore / 1024).toFixed(1)} KB`);
  console.log(`logo.webp:  ${(webpStats / 1024).toFixed(1)} KB`);
  console.log(`logo.avif:  ${(avifStats / 1024).toFixed(1)} KB`);
  console.log(`logo.png:   ${(pngStats / 1024).toFixed(1)} KB`);
  console.log(`Saved: ${((svgStatsBefore - webpStats) / 1024).toFixed(1)} KB vs WebP`);
}

async function convertFallbackImage() {
  const jpgPath = path.join(rootDir, "public/fallback.jpg");
  const webpPath = path.join(rootDir, "public/fallback.webp");

  const jpgStats = (await stat(jpgPath)).size;

  await sharp(jpgPath)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(webpPath);

  // Also create AVIF version
  const avifPath = path.join(rootDir, "public/fallback.avif");
  await sharp(jpgPath)
    .resize({ width: 1200, withoutEnlargement: true })
    .avif({ quality: 55 })
    .toFile(avifPath);

  const webpStats = (await stat(webpPath)).size;
  const avifStats = (await stat(avifPath)).size;

  console.log(`\nfallback.jpg: ${(jpgStats / 1024).toFixed(1)} KB`);
  console.log(`fallback.webp: ${(webpStats / 1024).toFixed(1)} KB`);
  console.log(`fallback.avif: ${(avifStats / 1024).toFixed(1)} KB`);
}

async function run() {
  console.log("=== Logo extraction ===");
  await extractLogoFromSvg();

  console.log("\n=== Fallback image conversion ===");
  await convertFallbackImage();

  console.log("\nDone.");
}

run().catch((e) => { console.error(e); process.exit(1); });
