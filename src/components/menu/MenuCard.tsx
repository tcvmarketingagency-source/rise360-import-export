"use client";

import Image from "next/image";
import { AvailabilityPill, DietaryRow, SampleBadge, SpiceMeter } from "@/components/ui/Bits";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/menu/types";

interface MenuCardProps {
  item: MenuItem;
  onOpen: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  priority?: boolean;
  index?: number;
}

/**
 * A menu card.
 *
 * Deliberately *not* a Framer Motion component any more. Framer renders its
 * `initial` state into the server HTML, so every card shipped as
 * `style="opacity:0;transform:translateY(28px)"` — a visitor without JavaScript
 * (or with a failed hydration) saw an empty menu. Card entry is now owned by
 * GSAP, which sets its initial state client-side in the same tick it registers
 * the trigger, so the markup is never hidden. Framer still owns the *filter
 * swap* of the surrounding list item, and CSS owns hover.
 */
export function MenuCard({ item, onOpen, onQuickAdd, priority, index = 0 }: MenuCardProps) {
  const requiresChoices = item.optionGroups.some((group) => group.required);
  const unavailable = !item.availability.available;

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-sm border border-ivory/10 bg-char/60 transition-colors duration-500 hover:border-amber/35 focus-within:border-amber/40"
      data-testid="menu-card"
      data-item-slug={item.slug}
      data-menu-card={index}
    >
      {/* Curtain wrapper: GSAP reveals this frame, then the body follows. */}
      <div data-card-image className="relative overflow-hidden">
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="relative block aspect-[4/3] w-full overflow-hidden text-left"
          aria-label={`Open details for ${item.name}`}
          data-testid="menu-card-open"
        >
          <Image
            src={item.image.src}
            alt={item.image.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={78}
            priority={priority}
            className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
            style={{ backgroundColor: item.image.tone }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent"
          />
          <span className="absolute left-3 top-3 flex items-center gap-2">
            <SampleBadge />
          </span>
          {unavailable ? (
            <span className="absolute inset-0 flex items-center justify-center bg-ink/72">
              <span className="micro rounded-full border border-chili/50 bg-ink/70 px-3 py-1.5 text-chili">
                Unavailable today
              </span>
            </span>
          ) : null}
        </button>
      </div>

      <div data-card-body className="flex flex-1 flex-col gap-3 p-4">
        <div data-card-line className="flex items-start justify-between gap-3">
          <h3 className="text-[1.06rem] leading-snug text-ivory">
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="text-left transition-colors hover:text-amber"
            >
              {item.name}
            </button>
          </h3>
          <p className="tnum shrink-0 text-[1.02rem] text-amber">{formatPrice(item.pricePaise)}</p>
        </div>

        <p data-card-line className="text-[0.86rem] leading-relaxed text-ash">
          {item.summary}
        </p>

        <div className="mt-auto flex flex-col gap-3 pt-2">
          <div data-card-line className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <DietaryRow marks={item.dietary} />
            <SpiceMeter level={item.spice} />
          </div>

          <div
            data-card-line
            className="flex items-center justify-between gap-3 border-t border-ivory/8 pt-3"
          >
            <AvailabilityPill available={item.availability.available} reason={item.availability.reason} />
            {unavailable ? (
              <span className="micro text-ash/60">Not orderable</span>
            ) : requiresChoices ? (
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="micro flex h-11 items-center gap-2 rounded-full border border-amber/50 px-4 text-amber transition-[background-color,border-color,transform] duration-300 hover:border-amber hover:bg-amber/10 active:scale-[0.97]"
                data-testid="menu-card-customise"
              >
                Choose options
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onQuickAdd(item)}
                className="micro flex h-11 items-center gap-2 rounded-full border border-amber/50 px-4 text-amber transition-[background-color,border-color,transform] duration-300 hover:border-amber hover:bg-amber/10 active:scale-[0.97]"
                data-testid="menu-card-add"
              >
                Add
                <span aria-hidden="true">+</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
