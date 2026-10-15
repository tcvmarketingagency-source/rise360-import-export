"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger, useMotion } from "@/components/providers/MotionProvider";
import {
  beat,
  gsapEase,
  imageReveal,
  revealDistance,
  scrollDefaults,
  stagger,
} from "./tokens";
import { splitHeadline } from "./split";

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/* ─────────────────────────────────────────────────────────────────────────────
   One refresh scheduler
   ─────────────────────────────────────────────────────────────────────────────
   Every scroll-driven component needs ScrollTrigger to re-measure after it
   sets itself up, and after images/fonts change the document height. Calling
   `ScrollTrigger.refresh()` from each component meant eight or nine full
   refreshes on first paint. They now funnel through this single debounced
   scheduler instead.
   ─────────────────────────────────────────────────────────────────────────── */

let refreshHandle: number | null = null;

export function refreshScrollTriggers(delay = scrollDefaults.refreshDebounce): void {
  if (typeof window === "undefined") return;
  if (refreshHandle !== null) window.clearTimeout(refreshHandle);
  refreshHandle = window.setTimeout(() => {
    refreshHandle = null;
    ScrollTrigger.refresh();
  }, delay);
}

/** Cancels a pending refresh — used when the last animated component unmounts. */
export function cancelScrollRefresh(): void {
  if (typeof window !== "undefined" && refreshHandle !== null) {
    window.clearTimeout(refreshHandle);
    refreshHandle = null;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Section entrance choreography
   ───────────────────────────────────────────────────────────────────────────── */

type BeatName = "eyebrow" | "headline" | "support" | "furniture" | "cta" | "ctaSecondary" | "last";

export interface SectionEntranceOptions {
  start?: string;
  /** Adds a delay before the first beat (used to stagger consecutive sections). */
  delay?: number;
  /** Beat names to animate. Anything absent from the markup is simply skipped. */
  beats?: BeatName[];
}

/**
 * A section's entrance: eyebrow → headline (masked words) → support → its
 * furniture → calls to action → closing line.
 *
 * Initial states are written here, in the same tick the trigger is created, so
 * a JS failure can never leave a section invisible — nothing is hidden in CSS.
 * `gsap.context()` reverts every inline style on unmount, which is also what
 * restores the layout when a visitor switches to reduced motion.
 */
export function useSectionEntrance<T extends HTMLElement>(options: SectionEntranceOptions = {}) {
  const ref = useRef<T | null>(null);
  const { reducedMotion, ready } = useMotion();
  const {
    start = scrollDefaults.start,
    delay = 0,
    beats = ["eyebrow", "headline", "support", "furniture", "cta", "ctaSecondary", "last"],
  } = options;

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root || !ready || reducedMotion) return;

    const find = (name: BeatName) => gsap.utils.toArray<HTMLElement>(`[data-beat="${name}"]`, root);
    const splits: ReturnType<typeof splitHeadline>[] = [];

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: gsapEase.cinematic },
        delay,
        scrollTrigger: { trigger: root, start, once: true },
      });

      // Beats are authored at their own offsets, so a section can omit a beat
      // without the ones after it sliding forward on the timeline.
      for (const name of beats) {
        const elements = find(name);
        if (elements.length === 0) continue;

        if (name === "headline") {
          for (const element of elements) {
            const split = splitHeadline(element);
            if (!split) continue;
            splits.push(split);
            gsap.set(split.words, { yPercent: 116, opacity: 0 });
            timeline.to(
              split.words,
              { yPercent: 0, opacity: 1, duration: 1.05, stagger: stagger.text },
              beat.headline,
            );
          }
          continue;
        }

        const distance =
          name === "eyebrow" || name === "last"
            ? revealDistance.micro
            : name === "support"
              ? revealDistance.text
              : name === "cta"
                ? revealDistance.micro
                : name === "ctaSecondary"
                  ? revealDistance.micro
                  : revealDistance.card;

        gsap.set(elements, { opacity: 0, y: distance });
        timeline.to(
          elements,
          {
            opacity: 1,
            y: 0,
            duration: name === "cta" || name === "ctaSecondary" ? 0.6 : 0.85,
            stagger: name === "support" || name === "last" ? 0 : stagger.tight,
            clearProps: "transform",
          },
          beat[name],
        );
      }

      // Staggered card groups (e.g. the hotel cards): the container arrives
      // first, then each card's own title and description settle inside it.
      const extras = gsap.utils.toArray<HTMLElement>("[data-entrance-extra]", root);
      if (extras.length > 0) {
        gsap.set(extras, { opacity: 0, y: revealDistance.card });
        timeline.to(
          extras,
          { opacity: 1, y: 0, duration: 0.8, stagger: stagger.card, clearProps: "transform" },
          beat.furniture,
        );

        const nested = gsap.utils.toArray<HTMLElement>("[data-entrance-nested]", root);
        if (nested.length > 0) {
          gsap.set(nested, { opacity: 0, y: 8 });
          timeline.to(
            nested,
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              stagger: stagger.tight,
              clearProps: "transform",
            },
            beat.furniture + 0.22,
          );
        }
      }
    }, root);

    refreshScrollTriggers();
    return () => {
      context.revert();
      for (const split of splits) split?.revert();
    };
  }, [ready, reducedMotion, start, delay, beats]);

  return ref;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Masked image reveals
   ───────────────────────────────────────────────────────────────────────────── */

export interface ImageRevealOptions {
  /** `rise` reveals top-down, `draw` left-to-right, `alternate` flips per index. */
  direction?: "rise" | "draw" | "alternate";
  /** Tie the reveal to scroll position instead of playing it once. */
  scrub?: boolean;
  start?: string;
  end?: string;
  scaleFrom?: number;
}

/**
 * Reveals `[data-image-reveal]` frames inside the scope with a clip-path
 * curtain, while the image itself settles from a slight scale offset. The
 * curtain and the scale are two different elements (frame vs image), so no
 * property ever has two owners.
 */
export function useImageReveal<T extends HTMLElement>(options: ImageRevealOptions = {}) {
  const ref = useRef<T | null>(null);
  const { reducedMotion, ready } = useMotion();
  const {
    direction = "rise",
    scrub = false,
    start = scrub ? "top bottom" : "top 82%",
    end = "bottom 20%",
    scaleFrom = imageReveal.scaleFrom,
  } = options;

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root || !ready || reducedMotion) return;

    const context = gsap.context(() => {
      const frames = gsap.utils.toArray<HTMLElement>("[data-image-reveal]", root);

      frames.forEach((frame, index) => {
        const image = frame.querySelector<HTMLElement>("img");
        const resolved =
          direction === "alternate" ? (index % 2 === 0 ? "rise" : "draw") : direction;
        const clipFrom = imageReveal.clipFrom[resolved];

        gsap.set(frame, { clipPath: clipFrom, webkitClipPath: clipFrom });
        if (image) gsap.set(image, { scale: scaleFrom });

        const timeline = gsap.timeline(
          scrub
            ? { scrollTrigger: { trigger: frame, start, end, scrub: scrollDefaults.scrubSmooth } }
            : { scrollTrigger: { trigger: frame, start, once: true } },
        );

        timeline.to(frame, {
          clipPath: imageReveal.open,
          webkitClipPath: imageReveal.open,
          duration: scrub ? 1 : 1.15,
          ease: scrub ? gsapEase.linear : gsapEase.cinematic,
        });

        if (image) {
          timeline.to(
            image,
            {
              scale: 1,
              duration: scrub ? 1 : 1.5,
              ease: scrub ? gsapEase.linear : "power3.out",
              clearProps: scrub ? undefined : "scale",
            },
            0,
          );
        }
      });
    }, root);

    refreshScrollTriggers();
    return () => context.revert();
  }, [ready, reducedMotion, direction, scrub, start, end, scaleFrom]);

  return ref;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Line draws
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Draws `[data-line-draw]` rules by scaling them from 0 along one axis. Used by
 * the story rule, the ordering connector and card underlines.
 */
export function useLineDraw<T extends HTMLElement>(
  options: { axis?: "x" | "y"; start?: string; scrub?: boolean; stagger?: number } = {},
) {
  const ref = useRef<T | null>(null);
  const { reducedMotion, ready } = useMotion();
  const { axis = "x", start = "top 82%", scrub = false, stagger: gap = stagger.section } = options;

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root || !ready || reducedMotion) return;

    const context = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-line-draw]", root);
      if (lines.length === 0) return;
      const from = axis === "x" ? { scaleX: 0 } : { scaleY: 0 };
      const to = axis === "x" ? { scaleX: 1 } : { scaleY: 1 };

      gsap.set(lines, { ...from, transformOrigin: axis === "x" ? "left center" : "center top" });
      gsap.to(lines, {
        ...to,
        duration: scrub ? 1 : 0.9,
        ease: scrub ? gsapEase.linear : gsapEase.inOut,
        stagger: gap,
        scrollTrigger: scrub
          ? { trigger: root, start, end: "bottom 40%", scrub: scrollDefaults.scrubSmooth }
          : { trigger: root, start, once: true },
      });
    }, root);

    refreshScrollTriggers();
    return () => context.revert();
  }, [ready, reducedMotion, axis, start, scrub, gap]);

  return ref;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Scrubbed timelines
   ───────────────────────────────────────────────────────────────────────────── */

export interface ScrubTimelineOptions {
  start?: string;
  end?: string;
  scrub?: number;
  pin?: boolean;
}

/**
 * One way for a section to author a scroll-scrubbed timeline. The trigger is
 * scoped with `gsap.context()`, killed on unmount, and re-measured on refresh
 * via `invalidateOnRefresh`, so resize and remount cannot leave a stale scene.
 */
export function useScrubTimeline<T extends HTMLElement>(
  build: (timeline: gsap.core.Timeline, root: T) => void,
  options: ScrubTimelineOptions = {},
) {
  const ref = useRef<T | null>(null);
  const { reducedMotion, ready } = useMotion();
  const { start = "top bottom", end = "bottom top", scrub = scrollDefaults.scrubSmooth, pin = false } = options;
  // The builder is a render-scoped closure; keeping it in a ref avoids tearing
  // the timeline down and rebuilding it on every render.
  const builder = useRef(build);
  builder.current = build;

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root || !ready || reducedMotion) return;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start,
          end,
          scrub,
          pin,
          invalidateOnRefresh: true,
          anticipatePin: pin ? 1 : 0,
        },
      });
      builder.current(timeline, root);
    }, root);

    refreshScrollTriggers();
    return () => context.revert();
  }, [ready, reducedMotion, start, end, scrub, pin]);

  return ref;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Existing reveal system (kept: used by sections that need no choreography)
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Section reveal. Animates `[data-reveal]` descendants (and `[data-reveal-child]`
 * for staggered groups) when the section enters the viewport.
 *
 * Nothing is hidden until GSAP actually runs, so a JS failure can never leave a
 * section invisible.
 */
export function useSectionReveal<T extends HTMLElement>(
  options: { childSelector?: string; once?: boolean; start?: string; delay?: number } = {},
) {
  const ref = useRef<T | null>(null);
  const { reducedMotion, ready } = useMotion();
  const { childSelector = "[data-reveal-child]", once = true, start = scrollDefaults.start, delay = 0 } = options;

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root || !ready || reducedMotion) return;

    const context = gsap.context(() => {
      const singles = gsap.utils.toArray<HTMLElement>("[data-reveal]", root);
      const groups = gsap.utils.toArray<HTMLElement>("[data-reveal-group]", root);

      if (singles.length > 0) {
        gsap.set(singles, { opacity: 0, y: revealDistance.text });
        ScrollTrigger.batch(singles, {
          start,
          once,
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: gsapEase.cinematic,
              stagger: stagger.tight,
              delay,
              overwrite: "auto",
              clearProps: "transform",
            }),
        });
      }

      for (const group of groups) {
        const children = gsap.utils.toArray<HTMLElement>(childSelector, group);
        if (children.length === 0) continue;
        gsap.set(group, { opacity: 1 });
        gsap.set(children, { opacity: 0, y: revealDistance.card });
        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: gsapEase.cinematic,
          stagger: stagger.card,
          clearProps: "transform",
          scrollTrigger: { trigger: group, start, once },
        });
      }
    }, root);

    refreshScrollTriggers();
    return () => {
      context.revert();
      cancelScrollRefresh();
    };
  }, [ready, reducedMotion, childSelector, once, start, delay]);

  return ref;
}

/**
 * Headline sequencing: splits `[data-split]` text into words and brings them up
 * line by line. Skipped entirely for reduced motion (the plain headline stays).
 */
export function useHeadlineReveal<T extends HTMLElement>(options: { start?: string; delay?: number } = {}) {
  const ref = useRef<T | null>(null);
  const { reducedMotion, ready } = useMotion();
  const { start = "top 82%", delay = 0.1 } = options;

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root || !ready || reducedMotion) return;

    const targets = gsap.utils.toArray<HTMLElement>("[data-split]", root);
    if (targets.length === 0) return;

    const splits = targets.map((target) => splitHeadline(target)).filter((s) => s !== null);
    if (splits.length === 0) return;

    const context = gsap.context(() => {
      for (const split of splits) {
        gsap.set(split.words, { yPercent: 118, opacity: 0 });
        gsap.to(split.words, {
          yPercent: 0,
          opacity: 1,
          duration: 1.05,
          ease: gsapEase.cinematic,
          stagger: stagger.text,
          delay,
          scrollTrigger: { trigger: split.lines[0] ?? root, start, once: true },
        });
      }
    }, root);

    refreshScrollTriggers();

    return () => {
      context.revert();
      for (const split of splits) split.revert();
      cancelScrollRefresh();
    };
  }, [ready, reducedMotion, start, delay]);

  return ref;
}

/** Subtle scrub parallax — content drifts, layout never moves. */
export function useParallax<T extends HTMLElement>(strength = 80) {
  const ref = useRef<T | null>(null);
  const { reducedMotion, ready } = useMotion();

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || !ready || reducedMotion) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        { yPercent: -strength / 12 },
        {
          yPercent: strength / 12,
          ease: gsapEase.linear,
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: scrollDefaults.scrubSmooth,
          },
        },
      );
    }, element);

    return () => context.revert();
  }, [ready, reducedMotion, strength]);

  return ref;
}

/** Scroll-linked progress (0→1) reported through a callback, no re-renders. */
export function useScrollProgress(
  callback: (progress: number) => void,
  options: { start?: string; end?: string } = {},
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const handler = useRef(callback);
  handler.current = callback;
  const { reducedMotion, ready } = useMotion();

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || !ready) return;

    const trigger = ScrollTrigger.create({
      trigger: element,
      start: options.start ?? "top top",
      end: options.end ?? "bottom top",
      scrub: reducedMotion ? false : scrollDefaults.scrubSmooth,
      onUpdate: (self) => handler.current(self.progress),
    });

    return () => trigger.kill();
  }, [ready, reducedMotion, options.start, options.end]);

  return ref;
}

export { gsap, ScrollTrigger };
export type { RefObject };
