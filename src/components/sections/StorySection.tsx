"use client";

import Image from "next/image";
import { useRef } from "react";
import { MicroLabel, RuleLine } from "@/components/ui/Bits";
import { useHeadlineReveal, useIsomorphicLayoutEffect, useParallax, useSectionReveal } from "@/lib/motion/gsap";
import { gsap, ScrollTrigger } from "@/components/providers/MotionProvider";
import { storyScenes } from "@/lib/content/site";
import { gsapEase, stagger } from "@/lib/motion/tokens";
import { useMotion } from "@/components/providers/MotionProvider";

const journey = ["Ingredients", "Kitchen", "The plate", "The menu", "The order", "Your doorstep"];

export function StorySection() {
  const rootRef = useSectionReveal<HTMLElement>();
  const headlineRef = useHeadlineReveal<HTMLDivElement>();
  const { reducedMotion, ready } = useMotion();
  const journeyRef = useRef<HTMLDivElement>(null);

  // The journey line fills as the visitor scrolls — it ties the story to the order.
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
      if (nodes.length > 0) {
        gsap.fromTo(
          nodes,
          { opacity: 0.28, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: stagger.section,
            ease: gsapEase.soft,
            scrollTrigger: { trigger: root, start: "top 76%", once: true },
          },
        );
      }
    }, root);

    ScrollTrigger.refresh();
    return () => context.revert();
  }, [ready, reducedMotion]);

  return (
    <section
      id="story"
      ref={rootRef}
      className="relative border-t border-ivory/8 bg-char py-20 sm:py-28"
      aria-labelledby="story-heading"
    >
      <div className="shell flex flex-col gap-16 sm:gap-24">
        <div ref={headlineRef} className="flex flex-col gap-6">
          <MicroLabel tone="amber">Section 02 — The story</MicroLabel>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
            <h2
              id="story-heading"
              data-split="true"
              className="max-w-[22ch] text-[length:var(--text-display-sm)] leading-[0.98] text-ivory"
            >
              {"A meal is a sequence,\nnot a single moment."}
            </h2>
            <p data-reveal className="max-w-md text-[0.95rem] leading-relaxed text-ash">
              Six things happen between a raw ingredient and a knock on your door. This section follows them —
              and then hands you the menu, because that is where the sequence matters most to you.
            </p>
          </div>
          <RuleLine className="mt-2" />
        </div>

        {storyScenes.map((scene, index) => (
          <SceneBlock key={scene.id} scene={scene} reversed={index % 2 === 1} priority={index === 0} />
        ))}

        <div ref={journeyRef} className="flex flex-col gap-6" data-reveal>
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
                <li key={step} data-journey-node className="flex min-w-[7rem] flex-col gap-2 bg-char pr-4">
                  <span className="micro text-ash/70">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-[0.9rem] text-ivory/85">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function SceneBlock({
  scene,
  reversed,
  priority,
}: {
  scene: (typeof storyScenes)[number];
  reversed: boolean;
  priority?: boolean;
}) {
  const mediaRef = useParallax<HTMLDivElement>(70);

  return (
    <article
      className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
        reversed ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div ref={mediaRef} className="relative" data-reveal>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-ivory/10 sm:aspect-[3/2] lg:aspect-[4/5]">
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

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="micro text-amber">{scene.index}</span>
          <span className="h-px w-10 bg-amber/50" aria-hidden="true" />
          <MicroLabel tone="ivory">{scene.act}</MicroLabel>
        </div>
        <h3 data-reveal className="max-w-[20ch] whitespace-pre-line text-[clamp(1.8rem,4.6vw,2.9rem)] leading-[1.02] text-ivory">
          {scene.headline}
        </h3>
        <p data-reveal className="max-w-lg text-[0.95rem] leading-relaxed text-ash">
          {scene.support}
        </p>
        <dl data-reveal-group className="mt-2 flex flex-col divide-y divide-ivory/10 border-y border-ivory/10">
          {scene.markers.map((marker) => (
            <div key={marker.label} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="micro text-ash/80">{marker.label}</dt>
              <dd className="text-right text-[0.9rem] text-ivory/85">{marker.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
