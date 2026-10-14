"use client";

import { ButtonLink } from "@/components/ui/Button";
import { ConfirmedChip, MicroLabel, PendingChip } from "@/components/ui/Bits";
import { deliveryCopy } from "@/lib/content/site";
import { telHref, verified } from "@/lib/config/business";
import { useHeadlineReveal, useSectionReveal } from "@/lib/motion/gsap";
import { useMotion } from "@/components/providers/MotionProvider";

export function DeliverySection() {
  const rootRef = useSectionReveal<HTMLElement>();
  const headlineRef = useHeadlineReveal<HTMLDivElement>();
  const { scrollToId } = useMotion();

  return (
    <section
      id="delivery"
      ref={rootRef}
      className="relative border-t border-ivory/8 bg-char py-20 sm:py-28"
      aria-labelledby="delivery-heading"
    >
      <div className="shell flex flex-col gap-12">
        <div ref={headlineRef} className="flex flex-col gap-5">
          <MicroLabel tone="amber">{deliveryCopy.micro}</MicroLabel>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
            <h2
              id="delivery-heading"
              data-split="true"
              className="text-[length:var(--text-display-sm)] leading-[0.98] text-ivory"
            >
              {deliveryCopy.headline}
            </h2>
            <p data-reveal className="max-w-lg text-[0.95rem] leading-relaxed text-ash">
              {deliveryCopy.support}
            </p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
          <dl className="flex flex-col divide-y divide-ivory/10 border-y border-ivory/10" data-reveal-group>
            {deliveryCopy.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
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
            <div className="relative aspect-square w-full max-w-sm self-center overflow-hidden rounded-sm border border-ivory/10 bg-ink/50">
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(221,160,74,0.20) 0%, rgba(221,160,74,0.07) 26%, rgba(10,7,6,0) 62%)",
                }}
              />
              {[34, 56, 78].map((size, index) => (
                <span
                  key={size}
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-ivory/15"
                  style={{
                    width: `${size}%`,
                    height: `${size}%`,
                    opacity: 1 - index * 0.22,
                    animation: `emberPulse ${7 + index * 2}s ease-in-out infinite`,
                  }}
                />
              ))}
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber"
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 border-t border-ivory/10 bg-ink/70 px-4 py-3 backdrop-blur-sm">
                <MicroLabel tone="amber">Delivery radius</MicroLabel>
                <p className="text-[0.8rem] text-ash">
                  Zones, charges and timings to be confirmed by the restaurant.
                </p>
              </div>
              <span className="micro absolute left-1/2 top-[18%] -translate-x-1/2 text-ash/60">
                Karimnagar
              </span>
            </div>

            <div className="flex flex-col gap-3">
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
