"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { useMotion, gsap, ScrollTrigger } from "@/components/providers/MotionProvider";
import { heroCopy } from "@/lib/content/site";
import { gsapEase, stagger } from "@/lib/motion/tokens";
import { setHeroProgress, resetHeroScroll } from "@/lib/three/scrollBridge";
import { getDeviceProfile, shouldRender3D } from "@/lib/webgl";
import { onIntroComplete, willPlayIntro } from "@/lib/intro";
import { telHref } from "@/lib/config/business";
import { splitHeadline } from "@/lib/motion/split";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

const HERO_DISH = "/images/hero/dish-plated.jpg";
const HERO_POSTER = "/images/hero/hero-poster.jpg";

export interface HeroProps {
  variant?: "plated" | "atmosphere";
}

export function Hero({ variant = "plated" }: HeroProps) {
  const { reducedMotion, ready, device, isDesktopPointer } = useMotion();
  const rootRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [sceneEnabled, setSceneEnabled] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [inView, setInView] = useState(true);

  /* ── 1. Hand the scroll position to the 3D scene (GSAP owns scroll) ────── */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !ready) return;

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => setHeroProgress(self.progress),
      onLeave: () => setHeroProgress(1),
      onLeaveBack: () => setHeroProgress(0),
    });

    return () => {
      trigger.kill();
      resetHeroScroll();
    };
  }, [ready]);

  /* ── 2. Mount WebGL only when it will help: after first paint, in view ── */
  useEffect(() => {
    if (!ready) return;
    if (!shouldRender3D()) {
      setSceneEnabled(false);
      return;
    }

    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      setSceneEnabled(true);
    };

    // Let the hero copy paint first; the photographic poster covers the gap.
    let timeoutHandle = 0;
    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      idleWindow.requestIdleCallback(schedule, { timeout: 1200 });
    } else {
      timeoutHandle = window.setTimeout(schedule, 320);
    }

    return () => {
      cancelled = true;
      if (timeoutHandle) window.clearTimeout(timeoutHandle);
    };
  }, [ready]);

  /* ── 3. Pause the frame loop when the hero scrolls out or tab hides ───── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { rootMargin: "120px" },
    );
    observer.observe(root);

    const onVisibility = () => {
      if (document.hidden) setInView(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  /* ── 4. Hero copy choreography, released once the intro finishes ──────── */
  const playCopy = useCallback(() => {
    const copy = copyRef.current;
    if (!copy) return;

    const headline = copy.querySelector<HTMLElement>("[data-hero-headline]");
    const split = headline && !reducedMotion ? splitHeadline(headline) : null;

    gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]", copy);
      const staged = gsap.utils.toArray<HTMLElement>("[data-hero-staged]", copy);

      if (split) {
        gsap.set(split.words, { yPercent: 116, opacity: 0 });
      }
      // `yPercent` here and `y` in the pointer parallax: two channels of the
      // same transform, so the two systems never overwrite each other.
      gsap.set([...lines, ...staged], { opacity: 0, yPercent: 7 });

      const timeline = gsap.timeline({ defaults: { ease: gsapEase.cinematic } });
      timeline
        .to(lines, { opacity: 1, yPercent: 0, duration: 0.9, stagger: stagger.tight })
        .to(
          split ? split.words : headline,
          split
            ? { yPercent: 0, opacity: 1, duration: 1.15, stagger: stagger.text }
            : { opacity: 1, duration: 0.9 },
          0.25,
        )
        .to(staged, { opacity: 1, yPercent: 0, duration: 0.9, stagger: 0.1 }, 0.75);
    }, copy);
  }, [reducedMotion]);

  useEffect(() => {
    if (!ready) return;
    const copy = copyRef.current;
    if (!copy) return;

    if (reducedMotion) {
      // No hiding at all: the hero is simply present.
      return;
    }

    const introPending = willPlayIntro();
    if (introPending) {
      const copyRoot = copy;
      gsap.set(
        [...copyRoot.querySelectorAll("[data-hero-line]"), ...copyRoot.querySelectorAll("[data-hero-staged]")],
        { opacity: 0, yPercent: 7 },
      );
      return onIntroComplete(playCopy);
    }

    playCopy();
    return undefined;
  }, [ready, reducedMotion, playCopy]);

  /* ── 5. Gentle pointer parallax on the copy layers (desktop only) ─────── */
  useEffect(() => {
    if (!ready || reducedMotion || !isDesktopPointer) return;
    const copy = copyRef.current;
    if (!copy) return;

    const layers = gsap.utils.toArray<HTMLElement>("[data-hero-parallax]", copy);
    if (layers.length === 0) return;

    const quickTos = layers.map((layer) =>
      gsap.quickTo(layer, "y", { duration: 0.8, ease: "power3.out" }),
    );

    const onMove = (event: PointerEvent) => {
      // Vertical pointer position only: a restrained, depth-graded drift, no
      // second axis competing for the same transform.
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      quickTos.forEach((move, index) => {
        const depth = (index + 1) * 5;
        move(-y * depth);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      // quickTo returns a function backed by a persistent tween; kill it so a
      // remount (HMR, route change) cannot leave tweens ticking on dead nodes.
      for (const move of quickTos) move.tween.kill();
    };
  }, [ready, reducedMotion, isDesktopPointer]);

  return (
    <section
      ref={rootRef}
      id="hero"
      aria-labelledby="hero-headline"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink pb-10 pt-28 sm:pb-14"
    >
      {/* ── Layer 1: photographic poster — always present, never a blank gap ── */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={HERO_POSTER}
          alt="A dark bowl of chicken dum biryani with saffron rice, fried onion and mint, on a warm wooden table as steam rises"
          fill
          priority
          sizes="100vw"
          quality={82}
          className={`object-cover transition-opacity duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            sceneReady && variant === "plated" ? "opacity-0" : "opacity-100"
          }`}
          data-testid="hero-poster"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_18%,rgba(10,7,6,0.15)_0%,rgba(10,7,6,0.72)_58%,rgba(10,7,6,0.96)_100%)]"
        />
      </div>

      {/* ── Layer 2: WebGL scene ────────────────────────────────────────────── */}
      {sceneEnabled ? (
        <div
          className={`absolute inset-0 -z-[5] transition-opacity duration-1000 ${
            sceneReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <HeroScene
            dishSrc={HERO_DISH}
            variant={variant}
            quality={device}
            reducedMotion={reducedMotion}
            active={inView && sceneEnabled}
            onReady={() => setSceneReady(true)}
          />
        </div>
      ) : null}

      {/* ── Layer 3: film grain + bottom scrim ─────────────────────────────── */}
      <div
        aria-hidden="true"
        className="grain-overlay pointer-events-none absolute inset-0 -z-[4] opacity-[0.22] mix-blend-overlay"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-[4] h-1/2 bg-gradient-to-t from-ink via-ink/70 to-transparent"
      />

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div ref={copyRef} className="shell relative z-10 flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p data-hero-line data-hero-parallax className="micro text-amber">
            {heroCopy.eyebrow}
          </p>
          <p data-hero-line data-hero-parallax className="micro hidden text-ash/70 lg:block">
            {heroCopy.statusLine}
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end">
          <div className="flex flex-col gap-6">
            <p
              data-hero-line
              data-hero-parallax
              className="micro text-ivory/60"
              style={{ letterSpacing: "0.42em" }}
            >
              {heroCopy.brand}
            </p>
            <h1
              id="hero-headline"
              data-hero-headline
              className="max-w-[15ch] text-[length:var(--text-display)] leading-[0.94] text-ivory"
            >
              {heroCopy.headline}
            </h1>
          </div>

          <div className="flex flex-col gap-6 lg:pb-2">
            <p data-hero-staged className="max-w-md text-[0.98rem] leading-relaxed text-ivory/75">
              {heroCopy.support}
            </p>
            <div data-hero-staged className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href={heroCopy.primaryCta.href} size="lg" variant="primary" data-testid="hero-cta-menu">
                {heroCopy.primaryCta.label}
                <span aria-hidden="true">→</span>
              </ButtonLink>
              <ButtonLink
                href={telHref}
                external
                size="lg"
                variant="secondary"
                data-testid="hero-cta-call"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 4h4l2 5-2.5 1.5a12 12 0 006 6L15 14l5 2v4a1 1 0 01-1 1A16 16 0 013 5a1 1 0 011-1z" />
                </svg>
                {heroCopy.secondaryCta.label}
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <span aria-hidden="true" className="relative block h-10 w-px overflow-hidden bg-ivory/15">
            <span className="absolute inset-x-0 top-0 block h-4 animate-[scrollHint_2.4s_ease-in-out_infinite] bg-amber/80" />
          </span>
          <p data-hero-line className="micro text-ash/70">
            {heroCopy.scrollHint}
          </p>
        </div>
      </div>
    </section>
  );
}
