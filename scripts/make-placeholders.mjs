/**
 * Placeholder frames for dishes and scenes whose photography is still being
 * produced with the restaurant.
 *
 *   node scripts/make-placeholders.mjs
 *
 * They are deliberately beautiful but unmistakably unfinished: a warm studio
 * gradient, film grain, a hairline rule and a "PHOTOGRAPHY PENDING" label.
 * Each file sits at the exact path the real photograph will occupy, so
 * replacing them requires no code change.
 *
 * Delete a file here once its real photograph lands.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMAGES = path.join(ROOT, "public/images");

const SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf";
const MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf";

const escape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Split a dish name into at most two lines that fit the frame. */
function wrap(text, maxChars = 22) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars && line.length > 0) {
      lines.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 2);
}

function frame({ width, height, toneA, toneB, label, title, caption }) {
  const titleLines = title ? wrap(title) : [];
  const titleMarkup = titleLines
    .map(
      (line, index) =>
        `<text x="50%" y="${58 + index * 46}%" text-anchor="middle" font-family="DejaVu Serif" font-size="${Math.round(
          width * 0.052,
        )}" fill="#f6f1e7" opacity="0.92">${escape(line)}</text>`,
    )
    .join("");

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="50%" cy="38%" r="70%">
        <stop offset="0%" stop-color="${toneA}" stop-opacity="1"/>
        <stop offset="62%" stop-color="${toneB}" stop-opacity="1"/>
        <stop offset="100%" stop-color="#0a0706" stop-opacity="1"/>
      </radialGradient>
      <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="55%" stop-color="#0a0706" stop-opacity="0"/>
        <stop offset="100%" stop-color="#0a0706" stop-opacity="0.72"/>
      </linearGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
    </defs>

    <rect width="100%" height="100%" fill="url(#glow)"/>

    <!-- Studio light pool -->
    <ellipse cx="50%" cy="40%" rx="${width * 0.3}" ry="${height * 0.26}" fill="#dda04a" opacity="0.07"/>

    <!-- Plate marker -->
    <circle cx="50%" cy="40%" r="${Math.min(width, height) * 0.19}" fill="none" stroke="#f6f1e7" stroke-opacity="0.16" stroke-width="1.2"/>
    <circle cx="50%" cy="40%" r="${Math.min(width, height) * 0.23}" fill="none" stroke="#dda04a" stroke-opacity="0.22" stroke-width="1" stroke-dasharray="3 7"/>

    <rect width="100%" height="100%" filter="url(#grain)" opacity="0.14"/>
    <rect width="100%" height="100%" fill="url(#scrim)"/>

    <g font-family="DejaVu Sans Mono" fill="#e8b44a" letter-spacing="${Math.round(width * 0.005)}">
      <text x="50%" y="47%" text-anchor="middle" font-size="${Math.round(width * 0.018)}">PHOTOGRAPHY PENDING</text>
    </g>

    ${titleMarkup}

    ${
      caption
        ? `<text x="50%" y="82%" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="${Math.round(
            width * 0.016,
          )}" fill="#9c9184" letter-spacing="${Math.round(width * 0.004)}">${escape(caption)}</text>`
        : ""
    }
    <rect x="${width * 0.34}" y="88%" width="${width * 0.32}" height="1" fill="#f6f1e7" opacity="0.14"/>
    ${label ? `<text x="50%" y="93%" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="${Math.round(width * 0.014)}" fill="#6f6558" letter-spacing="${Math.round(width * 0.005)}">${escape(label)}</text>` : ""}
  </svg>`;
}

const menuPlaceholders = [
  { file: "menu/placeholder.jpg", title: "", toneA: "#33241a", toneB: "#161009" },
  { file: "menu/gongura-chicken.jpg", title: "Gongura Chicken", toneA: "#3a2418", toneB: "#181008" },
  { file: "menu/butter-naan.jpg", title: "Butter Naan", toneA: "#3c2c1a", toneB: "#191208" },
  { file: "menu/tandoori-roti.jpg", title: "Tandoori Roti", toneA: "#3a2c1c", toneB: "#181206" },
  { file: "menu/veg-noodles.jpg", title: "Veg Noodles", toneA: "#332716", toneB: "#171208" },
  {
    file: "menu/chicken-schezwan-noodles.jpg",
    title: "Chicken Schezwan Noodles",
    toneA: "#3d2114",
    toneB: "#180c06",
  },
  { file: "menu/double-ka-meetha.jpg", title: "Double Ka Meetha", toneA: "#3b2a18", toneB: "#191008" },
  { file: "menu/gulab-jamun.jpg", title: "Gulab Jamun", toneA: "#3a2517", toneB: "#180e07" },
  { file: "menu/filter-coffee.jpg", title: "Filter Coffee", toneA: "#2f2618", toneB: "#150f08" },
  { file: "menu/sweet-lassi.jpg", title: "Sweet Lassi", toneA: "#332c1e", toneB: "#161209" },
];

const scenePlaceholders = [
  {
    file: "story/tandoor-fire.jpg",
    title: "",
    caption: "PLATE 02 — CRAFT",
    toneA: "#4a2513",
    toneB: "#1a0d06",
    width: 1400,
    height: 1750,
  },
  {
    file: "story/plating-hands.jpg",
    title: "",
    caption: "PLATE 03 — THE DISH",
    toneA: "#3d2c1c",
    toneB: "#170f08",
    width: 1400,
    height: 1750,
  },
  {
    file: "story/final-table.jpg",
    title: "",
    caption: "FINAL SEQUENCE",
    toneA: "#432a16",
    toneB: "#140d07",
    width: 1800,
    height: 1013,
  },
];

const FORCE = process.argv.includes("--force");

async function write(entry, width, height) {
  const target = path.join(IMAGES, entry.file);
  // A real photograph may already live here — never overwrite it by accident.
  if (existsSync(target) && !FORCE) return null;

  const svg = frame({
    width,
    height,
    toneA: entry.toneA,
    toneB: entry.toneB,
    title: entry.title ?? "",
    caption: entry.caption,
    label: "REPLACE WITH MAITRI'S OWN PHOTOGRAPHY",
  });
  await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toFile(target);
  return target;
}

const written = [];
for (const entry of menuPlaceholders) written.push(await write(entry, 1200, 900));
for (const entry of scenePlaceholders) written.push(await write(entry, entry.width, entry.height));

const created = written.filter((file) => file !== null);
const skipped = written.length - created.length;
console.log(`placeholders created: ${created.length} (skipped ${skipped} that already have artwork)`);
for (const file of created) console.log("  " + path.relative(ROOT, file));
if (skipped > 0) console.log("  pass --force to regenerate existing frames");
void SERIF;
void MONO;
