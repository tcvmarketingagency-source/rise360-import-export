/**
 * Asset pipeline for the Maitri Residency concept build.
 *
 *   node scripts/build-assets.mjs
 *
 * Two jobs:
 *   1. Normalise the photography in public/images (resize, compress, strip
 *      metadata) so the repo stays small and the first paint stays fast.
 *   2. Derive the hero crops from the plated-dish photograph.
 *
 * Placeholder frames for dishes whose photography is still being produced are
 * created by `scripts/make-placeholders.mjs` and are intentionally labelled.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMAGES = path.join(ROOT, "public/images");

let saved = 0;
let before = 0;
let after = 0;

async function optimise(file, { width = 1400, quality = 80 } = {}) {
  const original = await stat(file);
  const buffer = await sharp(file).rotate().resize({ width, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toBuffer();
  before += original.size;
  after += buffer.length;
  if (buffer.length < original.size) {
    await sharp(buffer).toFile(file);
    saved += original.size - buffer.length;
  }
}

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(jpe?g|png)$/i.test(entry.name)) await optimise(full);
  }
}

/** Hero poster: wide cinematic crop, subtly darkened for typographic contrast. */
async function heroPoster(source) {
  const meta = await sharp(source).metadata();
  const targetWidth = 1800;
  const targetHeight = 1013;
  const base = await sharp(source)
    .resize({ width: targetWidth, height: targetHeight, fit: "cover", position: "centre" })
    .modulate({ brightness: 0.88, saturation: 1.06 })
    .toBuffer();

  const vignette = Buffer.from(
    `<svg width="${targetWidth}" height="${targetHeight}">
       <defs>
         <radialGradient id="v" cx="50%" cy="42%" r="72%">
           <stop offset="55%" stop-color="#000" stop-opacity="0"/>
           <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
         </radialGradient>
       </defs>
       <rect width="100%" height="100%" fill="url(#v)"/>
     </svg>`,
  );

  await sharp(base)
    .composite([{ input: vignette, blend: "over" }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(IMAGES, "hero/hero-poster.jpg"));

  void meta;
}

/** Textured disc: tight square crop of the plated dish for the 3D scene. */
async function heroDish(source) {
  await sharp(source)
    .resize({ width: 1100, height: 1100, fit: "cover", position: "centre" })
    .modulate({ brightness: 0.92, saturation: 1.1 })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(IMAGES, "hero/dish-plated.jpg"));
}

/**
 * Story-scene crops.
 *
 * The scroll story needs cinematic detail frames (heat, craft, the plate, the
 * table). Rather than showing an unfinished placeholder in a hero-adjacent
 * position, these are tight art-directed crops of the same photography library
 * with their own grade. Captions and alt text describe exactly what is visible —
 * nothing is implied about the restaurant's kitchen that has not been confirmed.
 */
async function storyCrop({ source, out, width, height, region, brightness, saturation, position = "centre" }) {
  const meta = await sharp(source).metadata();
  const left = Math.round((region.left ?? 0) * (meta.width ?? width));
  const top = Math.round((region.top ?? 0) * (meta.height ?? height));
  const regionWidth = Math.round((region.width ?? 1) * (meta.width ?? width));
  const regionHeight = Math.round((region.height ?? 1) * (meta.height ?? height));

  const base = await sharp(source)
    .extract({ left, top, width: regionWidth, height: regionHeight })
    .resize({ width, height, fit: "cover", position })
    .modulate({ brightness, saturation })
    .toBuffer();

  const vignette = Buffer.from(
    `<svg width="${width}" height="${height}">
       <defs>
         <radialGradient id="s" cx="50%" cy="45%" r="78%">
           <stop offset="48%" stop-color="#000" stop-opacity="0"/>
           <stop offset="100%" stop-color="#0a0706" stop-opacity="0.62"/>
         </radialGradient>
         <linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
           <stop offset="58%" stop-color="#0a0706" stop-opacity="0"/>
           <stop offset="100%" stop-color="#0a0706" stop-opacity="0.66"/>
         </linearGradient>
       </defs>
       <rect width="100%" height="100%" fill="url(#s)"/>
       <rect width="100%" height="100%" fill="url(#b)"/>
     </svg>`,
  );

  await sharp(base)
    .composite([{ input: vignette, blend: "over" }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(IMAGES, out));
}

async function main() {
  const source = path.join(IMAGES, "menu/chicken-dum-biryani.jpg");
  await heroPoster(source);
  await heroDish(source);

  // Scene 02 — heat and craft: a close crop of a chilli-red toss in the pan.
  await storyCrop({
    source: path.join(IMAGES, "menu/paneer-65.jpg"),
    out: "story/tandoor-fire.jpg",
    width: 1400,
    height: 1750,
    region: { left: 0.16, top: 0.18, width: 0.62, height: 0.64 },
    brightness: 0.82,
    saturation: 1.12,
  });

  // Scene 03 — the plate: the moment a dish is finished and set down.
  await storyCrop({
    source: path.join(IMAGES, "menu/ghee-roast-dosa.jpg"),
    out: "story/plating-hands.jpg",
    width: 1400,
    height: 1750,
    region: { left: 0.1, top: 0.12, width: 0.72, height: 0.76 },
    brightness: 0.86,
    saturation: 1.05,
  });

  // Final sequence — the table, wide.
  await storyCrop({
    source: path.join(IMAGES, "menu/butter-chicken.jpg"),
    out: "story/final-table.jpg",
    width: 1800,
    height: 1013,
    region: { left: 0.08, top: 0.14, width: 0.9, height: 0.72 },
    brightness: 0.8,
    saturation: 1.08,
  });

  await walk(IMAGES);
  console.log(
    `assets: ${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024 / 1024).toFixed(2)} MB (saved ${(saved / 1024).toFixed(0)} KB)`,
  );
}

await main();
