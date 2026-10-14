import { MicroLabel } from "@/components/ui/Bits";
import { beyondCopy } from "@/lib/content/site";
import { verified } from "@/lib/config/business";

/**
 * Scene 07 — Maitri's wider identity.
 * Deliberately quiet: rooms, dining and functions are present but never
 * compete with the food-delivery conversion goal.
 */
export function BeyondSection() {
  return (
    <section
      id="visit"
      className="relative border-t border-ivory/8 bg-soot py-20 sm:py-24"
      aria-labelledby="beyond-heading"
    >
      <div className="shell flex flex-col gap-10">
        <div className="flex flex-col gap-5">
          <MicroLabel tone="amber">{beyondCopy.micro}</MicroLabel>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2
              id="beyond-heading"
              className="text-[length:var(--text-display-sm)] leading-[0.98] text-ivory"
            >
              {beyondCopy.headline}
            </h2>
            <p className="max-w-lg text-[0.95rem] leading-relaxed text-ash">{beyondCopy.support}</p>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-3">
          {beyondCopy.cards.map((card) => (
            <li
              key={card.id}
              className="surface-card flex flex-col gap-4 rounded-sm p-6 transition-colors duration-500 hover:border-amber/30"
            >
              <MicroLabel tone="ivory">{card.title}</MicroLabel>
              <p className="text-[0.92rem] leading-relaxed text-ash">{card.body}</p>
              <a
                href={verified.links.legacyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="micro mt-auto inline-flex items-center gap-2 text-amber/90 transition-colors hover:text-amber"
              >
                {card.action} <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>

        <p className="text-[0.78rem] text-ash/70">{beyondCopy.note}</p>
      </div>
    </section>
  );
}
