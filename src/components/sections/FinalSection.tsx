"use client";

import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { MicroLabel } from "@/components/ui/Bits";
import { finalCopy } from "@/lib/content/site";
import { telHref, verified } from "@/lib/config/business";
import { useHeadlineReveal, useSectionReveal } from "@/lib/motion/gsap";
import { useMotion } from "@/components/providers/MotionProvider";

/** Scene 08 — final invitation. One image, one promise-free line, two actions. */
export function FinalSection() {
  const rootRef = useSectionReveal<HTMLElement>();
  const headlineRef = useHeadlineReveal<HTMLDivElement>();
  const { scrollToId } = useMotion();

  return (
    <section
      ref={rootRef}
      id="invitation"
      className="relative isolate flex min-h-[86svh] items-end overflow-hidden border-t border-ivory/8 bg-ink pb-16 pt-28 sm:pb-20"
      aria-labelledby="final-heading"
    >
      <Image
        src="/images/story/final-table.jpg"
        alt="A bowl of butter chicken in a mellow tomato gravy photographed on a dark table under warm light"
        fill
        sizes="100vw"
        quality={80}
        className="-z-10 object-cover"
        style={{ backgroundColor: "#241a12" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/80 to-ink/45"
      />
      <div aria-hidden="true" className="grain-overlay absolute inset-0 -z-10 opacity-[0.18] mix-blend-overlay" />

      <div ref={headlineRef} className="shell relative flex flex-col gap-7">
        <MicroLabel tone="amber">{finalCopy.micro}</MicroLabel>
        <h2
          id="final-heading"
          data-split="true"
          className="max-w-[24ch] text-[length:var(--text-display)] leading-[0.95] text-ivory"
        >
          {finalCopy.headline}
        </h2>
        <p className="max-w-xl text-[0.98rem] leading-relaxed text-ivory/70">{finalCopy.support}</p>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
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
          <ButtonLink href={telHref} external variant="secondary" size="lg" data-testid="final-cta-call">
            {finalCopy.secondaryCta} · {verified.deliveryPhone.display}
          </ButtonLink>
        </div>

        <p className="pt-2 text-[0.8rem] text-ash/80" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
          {finalCopy.conceptLine}
        </p>
      </div>
    </section>
  );
}
