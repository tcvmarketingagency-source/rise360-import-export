"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger, useMotion } from "@/components/providers/MotionProvider";
import { gsapEase, scrollDefaults, stagger } from "./tokens";
import { splitHeadline } from "./split";

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Section reveal. Animates `[data-reveal]` descendants (and `[data-reveal-child]`
 * for staggered groups) when the section enters the viewport.
 *
 * Nothing is hidden until GSAP actually runs, so a JS failure can never leave a
 * section invisible. `gsap.context` guarantees a clean revert on unmount, which
 * also restores styles when a visitor switches to reduced motion.
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
        gsap.set(singles, { opacity: 0, y: 26 });
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
        gsap.set(children, { opacity: 0, y: 34 });
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

    ScrollTrigger.refresh();
    return () => context.revert();
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

    ScrollTrigger.refresh();

    return () => {
      context.revert();
      for (const split of splits) split.revert();
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
