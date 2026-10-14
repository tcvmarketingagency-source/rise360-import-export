"use client";

import { MenuExplorer } from "@/components/menu/MenuExplorer";
import { MicroLabel } from "@/components/ui/Bits";
import { menuSectionCopy } from "@/lib/content/site";
import { useHeadlineReveal, useSectionReveal } from "@/lib/motion/gsap";

export function MenuSection() {
  const rootRef = useSectionReveal<HTMLElement>();
  const headlineRef = useHeadlineReveal<HTMLDivElement>();

  return (
    <section
      id="menu"
      ref={rootRef}
      className="relative border-t border-ivory/8 bg-gradient-to-b from-ink via-soot to-char py-20 sm:py-28"
      aria-labelledby="menu-heading"
    >
      <div className="shell flex flex-col gap-10">
        <div ref={headlineRef} className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
          <div className="flex flex-col gap-5">
            <MicroLabel tone="amber">{menuSectionCopy.micro}</MicroLabel>
            <h2
              id="menu-heading"
              data-split="true"
              className="text-[length:var(--text-display-sm)] leading-[0.98] text-ivory"
            >
              {menuSectionCopy.headline}
            </h2>
          </div>
          <p data-reveal className="max-w-lg text-[0.95rem] leading-relaxed text-ash">
            {menuSectionCopy.support}
          </p>
        </div>

        <MenuExplorer />
      </div>
    </section>
  );
}
