"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMotion, gsap } from "@/components/providers/MotionProvider";
import { introCopy } from "@/lib/content/site";
import { gsapEase } from "@/lib/motion/tokens";
import { INTRO_SESSION_KEY, emitIntroComplete, markIntroSeen } from "@/lib/intro";

/**
 * Cinematic introduction — rendered in the initial HTML so the first paint is
 * already the film, not a flash of the hero.
 *
 * Two pre-paint gates decide whether it is seen at all, and neither one is this
 * component: `prefers-reduced-motion` is handled in CSS (globals.css), and
 * "already seen this session" is handled by a tiny inline script in the root
 * layout that writes `data-intro="skip"` on <html>. CSS hides the overlay for
 * both, and this component then simply releases the hero choreography.
 *
 * Guarantees:
 *   • SKIP is always visible; scroll, wheel, tap or any key dismisses instantly.
 *   • ~5 seconds total, no fake loading bar, no artificial delay.
 *   • Plays once per session.
 *   • Shorter, lighter version on phones.
 */
export function IntroOverlay() {
  const [suppressed, setSuppressed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { reducedMotion, ready, lockScroll } = useMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [beatIndex, setBeatIndex] = useState(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    const flagged = document.documentElement.dataset.intro === "skip";
    const shouldPlay =
      !flagged &&
      !reducedMotion &&
      (() => {
        try {
          return window.sessionStorage.getItem(INTRO_SESSION_KEY) !== "done";
        } catch {
          return true;
        }
      })();

    if (!shouldPlay) {
      setSuppressed(true);
      markIntroSeen();
      emitIntroComplete();
      return;
    }
    setPlaying(true);
    rootRef.current?.querySelector<HTMLButtonElement>("[data-testid='intro-skip']")?.focus();
  }, [ready, reducedMotion]);

  const finish = (instant = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const root = rootRef.current;

    const complete = () => {
      setSuppressed(true);
      setPlaying(false);
      emitIntroComplete();
    };

    if (instant || !root || !playing) {
      complete();
      return;
    }

    gsap.to(root, { opacity: 0, duration: 0.62, ease: gsapEase.soft, onComplete: complete });
  };

  // Dismissal: a visitor is never trapped behind the animation.
  useEffect(() => {
    if (!playing) return;
    lockScroll(true);

    const onSkip = () => finish();
    window.addEventListener("wheel", onSkip, { passive: true });
    window.addEventListener("touchstart", onSkip, { passive: true });
    window.addEventListener("keydown", onSkip);
    window.addEventListener("scroll", onSkip, { passive: true });

    return () => {
      window.removeEventListener("wheel", onSkip);
      window.removeEventListener("touchstart", onSkip);
      window.removeEventListener("keydown", onSkip);
      window.removeEventListener("scroll", onSkip);
      lockScroll(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, lockScroll]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !playing) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const beats = isMobile ? introCopy.sequence.slice(0, 4) : introCopy.sequence;
    const beatTime = isMobile ? 0.36 : 0.48;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: gsapEase.cinematic },
        onComplete: () => finish(),
      });

      timeline
        .set("[data-intro-light]", { scale: 0.62, opacity: 0 })
        .to("[data-intro-light]", { scale: 1.14, opacity: 1, duration: 2.4 }, 0)
        .fromTo("[data-intro-rule]", { scaleX: 0 }, { scaleX: 1, duration: 1.05, ease: gsapEase.inOut }, 0.15)
        .fromTo(
          "[data-intro-brand]",
          { yPercent: 116, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 1.15 },
          0.22,
        )
        .fromTo("[data-intro-meta]", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7 }, 0.7);

      // The journey: ingredients → kitchen → plate → menu → order → doorstep.
      timeline.set("[data-intro-beats]", { opacity: 1 }, 1.4);
      beats.forEach((_, index) => {
        timeline.call(() => setBeatIndex(index), [], 1.5 + index * beatTime);
      });

      const tail = 1.5 + beats.length * beatTime;
      timeline
        .to("[data-intro-beats]", { opacity: 0, duration: 0.35 }, tail)
        .fromTo("[data-intro-exit]", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55 }, tail + 0.15)
        .to("[data-intro-progress]", { scaleX: 1, duration: 0.5, ease: gsapEase.linear }, tail + 0.2)
        .to({}, { duration: 0.5 });
    }, root);

    return () => context.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  if (suppressed) return null;

  return (
    <div
      ref={rootRef}
      data-intro-root
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-ink"
      role="region"
      aria-label="Introduction to Maitri Residency"
      data-playing={playing ? "true" : "false"}
      data-testid="intro-overlay"
    >
      <div
        aria-hidden="true"
        data-intro-light
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130vmin] w-[130vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(221,160,74,0.30), rgba(160,88,30,0.14) 38%, rgba(10,7,6,0) 68%)",
        }}
      />
      <div
        aria-hidden="true"
        className="grain-overlay pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay"
      />

      <div className="shell relative flex h-full flex-col justify-between py-8 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <span data-intro-meta className="micro text-ash">
            {introCopy.location}
          </span>
          <button
            type="button"
            onClick={() => finish()}
            className="micro flex items-center gap-2 rounded-full border border-ivory/20 px-3.5 py-2.5 text-ivory/80 transition-colors hover:border-amber/60 hover:text-amber"
            data-testid="intro-skip"
          >
            {introCopy.skip}
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-6 text-center">
          <div className="overflow-hidden pb-1">
            <p
              data-intro-brand
              className="text-[clamp(1.6rem,7vw,4.4rem)] leading-[0.95] tracking-[0.02em] text-ivory"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {introCopy.brand}
            </p>
          </div>
          <span data-intro-rule className="h-px w-[min(28rem,72vw)] origin-left bg-amber/50" aria-hidden="true" />
          <p
            data-intro-beats
            className="micro h-6 text-amber opacity-0"
            aria-live="polite"
            data-testid="intro-beat"
          >
            {introCopy.sequence[beatIndex]}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <p data-intro-exit className="micro text-ash/80 opacity-0">
              {introCopy.entering} — {introCopy.location}
            </p>
            <p className="micro hidden text-ash/60 sm:block">Tap, scroll or press any key to skip</p>
          </div>
          <div className="h-px w-full bg-ivory/12">
            <div data-intro-progress className="h-px w-full origin-left scale-x-0 bg-amber" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
