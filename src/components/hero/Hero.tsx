"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { useMotion, gsap, ScrollTrigger } from "@/components/providers/MotionProvider";
import { heroCopy } from "@/lib/content/site";
import { gsapEase, stagger } from "@/lib/motion/tokens";
import { setHeroProgress, resetHeroScroll } from "@/lib/three/scrollBridge";
import { shouldRender3D } from "@/lib/webgl";
import { onIntroComplete, willPlayIntro } from "@/lib/intro";
import { telHref } from "@/lib/config/business";
import { splitHeadline } from "@/lib/motion/split";
import {
  BACKDROP_OPACITY,
  HERO_COMPOSITION,
  PANEL_ASPECT,
  PANEL_CROP,
  TEXT_SAFE,
  resolveCompositionPoint,
} from "@/lib/three/hero-rig";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

const HERO_DISH = "/images/hero/dish-plated.jpg";
const HERO_POSTER = "/images/hero/hero-poster.jpg";

export interface HeroProps {
  variant?: "plated" | "atmosphere";
}

/**
 * The fallback panel's geometry, generated from the same art-direction table the
 * 3D scene resolves against, so the photographic first paint and the WebGL scene
 * place the dish in exactly the same box. Rendered as static CSS (no script, no
 * client state) — identical on the server and in the browser.
 */
function buildPanelCss(): string {
  // Step the media queries finely where the composition changes fastest (the
  // 700–768 stacked→side handover) and coarsely elsewhere. Within a step the CSS
  // holds one value while the 3D scene interpolates, so the step size bounds the
  // difference between the fallback panel and the WebGL panel — verified to stay
  // within a few pixels at 1440/1024/786/390/360.
  const steps = new Set<number>();
  for (let width = 320; width <= 2080; width += 32) steps.add(width);
  for (let width = 700; width <= 768; width += 4) steps.add(width);
  for (const point of HERO_COMPOSITION) steps.add(point.width);
  const ordered = [...steps].filter((width) => width >= 320 && width <= 2080).sort((a, b) => a - b);

  const rules = ordered.map((min, index) => {
    const next = ordered[index + 1];
    const max = typeof next === "number" ? next - 1 : null;
    const point = resolveCompositionPoint(min);
    const room = point.bottomFrac - point.topFrac;
    const width = `min(${(point.widthFrac * 100).toFixed(2)}%, ${(room * 100).toFixed(2)}svh * ${PANEL_ASPECT})`;
    const query = max
      ? `@media (min-width: ${min}px) and (max-width: ${max}px)`
      : `@media (min-width: ${min}px)`;
    return `${query}{.hero-panel{--hero-panel-w:${width};top:${(point.topFrac * 100).toFixed(2)}svh;left:${(point.centerXFrac * 100).toFixed(2)}%}}`;
  });

  const base = `.hero-panel{position:absolute;z-index:-25;--hero-panel-w:min(90%,40svh * ${PANEL_ASPECT});width:var(--hero-panel-w);height:calc(var(--hero-panel-w) / ${PANEL_ASPECT});top:5.5svh;left:50%;transform:translateX(-50%)}`;
  // The media queries must follow the base rule, not sit inside it.
  return base + rules.join("");
}

export function Hero({ variant = "plated" }: HeroProps) {
  const { reducedMotion, ready, device, isDesktopPointer } = useMotion();
  const rootRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [sceneEnabled, setSceneEnabled] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [inView, setInView] = useState(true);
  const panelCss = useMemo(() => buildPanelCss(), []);

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

    // Let the hero copy paint first; the photographic panel covers the gap.
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
      style={{ ["--hero-copy-width" as string]: `${TEXT_SAFE.sideMaxWidthFrac * 100}%` }}
    >
      <style dangerouslySetInnerHTML={{ __html: panelCss }} />

      {/* ── Layer 1: dark base + dimmed backdrop (atmosphere only, never a second subject) ── */}
      <div className="absolute inset-0 -z-30" aria-hidden="true">
        <Image
          src={HERO_POSTER}
          alt=""
          fill
          sizes="100vw"
          quality={70}
          className="object-cover"
          style={{ opacity: BACKDROP_OPACITY }}
          data-testid="hero-backdrop"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,7,6,0.86)_0%,rgba(10,7,6,0.9)_45%,rgba(10,7,6,0.97)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_72%_48%,rgba(255,132,52,0.16)_0%,rgba(255,120,40,0.05)_45%,rgba(10,7,6,0)_75%)]" />
      </div>

      {/* ── Layer 2: the dish — photographic panel, same box as the 3D subject ── */}
      <div
        className={`hero-panel transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          sceneReady && variant === "plated" ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden="true"
        data-testid="hero-panel-fallback"
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            WebkitMaskImage:
              "radial-gradient(50% 50% at 50% 50%, #000 0%, #000 55%, rgba(0,0,0,0.94) 72%, rgba(0,0,0,0.42) 90%, transparent 100%)",
            maskImage:
              "radial-gradient(50% 50% at 50% 50%, #000 0%, #000 55%, rgba(0,0,0,0.94) 72%, rgba(0,0,0,0.42) 90%, transparent 100%)",
          }}
        >
          {/* Cropped by geometry, not by object-fit: the image is scaled to
              `1 / crop` of the panel box and offset, exactly like the canvas
              crop the 3D texture uses — so the photograph is never stretched. */}
          <Image
            src={HERO_DISH}
            alt=""
            width={1100}
            height={1100}
            priority
            sizes="(max-width: 767px) 90vw, 50vw"
            quality={82}
            className="absolute max-w-none object-cover"
            style={{
              width: `${(100 / PANEL_CROP.width).toFixed(3)}%`,
              height: `${(100 / PANEL_CROP.height).toFixed(3)}%`,
              left: `${((-PANEL_CROP.x / PANEL_CROP.width) * 100).toFixed(3)}%`,
              top: `${((-PANEL_CROP.y / PANEL_CROP.height) * 100).toFixed(3)}%`,
            }}
            data-testid="hero-dish-fallback"
          />
          {/* same inner vignette and warm sheen the 3D texture bakes in */}
          <div className="absolute inset-0 bg-[radial-gradient(60%_58%_at_50%_54%,rgba(10,7,6,0)_0%,rgba(10,7,6,0.15)_65%,rgba(10,7,6,0.34)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,169,90,0.1)_0%,rgba(255,140,60,0.035)_45%,rgba(255,120,40,0)_100%)] mix-blend-screen" />
        </div>
      </div>

      {/* ── Layer 3: WebGL subject + atmosphere ────────────────────────────── */}
      {sceneEnabled ? (
        <div
          className={`absolute inset-x-0 top-0 -z-20 h-[100svh] transition-opacity duration-1000 ${
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

      {/* ── Layer 4: art-directed contrast — ABOVE every visual layer, below the copy ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        {/* top vignette: the header is readable against any layer below it */}
        <div className="absolute inset-x-0 top-0 h-[28vh] bg-[linear-gradient(180deg,rgba(10,7,6,0.92)_0%,rgba(10,7,6,0.55)_45%,rgba(10,7,6,0)_100%)]" />
        {/* copy-column scrim (wide layouts) — keeps the words off the food */}
        <div className="absolute inset-y-0 left-0 hidden w-[62%] bg-[linear-gradient(90deg,rgba(10,7,6,0.94)_0%,rgba(10,7,6,0.72)_45%,rgba(10,7,6,0)_100%)] md:block" />
        {/* bottom scrim — protects the copy stack at every width */}
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(180deg,rgba(10,7,6,0)_0%,rgba(10,7,6,0.72)_55%,rgba(10,7,6,0.97)_100%)]" />
      </div>
      <div
        aria-hidden="true"
        className="grain-overlay pointer-events-none absolute inset-0 z-0 opacity-[0.18] mix-blend-overlay"
      />

      {/* ── Layer 5: copy ──────────────────────────────────────────────────── */}
      <div ref={copyRef} className="shell relative z-10 flex flex-col gap-6 sm:gap-8">
        {/* Micro row stays inside the copy column: measured at 1280/1440 the
            mono status pair over the dish dropped to 2:1 when it was allowed to
            run to the shell edge. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 md:max-w-[var(--hero-copy-width)] xl:flex-col xl:items-start">
          <p data-hero-line data-hero-parallax className="micro text-amber">
            {heroCopy.eyebrow}
          </p>
          <p data-hero-line data-hero-parallax className="micro hidden text-ash/80 xl:block">
            {heroCopy.statusLine}
          </p>
        </div>

        {/* One copy column at every width: on wide layouts it is capped to the
            text-safe fraction so the words can never reach the dish panel. */}
        <div className="flex flex-col gap-5 sm:gap-6 md:max-w-[var(--hero-copy-width)]">
          <div className="flex flex-col gap-6">
            <p
              data-hero-line
              data-hero-parallax
              className="micro hidden text-ivory/60 sm:block"
              style={{ letterSpacing: "0.42em" }}
            >
              {heroCopy.brand}
            </p>
            <h1
              id="hero-headline"
              data-hero-headline
              className="max-w-[15ch] text-[length:var(--hero-display)] leading-[0.96] text-ivory"
            >
              {heroCopy.headline}
            </h1>
            <p data-hero-staged className="max-w-md text-[0.98rem] leading-relaxed text-ivory/80">
              {heroCopy.support}
            </p>
          </div>

          <div data-hero-staged className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
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

        <div className="flex items-center gap-4 pt-0 sm:pt-2">
          <span aria-hidden="true" className="relative block h-10 w-px overflow-hidden bg-ivory/15">
            <span className="absolute inset-x-0 top-0 block h-4 animate-[scrollHint_2.4s_ease-in-out_infinite] bg-amber/80" />
          </span>
          <p data-hero-line className="micro text-ash/80">
            {heroCopy.scrollHint}
          </p>
        </div>
      </div>
    </section>
  );
}
