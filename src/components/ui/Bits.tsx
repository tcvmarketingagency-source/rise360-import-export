import type { DietaryKind, DietaryMark, SpiceLevel } from "@/lib/menu/types";
import { contentFlags } from "@/lib/config/order";
import { isPreview } from "@/lib/config/order";

/* ── Micro labels ─────────────────────────────────────────────────────────── */

export function MicroLabel({
  children,
  className = "",
  tone = "ash",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "ash" | "amber" | "ivory" | "chili";
}) {
  const tones = {
    ash: "text-ash",
    amber: "text-amber",
    ivory: "text-ivory/70",
    chili: "text-chili",
  } as const;
  return (
    <span className={`micro ${tones[tone]} ${className}`.trim()}>{children}</span>
  );
}

export function RuleLine({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-px w-full bg-ivory/12 ${className}`.trim()}
    />
  );
}

/** Sample-content badge — shown wherever authored placeholder data appears. */
export function SampleBadge({ className = "", note }: { className?: string; note?: string }) {
  if (!isPreview || !contentFlags.markSampleContent) return null;
  return (
    <span
      className={`micro inline-flex items-center gap-1 rounded-full border border-turmeric/40 bg-turmeric/10 px-2 py-[3px] text-turmeric ${className}`.trim()}
      title={note ?? contentFlags.sampleNote}
    >
      {contentFlags.sampleLabel}
      <span className="sr-only">
        — authored placeholder content, to be replaced with Maitri&apos;s approved menu.
      </span>
    </span>
  );
}

/* ── Dietary marks ────────────────────────────────────────────────────────── */

const dietaryGlyph: Record<DietaryKind, { symbol: string; label: string; ring: string; fill: string }> = {
  veg: { symbol: "●", label: "Vegetarian", ring: "border-herb", fill: "bg-herb" },
  "non-veg": { symbol: "▲", label: "Non-vegetarian", ring: "border-chili", fill: "bg-chili" },
  egg: { symbol: "◆", label: "Contains egg", ring: "border-amber", fill: "bg-amber" },
  vegan: { symbol: "◎", label: "Vegan", ring: "border-herb", fill: "bg-herb" },
  jain: { symbol: "◇", label: "Jain", ring: "border-turmeric", fill: "bg-turmeric" },
};

export function DietaryMarkIcon({ mark }: { mark: DietaryMark }) {
  const meta = dietaryGlyph[mark.kind];
  const unverified = !mark.verified && isPreview;

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={
        mark.verified
          ? `${meta.label} — confirmed by the restaurant`
          : `${meta.label} — classification to be confirmed by the restaurant`
      }
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border ${meta.ring}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta.fill}`} />
      </span>
      <span className="sr-only">
        {meta.label}
        {unverified ? " (classification to be confirmed)" : ""}
      </span>
      {unverified ? (
        <span className="micro text-ash/70">to confirm</span>
      ) : null}
    </span>
  );
}

export function DietaryRow({ marks }: { marks: DietaryMark[] }) {
  if (marks.length === 0) return null;
  return (
    <span className="flex items-center gap-3">
      {marks.map((mark) => (
        <DietaryMarkIcon key={mark.kind} mark={mark} />
      ))}
    </span>
  );
}

const spiceLabel: Record<SpiceLevel, string> = {
  mild: "Mild",
  medium: "Medium heat",
  hot: "Hot",
};

export function SpiceMeter({ level }: { level?: SpiceLevel }) {
  if (!level) return null;
  const filled = level === "mild" ? 1 : level === "medium" ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-1.5" title={`Spice level: ${spiceLabel[level]}`}>
      <span className="flex items-center gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`h-[3px] w-2 rounded-full ${index < filled ? "bg-chili/80" : "bg-ivory/15"}`}
          />
        ))}
      </span>
      <span className="micro text-ash/80">{spiceLabel[level]}</span>
    </span>
  );
}

export function AvailabilityPill({ available, reason }: { available: boolean; reason?: string }) {
  if (available) {
    return (
      <span className="micro inline-flex items-center gap-1.5 text-herb">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-herb" />
        Available
      </span>
    );
  }
  return (
    <span className="micro inline-flex items-center gap-1.5 text-chili" title={reason}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-chili" />
      Unavailable today
    </span>
  );
}

/** Pending-confirmation chip used across delivery / business-fact panels. */
export function PendingChip({ label = "Awaiting confirmation" }: { label?: string }) {
  return (
    <span className="micro inline-flex items-center gap-1.5 rounded-full border border-clay/40 bg-clay/10 px-2.5 py-1 text-clay">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-clay" />
      {label}
    </span>
  );
}

export function ConfirmedChip({ label = "Confirmed detail" }: { label?: string }) {
  return (
    <span className="micro inline-flex items-center gap-1.5 rounded-full border border-herb/50 bg-herb/10 px-2.5 py-1 text-herb">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-herb" />
      {label}
    </span>
  );
}

/* ── Section furniture ────────────────────────────────────────────────────── */

export function SectionHeading({
  micro,
  headline,
  support,
  align = "left",
  tone = "ivory",
  split = true,
}: {
  micro: string;
  headline: string;
  support?: string;
  align?: "left" | "center";
  tone?: "ivory" | "ink";
  split?: boolean;
}) {
  return (
    <div
      className={`flex max-w-3xl flex-col gap-5 ${align === "center" ? "mx-auto items-center text-center" : ""}`}
    >
      <MicroLabel tone={tone === "ink" ? "amber" : "amber"}>{micro}</MicroLabel>
      <h2
        {...(split ? { "data-split": "true" } : {})}
        className={`text-[length:var(--text-display-sm)] leading-[0.98] ${
          tone === "ink" ? "text-ink" : "text-ivory"
        } ${split ? "" : "whitespace-pre-line"}`}
      >
        {headline}
      </h2>
      {support ? (
        <p
          className={`max-w-2xl text-[0.95rem] leading-relaxed sm:text-base ${
            tone === "ink" ? "text-ink/70" : "text-ash"
          }`}
        >
          {support}
        </p>
      ) : null}
    </div>
  );
}
