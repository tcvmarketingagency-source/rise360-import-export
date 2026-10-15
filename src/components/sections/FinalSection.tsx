"use client";

import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { MicroLabel } from "@/components/ui/Bits";
import { finalCopy } from "@/lib/content/site";
import { telHref, verified } from "@/lib/config/business";
import { useImageReveal, useSectionEntrance } from "@/lib/motion/gsap";
import { useMotion } from "@/components/providers/MotionProvider";

/**
 * Scene 08 — the closing invitation.
 *
 * The composition is the existing one (same photograph, same copy, same two
 * actions). What changed is that it now *closes* rather than simply appearing:
 * the image enters through a curtain and settles from a slight scale, the copy
 * arrives in beats, the two actions land on separate beats, and the concept
 * line — the last thing a visitor reads — arrives last. Nothing keeps moving
 * once the section has been read: there is no endless zoom and no forced
 * scroll.
 */
export function FinalSection() {
  const rootRef = useSectionEntrance<HTMLElement>({ start: "top 82%" });
  const imageRef = useImageReveal<HTMLElement>({
    direction: "rise",
    // Slower and gentler than the body copy: the photograph is the last
    // "scene", so it gets the longest settle in the page.
    scaleFrom: 1.08,
    start: "top 88%",
  });
  const { scrollToId } = useMotion();

  return (
    <section
      ref={(node) => {
        rootRef.current = node;
        imageRef.current = node;
      }}
      id="invitation"
      className="relative isolate flex min-h-[86svh] items-end overflow-hidden border-t border-ivory/8 bg-ink pb-16 pt-28 sm:pb-20"
      aria-labelledby="final-heading"
    >
      <div data-image-reveal className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/images/story/final-table.jpg"
          alt="A bowl of butter chicken in a mellow tomato gravy photographed on a dark table under warm light"
          fill
          sizes="100vw"
          quality={80}
          className="object-cover"
          style={{ backgroundColor: "#241a12" }}
        />
      </div>
      {/* Contrast treatment stays above the photograph, below the copy. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/80 to-ink/45"
      />
      <div aria-hidden="true" className="grain-overlay absolute inset-0 -z-10 opacity-[0.18] mix-blend-overlay" />

      <div className="shell relative flex flex-col gap-7">
        <MicroLabel tone="amber" data-beat="eyebrow">
          {finalCopy.micro}
        </MicroLabel>
        <h2
          id="final-heading"
          data-beat="headline"
          className="max-w-[24ch] text-[length:var(--text-display)] leading-[0.95] text-ivory"
        >
          {finalCopy.headline}
        </h2>
        <p data-beat="support" className="max-w-xl text-[0.98rem] leading-relaxed text-ivory/70">
          {finalCopy.support}
        </p>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <span data-beat="cta" className="flex">
            <ButtonLink
              href="#menu"
              size="lg"
              onClick={(event) => {
                event.preventDefault();
                scrollToId("#menu");
              }}
              data-testid="final-cta-menu"
            >
              {finalCopy.primaryCta}
              <span aria-hidden="true">→</span>
            </ButtonLink>
          </span>
          <span data-beat="ctaSecondary" className="flex">
            <ButtonLink href={telHref} external variant="secondary" size="lg" data-testid="final-cta-call">
              {finalCopy.secondaryCta} · {verified.deliveryPhone.display}
            </ButtonLink>
          </span>
        </div>

        <p
          data-beat="last"
          className="pt-2 text-[0.8rem] text-ash/80"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
        >
          {finalCopy.conceptLine}
        </p>
      </div>
    </section>
  );
}
