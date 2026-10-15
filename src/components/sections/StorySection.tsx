"use client";

import Image from "next/image";
import { useRef } from "react";
import { MicroLabel } from "@/components/ui/Bits";
import {
  useIsomorphicLayoutEffect,
  useLineDraw,
  useSectionEntrance,
  gsap,
  ScrollTrigger,
} from "@/lib/motion/gsap";
import { storyScenes } from "@/lib/content/site";
import { beat, gsapEase, imageReveal, revealDistance, stagger } from "@/lib/motion/tokens";
import { useMotion } from "@/components/providers/MotionProvider";

const journey = ["Ingredients", "Kitchen", "The plate", "The menu", "The order", "Your doorstep"];

export function StorySection() {
  const rootRef = useSectionEntrance<HTMLElement>();
  const ruleRef = useLineDraw<HTMLElement>({ start: "top 84%" });
  const { reducedMotion, ready } = useMotion();
  const journeyRef = useRef<HTMLDivElement>(null);

  /**
   * The journey line is the section's spine: the rule fills with scroll while
   * each milestone moves through upcoming → current → completed. One scrubbed
   * trigger owns the whole thing, so the states can never disagree with the
   * line position.
   */
  useIsomorphicLayoutEffect(() => {
    const root = journeyRef.current;
    if (!root || !ready || reducedMotion) return;

    const context = gsap.context(() => {
      const line = root.querySelector<HTMLElement>("[data-journey-line]");
      const nodes = gsap.utils.toArray<HTMLElement>("[data-journey-node]", root);

      if (line) {
        gsap.fromTo(
          line,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: gsapEase.linear,
            scrollTrigger: { trigger: root, start: "top 78%", end: "bottom 62%", scrub: 0.6 },
          },
        );
      }

      nodes.forEach((node, index) => {
        const mark = node.querySelector<HTMLElement>("[data-journey-mark]");
        const total = Math.max(1, nodes.length - 1);
        const threshold = index / total;

        gsap.set(node, { opacity: 0.32 });
        if (mark) gsap.set(mark, { scaleX: 0 });

        const trigger = ScrollTrigger.create({
          trigger: root,
          start: "top 78%",
          end: "bottom 62%",
          scrub: 0.6,
          onUpdate: (self) => {
            const reached = self.progress >= threshold;
            // Completed / current / upcoming, derived from the same progress
            // value that drives the line — never a separate animation.
            gsap.to(node, {
              opacity: reached ? 1 : 0.32,
              duration: 0.35,
              ease: gsapEase.soft,
              overwrite: "auto",
            });
            node.dataset.state = reached ? (self.progress >= threshold + 1 / total ? "completed" : "current") : "upcoming";
            if (mark) {
              gsap.to(mark, {
                scaleX: reached ? 1 : 0,
                duration: 0.35,
                ease: gsapEase.soft,
                overwrite: "auto",
              });
            }
          },
        });

        void trigger;
      });
    }, root);

    return () => context.revert();
  }, [ready, reducedMotion]);

  return (
    <section
      id="story"
      ref={(node) => {
        rootRef.current = node;
        ruleRef.current = node;
      }}
      className="relative border-t border-ivory/8 bg-char py-20 sm:py-28"
      aria-labelledby="story-heading"
    >
      <div className="shell flex flex-col gap-16 sm:gap-24">
        <div className="flex flex-col gap-6">
          <MicroLabel tone="amber" data-beat="eyebrow">
            {"Section 02 — The story"}
          </MicroLabel>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
            <h2
              id="story-heading"
              data-beat="headline"
              className="max-w-[22ch] text-[length:var(--text-display-sm)] leading-[0.98] text-ivory"
            >
              {"A meal is a sequence,\nnot a single moment."}
            </h2>
            <p data-beat="support" className="max-w-md text-[0.95rem] leading-relaxed text-ash">
              Six things happen between a raw ingredient and a knock on your door. This section follows them —
              and then hands you the menu, because that is where the sequence matters most to you.
            </p>
          </div>
          {/* Editorial rule: draws across the section as it enters. */}
          <span aria-hidden="true" className="mt-2 block h-px w-full bg-ivory/12">
            <span data-line-draw className="block h-px w-full origin-left bg-ivory/25" />
          </span>
        </div>

        <div className="flex flex-col gap-16 sm:gap-24">
          {storyScenes.map((scene, index) => (
            <SceneBlock key={scene.id} scene={scene} reversed={index % 2 === 1} priority={index === 0} />
          ))}
        </div>

        <div ref={journeyRef} data-beat="furniture" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <MicroLabel tone="amber">The sequence</MicroLabel>
            <MicroLabel>Live order flow · concept architecture</MicroLabel>
          </div>
          <div className="relative">
            <span aria-hidden="true" className="absolute left-0 right-0 top-1/2 h-px bg-ivory/12" />
            <span
              data-journey-line
              aria-hidden="true"
              className="absolute left-0 right-0 top-1/2 h-px origin-left bg-amber/70"
            />
            <ol className="relative flex flex-wrap justify-between gap-y-6">
              {journey.map((step, index) => (
                <li
                  key={step}
                  data-journey-node
                  data-state="upcoming"
                  className="flex min-w-[7rem] flex-col gap-2 bg-char pr-4"
                >
                  <span className="micro text-ash/70">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-[0.9rem] text-ivory/85">{step}</span>
                  <span
                    data-journey-mark
                    aria-hidden="true"
                    className="block h-px w-full origin-left bg-amber/60"
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * One story scene.
 *
 * Motion order is fixed and deliberate: act number → act label → the image
 * curtain (with the photograph settling from 1.06) → headline → support →
 * marker rows. The frame is the focal point, so its curtain opens first and the
 * copy follows it rather than racing it. As the *next* scene arrives this one
 * recedes (a small scale-down and dim), so the two frames never compete at full
 * strength.
 */
function SceneBlock({
  scene,
  reversed,
  priority,
}: {
  scene: (typeof storyScenes)[number];
  reversed: boolean;
  priority?: boolean;
}) {
  const sceneRef = useRef<HTMLElement>(null);
  const { reducedMotion, ready } = useMotion();

  useIsomorphicLayoutEffect(() => {
    const root = sceneRef.current;
    if (!root || !ready || reducedMotion) return;

    const context = gsap.context(() => {
      const acts = gsap.utils.toArray<HTMLElement>("[data-scene-act]", root);
      const frame = root.querySelector<HTMLElement>("[data-image-reveal]");
      const image = frame?.querySelector<HTMLElement>("img") ?? null;
      const headline = root.querySelector<HTMLElement>("[data-scene-headline]");
      const support = root.querySelector<HTMLElement>("[data-scene-support]");
      const markers = gsap.utils.toArray<HTMLElement>("[data-scene-marker]", root);

      // Initial states (client-side only, so a JS failure still shows content).
      gsap.set(acts, { opacity: 0, x: reversed ? 18 : -18 });
      if (frame) gsap.set(frame, { clipPath: imageReveal.clipFrom.rise, webkitClipPath: imageReveal.clipFrom.rise });
      if (image) gsap.set(image, { scale: imageReveal.scaleFrom });
      if (headline) gsap.set(headline, { opacity: 0, y: revealDistance.card });
      if (support) gsap.set(support, { opacity: 0, y: revealDistance.text });
      gsap.set(markers, { opacity: 0, y: revealDistance.micro });

      const timeline = gsap.timeline({
        defaults: { ease: gsapEase.cinematic },
        scrollTrigger: { trigger: root, start: "top 76%", once: true },
      });

      timeline.to(acts, { opacity: 1, x: 0, duration: 0.7, stagger: stagger.tight }, 0);

      // The frame is the focal point: its curtain opens first, the photograph
      // settles from 1.06, and the copy follows.
      if (frame) {
        timeline.to(
          frame,
          { clipPath: imageReveal.open, webkitClipPath: imageReveal.open, duration: 1.15 },
          0.08,
        );
      }
      if (image) {
        timeline.to(image, { scale: 1, duration: 1.5, ease: "power3.out", clearProps: "scale" }, 0.08);
      }

      if (headline) timeline.to(headline, { opacity: 1, y: 0, duration: 0.9 }, beat.headline + 0.3);
      if (support) timeline.to(support, { opacity: 1, y: 0, duration: 0.8 }, beat.support + 0.34);
      timeline.to(markers, { opacity: 1, y: 0, duration: 0.6, stagger: stagger.card }, beat.furniture + 0.1);

      // As the following scene takes over, this frame recedes rather than
      // sitting at full strength behind it.
      const next = root.nextElementSibling;
      if (next) {
        gsap.to(root, {
          opacity: 0.62,
          scrollTrigger: { trigger: next, start: "top 72%", end: "top 30%", scrub: 0.6 },
        });
      }
    }, root);

    return () => context.revert();
  }, [ready, reducedMotion, reversed]);

  return (
    <article
      ref={sceneRef}
      className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
        reversed ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div className="relative">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-ivory/10 sm:aspect-[3/2] lg:aspect-[4/5]">
          <div data-image-reveal className="absolute inset-0 overflow-hidden">
            <Image
              src={scene.media.src}
              alt={scene.media.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 48vw"
              quality={80}
              priority={priority}
              className="object-cover"
              style={{ backgroundColor: scene.media.tone }}
            />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <span className="micro absolute bottom-4 left-4 text-ivory/70">{scene.media.caption}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span data-scene-act className="micro text-amber">
            {scene.index}
          </span>
          <span data-scene-act aria-hidden="true" className="h-px w-10 bg-amber/50" />
          <span data-scene-act>
            <MicroLabel tone="ivory">{scene.act}</MicroLabel>
          </span>
        </div>
        <h3
          data-scene-headline
          className="max-w-[20ch] whitespace-pre-line text-[clamp(1.8rem,4.6vw,2.9rem)] leading-[1.02] text-ivory"
        >
          {scene.headline}
        </h3>
        <p data-scene-support className="max-w-lg text-[0.95rem] leading-relaxed text-ash">
          {scene.support}
        </p>
        <dl className="mt-2 flex flex-col divide-y divide-ivory/10 border-y border-ivory/10">
          {scene.markers.map((marker) => (
            <div
              key={marker.label}
              data-scene-marker
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <dt className="micro text-ash/80">{marker.label}</dt>
              <dd className="text-right text-[0.9rem] text-ivory/85">{marker.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
