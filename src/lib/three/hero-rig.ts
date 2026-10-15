/**
 * ─────────────────────────────────────────────────────────────────────────────
 * HERO ART DIRECTION — the single source of truth for the hero composition.
 *
 * Everything here is deliberate and shared:
 *   • the CSS fallback panel (Hero.tsx) and the WebGL panel (HeroScene.tsx) read
 *     the same numbers, so the photographic first paint and the 3D scene place
 *     the food visual in exactly the same spot — no re-composition when WebGL
 *     arrives, and the no-WebGL path is a first-class citizen;
 *   • the layout resolver is a pure function of the *canvas* size, so an
 *     embedded preview is composed from its own box rather than the window;
 *   • light values are a rig, not scattered props: one warm key, a dark fill and
 *     a low environment. Nothing here is allowed to wash the frame out.
 *
 * Units: screen fractions (0–1) and pixels in canvas space (origin top-left).
 * No imports — this module is pure data + maths so it can also be executed by
 * verification scripts outside the app.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Photograph panel aspect (width / height). Matches the crop below. */
/**
 * The camera the hero composition is authored against. The CSS fallback lays the
 * panel out with `resolveHeroLayout`, and this camera projects the 3D plane onto
 * exactly the same box (verified by the offline projection check).
 */
export const HERO_CAMERA = {
  fov: 34,
  position: [0, 1.5, 4.2] as readonly [number, number, number],
  target: [0, 0.45, 0] as readonly [number, number, number],
} as const;

export const PANEL_ASPECT = 0.92;

/**
 * How visible the dimmed wide backdrop photograph is behind the panel. Kept low
 * on purpose: the dish panel is the only subject, the backdrop is atmosphere.
 */
export const BACKDROP_OPACITY = 0.24;

/**
 * How the dish photograph is cropped before it is shown.
 *
 * The photograph already contains its own dark bowl, its own table and its own
 * lighting. Re-rendering it as CGI (a procedural plate with the photo mapped on
 * top) is what produced the pale oval and the foggy halo, so the photograph
 * itself is the subject now — cropped around the dish and feathered into the
 * dark, the way a film still is.
 */
export const PANEL_CROP = {
  /**
   * Fractions of the source image (1100 × 1100). Chosen from the photograph's
   * own luminance profile: the dish sits in the bright band y 0.36–0.66, so the
   * crop centres that band and stops before the side bowls (x > 0.78) and the
   * hand at the upper right — the picture's spare setting is not part of the shot.
   */
  x: 0.115,
  y: 0.165,
  width: 0.62,
  height: 0.674,
  /** Where the food sits inside the crop — used to place rising steam. */
  foodCenter: { x: 0.5, y: 0.5 },
  foodRadius: 0.34,
} as const;

/**
 * Composition control points, keyed by canvas width in CSS pixels.
 * Values are interpolated between neighbours, so the panel slides and scales
 * continuously — no jump where the copy re-stacks (that happens at 1024).
 *
 *   topFrac      top edge of the panel, as a fraction of canvas height
 *   bottomFrac   the panel may never reach below this (keeps copy clear)
 *   widthFrac    panel width as a fraction of canvas width
 *   centerXFrac  horizontal centre of the panel
 */
export interface CompositionPoint {
  /** Canvas width this control point is authored for. */
  width: number;
  topFrac: number;
  bottomFrac: number;
  widthFrac: number;
  centerXFrac: number;
}

export const HERO_COMPOSITION: readonly CompositionPoint[] = [
  // Stacked (mobile/tablet): the visual gets a reserved band under the fixed
  // 72px header, and the copy keeps everything below `TEXT_SAFE.stackedGutterPx`
  // of clear space — measured so the panel never touches the headline, the CTAs
  // or the header at 360, 390, 480 and 700 wide.
  { width: 320, topFrac: 0.115, bottomFrac: 0.375, widthFrac: 0.9, centerXFrac: 0.5 },
  { width: 480, topFrac: 0.105, bottomFrac: 0.41, widthFrac: 0.86, centerXFrac: 0.5 },
  { width: 700, topFrac: 0.11, bottomFrac: 0.46, widthFrac: 0.78, centerXFrac: 0.5 },
  // Side (>=768): copy left, food right, plate 44-47% of the canvas.
  { width: 768, topFrac: 0.12, bottomFrac: 0.88, widthFrac: 0.45, centerXFrac: 0.7 },
  { width: 1024, topFrac: 0.13, bottomFrac: 0.9, widthFrac: 0.47, centerXFrac: 0.71 },
  { width: 1280, topFrac: 0.14, bottomFrac: 0.9, widthFrac: 0.46, centerXFrac: 0.71 },
  { width: 1600, topFrac: 0.15, bottomFrac: 0.92, widthFrac: 0.44, centerXFrac: 0.71 },
  { width: 2048, topFrac: 0.16, bottomFrac: 0.92, widthFrac: 0.4, centerXFrac: 0.7 },
];

/** The copy may use the left this far across the canvas on wide layouts. */
export const TEXT_SAFE = {
  /** Fraction of the shell's content box the copy column may occupy (CSS grid). */
  sideMaxWidthFrac: 0.42,
  /** Gutter between the copy column and the panel. */
  gutterFrac: 0.04,
  /**
   * In the stacked layouts the copy stack may start at about half the canvas
   * height; the invariant that actually protects it is the pixel gap below the
   * panel, which is checked at every tested viewport (smallest measured 42px at
   * 360x800 — see the compositor's `panel→copy gap`).
   */
  stackedCopyStartFrac: 0.5,
  /** Minimum clear space between the bottom of the stacked panel and the copy. */
  stackedGutterPx: 40,
} as const;

export interface HeroLayout {
  /** "side": copy left, food right. "stacked": food above, copy below. */
  mode: "side" | "stacked";
  /** Panel box in canvas pixels. */
  panel: { x: number; y: number; width: number; height: number; centerX: number; centerY: number };
  /** Fence the copy must stay inside (canvas pixels). */
  textZone: { right: number; bottomStart: number };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Where the panel plane sits in world space for a given canvas and camera.
 * Pure numbers (no three import) so the scene, the CSS fallback and offline
 * projection checks all agree.
 */
export function resolvePanelTransform(
  layout: HeroLayout,
  width: number,
  height: number,
  camera: { fov: number; position: readonly [number, number, number]; target: readonly [number, number, number] },
) {
  const [ox, oy, oz] = camera.position;
  const [tx, ty, tz] = camera.target;

  const dx = tx - ox;
  const dy = ty - oy;
  const dz = tz - oz;
  const depth = Math.hypot(dx, dy, dz);
  const fwd: [number, number, number] = [dx / depth, dy / depth, dz / depth];

  // right = forward x worldUp(0,1,0), up = right x forward (right-handed, Y up)
  const rightRaw: [number, number, number] = [-fwd[2], 0, fwd[0]];
  const rightLength = Math.hypot(rightRaw[0], rightRaw[1], rightRaw[2]);
  const right: [number, number, number] = [
    rightRaw[0] / rightLength,
    rightRaw[1] / rightLength,
    rightRaw[2] / rightLength,
  ];
  const up: [number, number, number] = [
    right[1] * fwd[2] - right[2] * fwd[1],
    right[2] * fwd[0] - right[0] * fwd[2],
    right[0] * fwd[1] - right[1] * fwd[0],
  ];

  // Distance along the view axis - not raw z - is what the frustum measures.
  const viewHeight = 2 * depth * Math.tan((camera.fov * Math.PI) / 180 / 2);
  const viewWidth = viewHeight * (width / Math.max(1, height));

  const widthFrac = layout.panel.width / Math.max(1, width);
  const heightFrac = layout.panel.height / Math.max(1, height);
  const offsetAlongX = ((layout.panel.centerX / Math.max(1, width)) - 0.5) * viewWidth;
  const offsetAlongY = (0.5 - layout.panel.centerY / Math.max(1, height)) * viewHeight;

  const center: [number, number, number] = [
    ox + fwd[0] * depth + right[0] * offsetAlongX + up[0] * offsetAlongY,
    oy + fwd[1] * depth + right[1] * offsetAlongX + up[1] * offsetAlongY,
    oz + fwd[2] * depth + right[2] * offsetAlongX + up[2] * offsetAlongY,
  ];

  return {
    worldWidth: widthFrac * viewWidth,
    worldHeight: heightFrac * viewHeight,
    viewWidth,
    viewHeight,
    depth,
    center,
    basis: { right, up, forward: fwd },
  };
}

/** Interpolated control point for a canvas width. Pure and deterministic. */
export function resolveCompositionPoint(width: number): CompositionPoint {
  const points = HERO_COMPOSITION;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const clamped = Math.max(first.width, Math.min(last.width, width));

  let lower: CompositionPoint = first;
  let upper: CompositionPoint = last;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (clamped >= a.width && clamped <= b.width) {
      lower = a;
      upper = b;
      break;
    }
  }
  const t = (clamped - lower.width) / (upper.width - lower.width || 1);
  return {
    width: clamped,
    topFrac: lerp(lower.topFrac, upper.topFrac, t),
    bottomFrac: lerp(lower.bottomFrac, upper.bottomFrac, t),
    widthFrac: lerp(lower.widthFrac, upper.widthFrac, t),
    centerXFrac: lerp(lower.centerXFrac, upper.centerXFrac, t),
  };
}

/**
 * Resolve the hero composition for a canvas of `width` × `height` CSS pixels.
 * Pure: same input, same output, on server and client.
 */
export function resolveHeroLayout(width: number, height: number): HeroLayout {
  const { topFrac, bottomFrac, widthFrac, centerXFrac } = resolveCompositionPoint(width);

  // Two constraints: the requested width, and the vertical room available
  // before the copy starts. Whichever is smaller wins — the panel can never
  // grow into the text.
  const roomHeight = Math.max(0, (bottomFrac - topFrac) * height);
  const widthFromWidth = widthFrac * width;
  const widthFromRoom = roomHeight * PANEL_ASPECT;
  const panelWidth = Math.max(0, Math.min(widthFromWidth, widthFromRoom));
  const panelHeight = panelWidth / PANEL_ASPECT;

  const centerX = centerXFrac * width;
  const top = topFrac * height;

  const mode: HeroLayout["mode"] = width >= 768 ? "side" : "stacked";

  return {
    mode,
    panel: {
      x: centerX - panelWidth / 2,
      y: top,
      width: panelWidth,
      height: panelHeight,
      centerX,
      centerY: top + panelHeight / 2,
    },
    textZone:
      mode === "side"
        ? {
            right: Math.min(
              width * (TEXT_SAFE.sideMaxWidthFrac + 0.06),
              centerX - panelWidth / 2 - width * TEXT_SAFE.gutterFrac,
            ),
            bottomStart: height,
          }
        : {
            // The copy may start here at the earliest; the real guard is the gap.
            right: width,
            bottomStart: Math.max(top + panelHeight + TEXT_SAFE.stackedGutterPx, height * TEXT_SAFE.stackedCopyStartFrac),
          },
  };
}

/* ── Lighting rig ─────────────────────────────────────────────────────────── */

/**
 * Warm food-studio rig: one key that sweeps slowly, a barely-there fill, a dark
 * environment. The photograph is unlit, so the rig shapes the table, the steam
 * and the rim light only — it can never blow the food out.
 */
export const HERO_LIGHTS = {
  ambient: { intensity: 0.09, color: "#ffd9a8" },
  hemisphere: { intensity: 0.06, sky: "#ffd0a0", ground: "#0b0705" },
  /** The moving key light. Intensity is in candela with decay 2. */
  key: {
    intensity: 9,
    intensityPulse: 0.6,
    angle: 0.5,
    penumbra: 1,
    distance: 10,
    decay: 2,
    color: "#ffc98d",
    radius: 2.6,
    height: 2.35,
    heightBob: 0.18,
    angularSpeed: 0.12,
  },
  /** Cold-ish dark rim so the food edge separates from the background. */
  rim: { intensity: 0.16, color: "#8c5a2c", position: [-3.1, 2.1, -2.4] as const },
  /** Subtle warm bounce under the panel. */
  fill: { intensity: 0.5, distance: 3.4, decay: 2, color: "#ffb469", position: [0, 0.1, 0.8] as const },
  /** ACES exposure. Below 1: the frame is lit, not flooded. */
  exposure: 0.86,
  /** How strongly materials read the environment. */
  envIntensity: 0.34,
} as const;

/* ── Materials ────────────────────────────────────────────────────────────── */

export const HERO_MATERIALS = {
  /** Dark, tactile tabletop — stone, not a cream backdrop. */
  table: { color: "#241a14", roughness: 0.92, metalness: 0.02 },
  /** Warm pool of light the panel sits in, drawn additively on the table. */
  glow: { color: "#ff9c4a", opacity: 0.16, size: 5.4 },
  panel: { featherInner: 0.6, featherOuter: 1.0, sheen: 0.1, vignette: 0.34 },
} as const;

/* ── Motion ───────────────────────────────────────────────────────────────── */

/**
 * Restrained by design: a plate-sized object rotates ±1.4°, drifts a couple of
 * millimetres, and follows the pointer by fractions of a degree. Nothing here
 * is allowed to pull the composition or the exposure around.
 */
export const HERO_MOTION = {
  /** ± degrees of yaw. */
  yawDegrees: 1.4,
  yawSpeed: 0.085,
  pointerYawDegrees: 0.8,
  pointerPitchDegrees: 0.5,
  pointerShift: 0.018,
  driftWorld: 0.004,
  driftSpeed: 0.32,
  cameraDrift: 0.03,
  cameraDriftSpeed: 0.14,
  cameraScrollRise: 0.55,
  cameraScrollDolly: 0.65,
  steamOpacity: 0.2,
  steamCount: { low: 34, mid: 66, high: 104 },
  moteOpacity: 0.42,
  moteCount: { low: 22, mid: 44, high: 80 },
} as const;

/** Card/panel entrance when the hero copy is released after the intro. */
export const HERO_PANEL_REVEAL = {
  fadeDuration: 1.1,
  riseDistance: 0.06,
} as const;
