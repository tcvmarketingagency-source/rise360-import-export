/**
 * How the dish photograph is painted onto a canvas before it is used — either
 * as the WebGL panel texture or, byte for byte with the same numbers, as the
 * static fallback.
 *
 * The photograph is the subject. It already contains its own dark bowl, its own
 * table and its own studio lighting, so it is never re-lit or re-rendered: it is
 * cropped around the dish, given a faint inner vignette and a warm top-left
 * sheen, then feathered into the dark so it reads as a film still emerging from
 * shadow rather than a picture pasted onto a plate.
 *
 * Kept framework-free (plain Canvas2D) so the same function can run in the
 * browser, in a texture builder and in an offline verification render.
 */
import { HERO_MATERIALS, PANEL_ASPECT, PANEL_CROP } from "./hero-rig";

/** Minimal structural type: works with DOM canvas, node-canvas and OffscreenCanvas. */
export interface Canvas2DLike {
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  drawImage(image: unknown, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradientLike;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradientLike;
  set globalCompositeOperation(value: string);
  set globalAlpha(value: number);
  /** `unknown` so both DOM canvases and node-canvas contexts satisfy this. */
  set fillStyle(value: unknown);
}

interface CanvasGradientLike {
  addColorStop(offset: number, color: string): void;
}

export interface PanelPaintOptions {
  /** Canvas pixel size (the panel is `width` × `width / PANEL_ASPECT`). */
  width: number;
  height: number;
  image: { width: number; height: number };
}

/**
 * Paint the hero panel into `ctx`. The caller owns the canvas and, for WebGL,
 * turning the result into a texture.
 */
export function paintHeroPanel(ctx: Canvas2DLike, image: unknown, options: PanelPaintOptions): void {
  const { width, height, image: size } = options;

  // 1. Crop around the dish. The crop's aspect matches the panel's, so the
  //    photograph is never stretched.
  const sx = PANEL_CROP.x * size.width;
  const sy = PANEL_CROP.y * size.height;
  const sw = PANEL_CROP.width * size.width;
  const sh = PANEL_CROP.height * size.height;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);

  // 2. Inner vignette — settles the photograph into the dark without flattening it.
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const vignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.54,
    Math.min(width, height) * 0.28,
    width * 0.5,
    height * 0.54,
    Math.max(width, height) * 0.72,
  );
  vignette.addColorStop(0, "rgba(10,7,6,0)");
  vignette.addColorStop(0.65, `rgba(10,7,6,${HERO_MATERIALS.panel.vignette * 0.45})`);
  vignette.addColorStop(1, `rgba(10,7,6,${HERO_MATERIALS.panel.vignette})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // 3. Warm directional sheen from the upper left: the light in the room.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const sheen = ctx.createLinearGradient(0, 0, width * 0.85, height);
  sheen.addColorStop(0, `rgba(255,169,90,${HERO_MATERIALS.panel.sheen})`);
  sheen.addColorStop(0.45, `rgba(255,140,60,${HERO_MATERIALS.panel.sheen * 0.35})`);
  sheen.addColorStop(1, "rgba(255,120,40,0)");
  ctx.fillStyle = sheen;
  ctx.globalAlpha = 1;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // 4. Feather the edges into the background (elliptical, so the corners melt).
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.scale(width / height, 1);
  const radius = height;
  const feather = ctx.createRadialGradient(
    (width / 2) * (height / width),
    height * 0.5,
    radius * HERO_MATERIALS.panel.featherInner * 0.5,
    (width / 2) * (height / width),
    height * 0.5,
    radius * 0.5 * HERO_MATERIALS.panel.featherOuter,
  );
  feather.addColorStop(0, "rgba(0,0,0,1)");
  feather.addColorStop(0.72, "rgba(0,0,0,0.94)");
  feather.addColorStop(0.9, "rgba(0,0,0,0.42)");
  feather.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = feather;
  ctx.fillRect(0, 0, width * 1.2, height);
  ctx.restore();
}

/** Pixel size of the panel canvas for a given width. */
export function panelCanvasSize(width: number): { width: number; height: number } {
  return { width, height: Math.round(width / PANEL_ASPECT) };
}
