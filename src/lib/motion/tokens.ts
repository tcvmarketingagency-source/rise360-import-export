/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MOTION LANGUAGE — one authored system, referenced by every animation.
 *
 * Division of responsibility (never two libraries on one property):
 *   GSAP + ScrollTrigger → scroll narrative: scene pinning, camera proxies,
 *                          section reveals, horizontal rails.
 *   React Three Fiber    → 3D hero scene: camera, materials, steam, light.
 *   Framer Motion        → interface states: drawers, dialogs, filters, adds.
 *   CSS                  → micro details: hover, focus, underline, grain.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Seconds — GSAP-native units. */
export const duration = {
  instant: 0.14,
  quick: 0.26,
  base: 0.42,
  smooth: 0.72,
  slow: 1.1,
  cinematic: 1.6,
  introBeat: 2.4,
  introTotal: 6.2,
} as const;

/** GSAP ease strings — used verbatim in timelines. */
export const gsapEase = {
  cinematic: "power4.out",
  soft: "power2.out",
  inOut: "power2.inOut",
  snap: "power3.in",
  linear: "none",
  back: "back.out(1.4)",
} as const;

/** Cubic-bezier arrays for Framer Motion and CSS. */
export const bezier = {
  cinematic: [0.16, 1, 0.3, 1] as const,
  soft: [0.33, 0.85, 0.16, 1] as const,
  snap: [0.2, 0.9, 0.24, 1] as const,
};

export const transition = {
  drawer: { duration: 0.42, ease: bezier.cinematic },
  dialog: { duration: 0.3, ease: bezier.cinematic },
  micro: { duration: 0.18, ease: bezier.snap },
  card: { duration: 0.5, ease: bezier.cinematic },
} as const;

/**
 * Reveal distances (px). One scale for the whole site, so sections differ by
 * *rhythm* rather than by arbitrary offsets.
 */
export const revealDistance = {
  micro: 14,
  text: 22,
  card: 30,
  panel: 44,
} as const;

/**
 * Image reveals settle from a restrained scale offset — the specified 1.04–1.08
 * band. `clipFrom` is the closed state of the curtain; it always animates to
 * `imageReveal.open`.
 */
export const imageReveal = {
  scaleFrom: 1.06,
  clipFrom: {
    /** Curtain rises: the frame is revealed top-down. */
    rise: "inset(0% 0% 100% 0%)",
    /** Curtain draws: the frame is revealed left-to-right. */
    draw: "inset(0% 100% 0% 0%)",
  },
  open: "inset(0% 0% 0% 0%)",
} as const;

/**
 * Beat offsets (seconds, relative to a section's own timeline start). Every
 * section uses these names, so the page reads as one choreography even though
 * each section phrases its motion differently.
 */
export const beat = {
  eyebrow: 0,
  headline: 0.1,
  support: 0.34,
  furniture: 0.5,
  cta: 0.62,
  /** Secondary action — deliberately a separate beat from the primary one. */
  ctaSecondary: 0.74,
  last: 0.95,
} as const;

/** Stagger values keep text sequencing deliberate rather than busy. */
export const stagger = {
  tight: 0.03,
  text: 0.055,
  card: 0.07,
  section: 0.12,
} as const;

/** ScrollTrigger defaults so every scene behaves identically. */
export const scrollDefaults = {
  start: "top 78%",
  end: "bottom 45%",
  pinStart: "top top",
  scrubSmooth: 0.8,
  markers: false,
  /**
   * ScrollTrigger.refresh() re-measures every trigger on the page. All
   * refreshes funnel through one debounced scheduler, so a page with eight
   * animated sections still refreshes once instead of once per component.
   */
  refreshDebounce: 180,
} as const;

/** Reduced-motion users get the same content with no motion at all. */
export const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
