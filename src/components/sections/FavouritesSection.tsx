"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ItemDialog } from "@/components/menu/ItemDialog";
import { MicroLabel, SampleBadge, DietaryRow } from "@/components/ui/Bits";
import { useCart } from "@/components/cart/CartProvider";
import { defaultSelection } from "@/lib/cart/line";
import { formatPrice } from "@/lib/format";
import { getFeaturedItems } from "@/lib/menu";
import { favouritesCopy } from "@/lib/content/site";
import type { MenuItem } from "@/lib/menu/types";
import { useHeadlineReveal, useIsomorphicLayoutEffect, useSectionReveal } from "@/lib/motion/gsap";
import { useMotion } from "@/components/providers/MotionProvider";
import { bezier, duration } from "@/lib/motion/tokens";
import { gsap, ScrollTrigger } from "@/components/providers/MotionProvider";
import { gsapEase } from "@/lib/motion/tokens";

/**
 * Scene 05 — the editorial rail.
 *
 * On desktop the rail is pinned and driven by scroll (GSAP ScrollTrigger, the
 * only thing allowed to own scroll position). On phones and for reduced-motion
 * visitors it degrades to a native horizontal scroll-snap rail.
 */
export function FavouritesSection() {
  const items = getFeaturedItems(6);
  const rootRef = useSectionReveal<HTMLElement>();
  const headlineRef = useHeadlineReveal<HTMLDivElement>();
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const { addItem } = useCart();
  const { ready, reducedMotion, isDesktopPointer } = useMotion();

  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    if (!track || !pin || !ready || reducedMotion) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const context = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - pin.clientWidth + 48);

      gsap.to(track, {
        x: () => -distance(),
        ease: gsapEase.linear,
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => `+=${distance() + window.innerHeight * 0.6}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    }, pin);

    ScrollTrigger.refresh();
    return () => context.revert();
  }, [ready, reducedMotion, isDesktopPointer]);

  const quickAdd = (item: MenuItem) => {
    if (!item.availability.available) return;
    addItem(item, defaultSelection(item), 1);
  };

  return (
    <section
      id="favourites"
      ref={rootRef}
      className="relative border-t border-ivory/8 bg-ember py-20 sm:py-24"
      aria-labelledby="favourites-heading"
    >
      <div className="shell flex flex-col gap-10">
        <div ref={headlineRef} className="flex flex-col gap-5">
          <MicroLabel tone="amber">{favouritesCopy.micro}</MicroLabel>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2
              id="favourites-heading"
              data-split="true"
              className="text-[length:var(--text-display-sm)] leading-[0.98] text-ivory"
            >
              {favouritesCopy.headline}
            </h2>
            <p data-reveal className="max-w-md text-[0.95rem] leading-relaxed text-ash">
              {favouritesCopy.support}
            </p>
          </div>
        </div>
      </div>

      <div ref={pinRef} className="relative mt-12 overflow-hidden lg:pt-6">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-[clamp(1rem,4.5vw,4.5rem)] pb-6 no-scrollbar lg:snap-none lg:overflow-visible"
          data-testid="favourites-rail"
        >
          {items.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: duration.smooth, ease: bezier.cinematic, delay: Math.min(index * 0.05, 0.25) }}
              className="group relative flex w-[78vw] shrink-0 snap-start flex-col overflow-hidden rounded-sm border border-ivory/10 bg-char/70 sm:w-[52vw] lg:w-[27rem]"
            >
              <button
                type="button"
                onClick={() => setActiveItem(item)}
                className="relative block aspect-[4/5] w-full overflow-hidden"
                aria-label={`Open ${item.name}`}
              >
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 52vw, 27rem"
                  quality={80}
                  className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                  style={{ backgroundColor: item.image.tone }}
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
                <span className="absolute left-3 top-3 flex gap-2">
                  <SampleBadge />
                </span>
                <span className="absolute inset-x-4 bottom-4 flex flex-col gap-2 text-left">
                  <span className="text-[1.25rem] leading-tight text-ivory" style={{ fontFamily: "var(--font-display)" }}>
                    {item.name}
                  </span>
                  <span className="micro text-amber">{formatPrice(item.pricePaise)}</span>
                </span>
              </button>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <DietaryRow marks={item.dietary} />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveItem(item)}
                    className="micro h-11 rounded-full border border-ivory/18 px-4 text-ivory/80 transition-colors hover:border-amber/60 hover:text-amber"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => quickAdd(item)}
                    disabled={!item.availability.available}
                    className="micro h-11 rounded-full border border-amber/55 px-4 text-amber transition-colors hover:bg-amber/10 disabled:opacity-40"
                    data-testid="favourite-add"
                  >
                    Add +
                  </button>
                </div>
              </div>
            </motion.article>
          ))}

          <div className="flex w-[78vw] shrink-0 snap-start flex-col justify-between gap-6 rounded-sm border border-ivory/10 bg-char/40 p-6 sm:w-[52vw] lg:w-[24rem]">
            <MicroLabel tone="amber">The full menu</MicroLabel>
            <p className="text-[1rem] leading-relaxed text-ivory/85">
              These six are a sample edit. The complete menu — with categories, search and options — lives one
              section up.
            </p>
            <a
              href="#menu"
              className="micro inline-flex h-11 w-fit items-center gap-2 rounded-full border border-ivory/25 px-5 text-ivory transition-colors hover:border-amber/60 hover:text-amber"
            >
              Back to the menu <span aria-hidden="true">↑</span>
            </a>
          </div>
        </div>
      </div>

      <ItemDialog
        key={activeItem?.id ?? "fav"}
        item={activeItem}
        open={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
      />
    </section>
  );
}
