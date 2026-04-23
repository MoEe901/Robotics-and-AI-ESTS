/**
 * Re-encodes the hero video with higher CRF and 1280px cap.
 * For a background hero video (50% opacity, looped, muted), CRF 28/40 is imperceptible.
 */
import { stat } from "node:fs/promises";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

const rootDir = process.cwd();
const videoDir = path.join(rootDir, "public/assets/video");
const rawDir = path.join(rootDir, "public/assets/raw");

function fmt(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function encode(inputPath, outputPath, codecArgs) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(codecArgs)
      .on("end", resolve)
      .on("error", reject)
      .save(outputPath);
  });
}

async function compressVideo() {
  // Prefer the raw MOV (highest quality source). Fall back to existing MP4.
  let source;
  try {
    await stat(path.join(rawDir, "hero-video.mov"));
    source = path.join(rawDir, "hero-video.mov");
    console.log("Using source: hero-video.mov");
  } catch {
    source = path.join(videoDir, "hero-video.mp4");
    console.log("Using source: hero-video.mp4 (raw MOV not found)");
  }

  const mp4Out = path.join(videoDir, "hero-video.mp4");
  const webmOut = path.join(videoDir, "hero-video.webm");

  const srcSize = (await stat(source)).size;
  console.log(`Source size: ${fmt(srcSize)}`);

  // MP4/H.264: CRF 28, 1280px wide, web-optimised
  console.log("\nEncoding MP4 (CRF 28, 1280px)…");
  await encode(source, mp4Out, [
    "-an",
    "-c:v libx264",
    "-preset slow",
    "-crf 28",
    "-movflags +faststart",
    "-vf scale=1280:-2",
    "-pix_fmt yuv420p",
  ]);
  const mp4Size = (await stat(mp4Out)).size;
  console.log(`hero-video.mp4: ${fmt(mp4Size)}`);

  // WebM/VP9: CRF 40, 1280px wide
  console.log("\nEncoding WebM (CRF 40, 1280px)…");
  await encode(source, webmOut, [
    "-an",
    "-c:v libvpx-vp9",
    "-b:v 0",
    "-crf 40",
    "-deadline good",
    "-cpu-used 2",
    "-vf scale=1280:-2",
  ]);
  const webmSize = (await stat(webmOut)).size;
  console.log(`hero-video.webm: ${fmt(webmSize)}`);

  console.log(`\nTotal video: ${fmt(mp4Size + webmSize)}`);
}

compressVideo().catch((e) => { console.error(e); process.exit(1); });
