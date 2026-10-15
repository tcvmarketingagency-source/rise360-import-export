import { RevealSection } from "@/components/motion/RevealSection";
import { MicroLabel } from "@/components/ui/Bits";
import { beyondCopy } from "@/lib/content/site";
import { verified } from "@/lib/config/business";

/**
 * Scene 07 — Maitri's wider identity.
 * Deliberately quiet: rooms, dining and functions are present but never
 * compete with the food-delivery conversion goal.
 *
 * The copy, links and ordering priority are unchanged. Only the motion scope is
 * a client component (see `RevealSection`), so this section keeps its place in
 * the server render while gaining the same entrance language as the rest of the
 * page: micro → heading → support → staggered cards → link underline draws.
 */
export function BeyondSection() {
  return (
    <RevealSection
      id="visit"
      drawLines
      className="relative border-t border-ivory/8 bg-soot py-20 sm:py-24"
      aria-labelledby="beyond-heading"
    >
      <div className="shell flex flex-col gap-10">
        <div className="flex flex-col gap-5">
          <MicroLabel tone="amber" data-beat="eyebrow">
            {beyondCopy.micro}
          </MicroLabel>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2
              id="beyond-heading"
              data-beat="headline"
              className="text-[length:var(--text-display-sm)] leading-[0.98] text-ivory"
            >
              {beyondCopy.headline}
            </h2>
            <p data-beat="support" className="max-w-lg text-[0.95rem] leading-relaxed text-ash">
              {beyondCopy.support}
            </p>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-3">
          {beyondCopy.cards.map((card) => (
            <li
              key={card.id}
              data-entrance-extra
              className="surface-card group flex flex-col gap-4 rounded-sm p-6 transition-colors duration-500 hover:border-amber/30"
            >
              <span data-entrance-nested className="block">
                <MicroLabel tone="ivory">{card.title}</MicroLabel>
              </span>
              <p data-entrance-nested className="text-[0.92rem] leading-relaxed text-ash">
                {card.body}
              </p>
              <a
                href={verified.links.legacyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="micro relative mt-auto inline-flex w-fit items-center gap-2 text-amber/90 transition-colors hover:text-amber"
              >
                {card.action} <span aria-hidden="true">↗</span>
                {/* Underline draws on hover — CSS owns hover, as it should. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-1 block h-px origin-left scale-x-0 bg-amber/70 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                />
              </a>
            </li>
          ))}
        </ul>

        <p data-beat="last" className="text-[0.78rem] text-ash/70">
          {beyondCopy.note}
        </p>
      </div>
    </RevealSection>
  );
}
