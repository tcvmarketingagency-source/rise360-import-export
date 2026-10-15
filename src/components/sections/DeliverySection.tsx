"use client";

import { useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { ConfirmedChip, MicroLabel, PendingChip } from "@/components/ui/Bits";
import { deliveryCopy } from "@/lib/content/site";
import { telHref, verified } from "@/lib/config/business";
import { useIsomorphicLayoutEffect, useSectionEntrance, gsap } from "@/lib/motion/gsap";
import { gsapEase, stagger } from "@/lib/motion/tokens";
import { useMotion } from "@/components/providers/MotionProvider";

export function DeliverySection() {
  const rootRef = useSectionEntrance<HTMLElement>();
  const { scrollToId } = useMotion();
  const { ready, reducedMotion } = useMotion();
  const diagramRef = useRef<HTMLDivElement>(null);

  /**
   * The radius diagram is the section's visual focal point: the centre point
   * lands first, then the rings expand outward in order, and the whole figure
   * breathes with scroll progress instead of an unconditional CSS keyframe loop
   * (which used to keep animating while the section was far off screen).
   */
  useIsomorphicLayoutEffect(() => {
    const root = diagramRef.current;
    if (!root || !ready || reducedMotion) return;

    const context = gsap.context(() => {
      const dot = root.querySelector<HTMLElement>("[data-radius-dot]");
      const glow = root.querySelector<HTMLElement>("[data-radius-glow]");
      const rings = gsap.utils.toArray<HTMLElement>("[data-radius-ring]", root);
      const label = root.querySelector<HTMLElement>("[data-radius-label]");

      const timeline = gsap.timeline({
        defaults: { ease: gsapEase.cinematic },
        scrollTrigger: { trigger: root, start: "top 84%", once: true },
      });

      if (glow) {
        gsap.set(glow, { opacity: 0, scale: 0.9 });
        timeline.to(glow, { opacity: 1, scale: 1, duration: 1.4 }, 0);
      }
      if (dot) {
        gsap.set(dot, { scale: 0, opacity: 0 });
        timeline.to(dot, { scale: 1, opacity: 1, duration: 0.6, ease: gsapEase.back }, 0.1);
      }
      rings.forEach((ring, index) => {
        gsap.set(ring, { scale: 0.88, opacity: 0 });
        timeline.to(
          ring,
          { scale: 1, opacity: 1, duration: 0.9, ease: gsapEase.soft },
          0.3 + index * 0.18,
        );
      });
      if (label) {
        gsap.set(label, { opacity: 0 });
        timeline.to(label, { opacity: 1, duration: 0.6 }, 0.85);
      }

      // Rows reveal in reading order, then the diagram, then the CTA.
      const rows = gsap.utils.toArray<HTMLElement>("[data-delivery-row]", root);
      if (rows.length > 0) {
        gsap.set(rows, { opacity: 0, y: 18 });
        gsap.to(rows, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: gsapEase.cinematic,
          stagger: stagger.section,
          clearProps: "transform",
          scrollTrigger: { trigger: rows[0], start: "top 88%", once: true },
        });
      }

      // A slow, scroll-linked emphasis — bounded, never a pulse loop.
      gsap.to(rings, {
        opacity: 0.55,
        ease: gsapEase.linear,
        stagger: 0.04,
        scrollTrigger: { trigger: root, start: "top 60%", end: "bottom 40%", scrub: 1 },
      });
    }, root);

    return () => context.revert();
  }, [ready, reducedMotion]);

  return (
    <section
      id="delivery"
      ref={rootRef}
      className="relative border-t border-ivory/8 bg-char py-20 sm:py-28"
      aria-labelledby="delivery-heading"
    >
      <div className="shell flex flex-col gap-12">
        <div className="flex flex-col gap-5">
          <MicroLabel tone="amber" data-beat="eyebrow">
            {deliveryCopy.micro}
          </MicroLabel>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
            <h2
              id="delivery-heading"
              data-split="true"
              className="text-[length:var(--text-display-sm)] leading-[0.98] text-ivory"
            >
              {deliveryCopy.headline}
            </h2>
            <p data-beat="support" className="max-w-lg text-[0.95rem] leading-relaxed text-ash">
              {deliveryCopy.support}
            </p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
          <dl className="flex flex-col divide-y divide-ivory/10 border-y border-ivory/10">
            {deliveryCopy.items.map((item) => (
              <div
                key={item.id}
                data-delivery-row
                className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8"
              >
                <dt className="micro shrink-0 text-ash/80 sm:pt-1">{item.label}</dt>
                <dd className="flex flex-col gap-2 sm:max-w-md sm:text-right">
                  <span className="text-[1rem] leading-snug text-ivory/90">{item.value}</span>
                  <span className="flex sm:justify-end">
                    {item.status === "confirmed" ? <ConfirmedChip /> : <PendingChip />}
                  </span>
                  <span className="text-[0.8rem] leading-relaxed text-ash/85">{item.note}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-6">
            {/* Decorative radius diagram — explicitly labelled as unconfirmed */}
            <div
              ref={diagramRef}
              className="relative aspect-square w-full max-w-sm self-center overflow-hidden rounded-sm border border-ivory/10 bg-ink/50"
              data-testid="delivery-diagram"
            >
              <div
                aria-hidden="true"
                data-radius-glow
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(221,160,74,0.20) 0%, rgba(221,160,74,0.07) 26%, rgba(10,7,6,0) 62%)",
                }}
              />
              {[34, 56, 78].map((size, index) => (
                <span
                  key={size}
                  data-radius-ring
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-ivory/15"
                  style={{ width: `${size}%`, height: `${size}%`, opacity: 1 - index * 0.22 }}
                />
              ))}
              <span
                data-radius-dot
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber"
              />
              <div
                data-radius-label
                className="absolute inset-x-0 bottom-0 flex flex-col gap-1 border-t border-ivory/10 bg-ink/70 px-4 py-3 backdrop-blur-sm"
              >
                <MicroLabel tone="amber">Delivery radius</MicroLabel>
                <p className="text-[0.8rem] text-ash">
                  Zones, charges and timings to be confirmed by the restaurant.
                </p>
              </div>
              <span className="micro absolute left-1/2 top-[18%] -translate-x-1/2 text-ash/60">
                Karimnagar
              </span>
            </div>

            <div data-beat="cta" className="flex flex-col gap-3">
              <ButtonLink
                href={telHref}
                external
                size="lg"
                fullWidth
                data-testid="delivery-call"
              >
                Call {verified.deliveryPhone.display}
              </ButtonLink>
              <ButtonLink
                href="#menu"
                variant="secondary"
                size="lg"
                fullWidth
                onClick={(event) => {
                  event.preventDefault();
                  scrollToId("#menu");
                }}
              >
                Explore the menu
              </ButtonLink>
              <p className="text-[0.78rem] leading-relaxed text-ash/75">{deliveryCopy.unconfirmedNote}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
