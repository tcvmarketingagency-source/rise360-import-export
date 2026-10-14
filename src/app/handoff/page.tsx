import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmedChip, MicroLabel, PendingChip } from "@/components/ui/Bits";
import { ButtonLink } from "@/components/ui/Button";
import { brand, legacyContactConflicts, telHref, verified } from "@/lib/config/business";
import { orderMode, orderModeMeta } from "@/lib/config/order";

export const metadata: Metadata = {
  title: "Handoff & disclaimers",
  description:
    "What Maitri Residency must review and approve before this concept experience becomes the restaurant's live ordering website.",
  robots: { index: false, follow: true },
};

const businessFacts = [
  {
    id: "menu",
    title: "Official menu, categories and portion sizes",
    detail:
      "Replace the sample menu in src/lib/menu/sample-menu.ts (or import rows into menu_items). Names, spellings, category grouping and portion structure all need sign-off.",
    owner: "Restaurant",
  },
  {
    id: "prices",
    title: "Prices for every item and option",
    detail:
      "Prices are stored in paise. Sample values are currently shown; each one must be replaced with the approved price, including portion upgrades and add-ons.",
    owner: "Restaurant",
  },
  {
    id: "dietary",
    title: "Vegetarian / non-vegetarian classification",
    detail:
      "Every dietary mark is currently labelled 'to confirm'. Written confirmation is required before any indicator is shown as verified.",
    owner: "Restaurant",
  },
  {
    id: "availability",
    title: "Availability rules and sold-out messaging",
    detail:
      "Which dishes are always available, which are time-bound, and what customers should be told when something runs out.",
    owner: "Restaurant",
  },
  {
    id: "areas",
    title: "Delivery areas, radius and exclusions",
    detail:
      "Locality list or pincodes served, plus anything explicitly excluded. Feeds the delivery section and the delivery_zones table.",
    owner: "Restaurant",
  },
  {
    id: "charges",
    title: "Delivery charges, minimum order and free-delivery threshold",
    detail:
      "Currently null so the site shows 'to be confirmed'. Once approved, the cart and checkout display them automatically.",
    owner: "Restaurant",
  },
  {
    id: "hours",
    title: "Kitchen hours, delivery windows and last order time",
    detail:
      "Needed before any 'open now' state, cut-off time or delivery ETA can be shown. Also resolves the conflicting hours across public channels.",
    owner: "Restaurant",
  },
  {
    id: "taxes",
    title: "GST / taxes and invoice details",
    detail:
      "Whether taxes apply, at what rate, and what appears on the customer's receipt. No tax line is displayed until this is confirmed.",
    owner: "Restaurant / CA",
  },
  {
    id: "payment",
    title: "Payment methods",
    detail:
      "Cash on delivery, UPI, or online. Online payment requires authorising a Razorpay account; keys stay server-side and payments are never simulated.",
    owner: "Restaurant",
  },
  {
    id: "contact",
    title: "Primary order line and call handling",
    detail:
      "Confirm +91 89850 51111 remains the delivery line, who answers it, and what happens outside service hours. Reconcile any legacy numbers on the existing website.",
    owner: "Restaurant",
  },
  {
    id: "assets",
    title: "Logo, brand fonts and photography",
    detail:
      "The current wordmark is a working placeholder and menu imagery is licensed placeholder photography. Supplying the real logo files and photo library will replace all of it.",
    owner: "Restaurant",
  },
  {
    id: "policies",
    title: "Privacy, order, refund and delivery policies",
    detail:
      "Draft pages exist at /policies/privacy and /policies/order-delivery. They must be reviewed, corrected and approved before launch.",
    owner: "Restaurant",
  },
  {
    id: "orderMode",
    title: "Choose the launch order mode",
    detail:
      "Mode A (WhatsApp/call assisted) is available immediately with the public number. Mode B (persistent online orders + staff dashboard) needs a Supabase project and staff accounts.",
    owner: "Restaurant + build team",
  },
  {
    id: "notifications",
    title: "How staff are notified of new orders",
    detail:
      "Mode B needs an approved notification channel (for example WhatsApp Business API or e-mail) plus a webhook URL and secret in environment variables.",
    owner: "Restaurant + build team",
  },
  {
    id: "domain",
    title: "Production domain and analytics",
    detail:
      "Where the site will live, whether it replaces or sits beside maitriresidency.com, and which analytics (if any) may collect data.",
    owner: "Restaurant",
  },
];

export default function HandoffPage() {
  return (
    <div className="bg-ink pb-24 pt-32">
      <div className="shell flex flex-col gap-14">
        <header className="flex flex-col gap-6">
          <MicroLabel tone="amber">Concept build · handoff</MicroLabel>
          <h1 className="max-w-[24ch] text-[length:var(--text-display-sm)] leading-[0.98] text-ivory">
            What Maitri must approve before this goes live.
          </h1>
          <p className="max-w-3xl text-[0.98rem] leading-relaxed text-ash">
            This is a private concept experience built for {brand.name} / {brand.hospitalityName}. It is{" "}
            <span className="text-ivory/90">not</span> the restaurant&apos;s official website, and nothing here
            should be described as a confirmed service until the items below are signed off.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ConfirmedChip label="Publicly posted details in use" />
            <PendingChip label="Everything else is a placeholder" />
          </div>
        </header>

        <section className="flex flex-col gap-5">
          <h2 className="text-[1.5rem] text-ivory">Verified facts in this build</h2>
          <dl className="flex flex-col divide-y divide-ivory/10 border-y border-ivory/10">
            {[
              { label: "Brand", value: `${brand.name} / ${brand.hospitalityName}` },
              { label: "Address", value: verified.address.full },
              { label: "Delivery order line", value: verified.deliveryPhone.display },
              { label: "Instagram", value: verified.instagramHandle },
              { label: "Existing website", value: verified.links.legacyWebsite },
              { label: "Order mode in this build", value: orderModeMeta[orderMode].label },
            ].map((row) => (
              <div key={row.label} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
                <dt className="micro text-ash/80">{row.label}</dt>
                <dd className="text-[0.95rem] text-ivory/90">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-[1.5rem] text-ivory">Conflicting details to reconcile</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {legacyContactConflicts.map((conflict) => (
              <li key={conflict.id} className="surface-card flex flex-col gap-3 rounded-sm p-5">
                <PendingChip />
                <h3 className="text-[1.05rem] text-ivory">{conflict.label}</h3>
                <p className="text-[0.86rem] leading-relaxed text-ash">{conflict.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-[1.5rem] text-ivory">Approval checklist</h2>
          <ol className="flex flex-col gap-3">
            {businessFacts.map((fact, index) => (
              <li key={fact.id} className="grid gap-3 rounded-sm border border-ivory/12 bg-char/40 p-5 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="micro text-amber">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="text-[1.05rem] text-ivory">{fact.title}</h3>
                  </div>
                  <p className="text-[0.86rem] leading-relaxed text-ash">{fact.detail}</p>
                </div>
                <span className="micro self-start text-ash/70 sm:self-center">{fact.owner}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-5 rounded-sm border border-turmeric/30 bg-turmeric/6 p-6">
          <h2 className="text-[1.35rem] text-ivory">How to switch this build on</h2>
          <ol className="flex flex-col gap-3 text-[0.9rem] leading-relaxed text-ash">
            <li>
              <span className="text-ivory/90">1.</span> Replace the sample menu and prices with{" "}
              <code className="text-amber/90">src/lib/menu/sample-menu.ts</code> content that Maitri has approved.
            </li>
            <li>
              <span className="text-ivory/90">2.</span> Set{" "}
              <code className="text-amber/90">NEXT_PUBLIC_ORDER_MODE=whatsapp</code> for call/WhatsApp ordering to{" "}
              {verified.deliveryPhone.display}.
            </li>
            <li>
              <span className="text-ivory/90">3.</span> For persistent orders, run{" "}
              <code className="text-amber/90">supabase/migrations/0001_init.sql</code>, set the Supabase variables
              and switch to <code className="text-amber/90">NEXT_PUBLIC_ORDER_MODE=online</code>.
            </li>
            <li>
              <span className="text-ivory/90">4.</span> Enable indexing (remove the <code>robots</code> block in{" "}
              <code className="text-amber/90">src/app/layout.tsx</code>) only after the domain is approved.
            </li>
          </ol>
        </section>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/" size="lg">
            Back to the experience
          </ButtonLink>
          <ButtonLink href={telHref} external variant="secondary" size="lg">
            Call {verified.deliveryPhone.display}
          </ButtonLink>
          <Link href="/policies/privacy" className="micro self-center text-ash hover:text-ivory">
            Privacy notice →
          </Link>
        </div>
      </div>
    </div>
  );
}
