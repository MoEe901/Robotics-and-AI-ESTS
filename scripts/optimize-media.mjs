import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { optimize } from "svgo";

const rootDir = process.cwd();
const rawDir = path.join(rootDir, "public/assets/raw");
const imageOutDir = path.join(rootDir, "public/assets/images");
const videoOutDir = path.join(rootDir, "public/assets/video");
const logoOutDir = path.join(rootDir, "public/assets/logos");

ffmpeg.setFfmpegPath(ffmpegPath);

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

async function ensureDirectories() {
  await mkdir(imageOutDir, { recursive: true });
  await mkdir(videoOutDir, { recursive: true });
  await mkdir(logoOutDir, { recursive: true });
}

function convertVideo(inputPath, outputPath, codecArgs) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(codecArgs)
      .on("end", resolve)
      .on("error", reject)
      .save(outputPath);
  });
}

async function optimizeImages() {
  const files = await readdir(rawDir);
  const imageFiles = files.filter((file) =>
    IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()),
  );

  for (const file of imageFiles) {
    const inputPath = path.join(rawDir, file);
    const baseName = path.parse(file).name;

    const webpPath = path.join(imageOutDir, `${baseName}.webp`);
    const avifPath = path.join(imageOutDir, `${baseName}.avif`);

    await sharp(inputPath)
      .rotate()
      .resize({ width: 2200, withoutEnlargement: true })
      .webp({ quality: 84, effort: 5 })
      .toFile(webpPath);

    await sharp(inputPath)
      .rotate()
      .resize({ width: 2200, withoutEnlargement: true })
      .avif({ quality: 58, effort: 6 })
      .toFile(avifPath);

    console.log(`Optimized image: ${file}`);
  }
}

async function optimizeLogo() {
  const rawLogoPath = path.join(rawDir, "logo.svg");
  const content = await readFile(rawLogoPath, "utf8");
  const optimized = optimize(content, {
    multipass: true,
    plugins: ["preset-default", "cleanupIds", "removeDimensions"],
  });
  const outputPath = path.join(logoOutDir, "logo-optimized.svg");
  await writeFile(outputPath, optimized.data, "utf8");
  console.log("Optimized logo: logo.svg");
}

async function optimizeVideo() {
  const inputPath = path.join(rawDir, "hero-video.mov");
  const mp4Path = path.join(videoOutDir, "hero-video.mp4");
  const webmPath = path.join(videoOutDir, "hero-video.webm");

  await convertVideo(inputPath, mp4Path, [
    "-an",
    "-c:v libx264",
    "-preset medium",
    "-crf 24",
    "-movflags +faststart",
    "-vf scale=1920:-2",
  ]);

  await convertVideo(inputPath, webmPath, [
    "-an",
    "-c:v libvpx-vp9",
    "-b:v 0",
    "-crf 33",
    "-deadline good",
    "-vf scale=1920:-2",
  ]);

  const [mp4Stats, webmStats] = await Promise.all([
    stat(mp4Path),
    stat(webmPath),
  ]);

  console.log(
    `Optimized video: mp4 ${(mp4Stats.size / 1024 / 1024).toFixed(2)}MB, webm ${(webmStats.size / 1024 / 1024).toFixed(2)}MB`,
  );
}

async function run() {
  await ensureDirectories();
  await optimizeImages();
  await optimizeLogo();
  await optimizeVideo();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
