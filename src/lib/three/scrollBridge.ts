/**
 * Scroll bridge.
 *
 * GSAP ScrollTrigger owns scroll. The WebGL frame loop only *reads* a mutable
 * object that ScrollTrigger writes into — no React re-renders, no second
 * scroll listener, no competing libraries on the same property.
 */

export interface HeroScrollState {
  /** 0 at the top of the hero, 1 when the hero has fully left. */
  progress: number;
  /** Smoothed value the scene actually consumes. */
  eased: number;
  velocity: number;
}

export const heroScroll: HeroScrollState = {
  progress: 0,
  eased: 0,
  velocity: 0,
};

export function setHeroProgress(value: number): void {
  heroScroll.velocity = value - heroScroll.progress;
  heroScroll.progress = value;
}

export function stepHeroScroll(lerp = 0.08): number {
  heroScroll.eased += (heroScroll.progress - heroScroll.eased) * lerp;
  return heroScroll.eased;
}

export function resetHeroScroll(): void {
  heroScroll.progress = 0;
  heroScroll.eased = 0;
  heroScroll.velocity = 0;
}

/** Global pointer state, normalised to −1…1, written by one listener. */
export const pointerState = { x: 0, y: 0, targetX: 0, targetY: 0 };

export function setPointerTarget(x: number, y: number): void {
  pointerState.targetX = x;
  pointerState.targetY = y;
}

export function stepPointer(lerp = 0.05): void {
  pointerState.x += (pointerState.targetX - pointerState.x) * lerp;
  pointerState.y += (pointerState.targetY - pointerState.y) * lerp;
}
