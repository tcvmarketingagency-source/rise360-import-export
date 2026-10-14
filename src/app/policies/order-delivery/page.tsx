import type { Metadata } from "next";
import Link from "next/link";
import { MicroLabel, PendingChip } from "@/components/ui/Bits";
import { brand, telHref, verified } from "@/lib/config/business";
import { orderMode, orderModeMeta } from "@/lib/config/order";

export const metadata: Metadata = {
  title: "Order & delivery policy (draft)",
  description:
    "Draft order, delivery and refund policy for the Maitri Residency concept ordering experience. Awaiting the restaurant's approval.",
  alternates: { canonical: "/policies/order-delivery" },
  robots: { index: false, follow: true },
};

const pending = [
  {
    title: "Minimum order value",
    body: "Not set. The cart currently shows no minimum, because inventing one would misrepresent the restaurant.",
  },
  {
    title: "Delivery charges",
    body: "Not set. The cart shows “to be confirmed” rather than ₹0 or a guessed fee.",
  },
  {
    title: "Free-delivery threshold",
    body: "Not set. No promotional threshold will be displayed until Maitri approves one.",
  },
  {
    title: "Delivery windows and last order time",
    body: "Not set. No ETA, cut-off or “open now” indicator is shown.",
  },
  {
    title: "Cancellation and refund policy",
    body: "To be drafted by the restaurant, including what happens if an item runs out or the rider cannot reach the address.",
  },
  {
    title: "Taxes and invoicing",
    body: "Not confirmed. No tax line is displayed until the rate and invoice format are agreed.",
  },
];

export default function OrderDeliveryPolicyPage() {
  return (
    <div className="bg-ink pb-24 pt-32">
      <div className="shell flex max-w-3xl flex-col gap-10">
        <header className="flex flex-col gap-5">
          <MicroLabel tone="amber">Draft policy</MicroLabel>
          <h1 className="text-[length:var(--text-display-sm)] leading-[0.98] text-ivory">
            Order &amp; delivery policy
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <PendingChip label="Draft — requires Maitri's approval" />
            <span className="micro text-ash/70">Order mode today: {orderModeMeta[orderMode].label}</span>
          </div>
        </header>

        <section className="flex flex-col gap-4 text-[0.95rem] leading-relaxed text-ash">
          <h2 className="text-[1.25rem] text-ivory">When an order is confirmed</h2>
          <p>
            An order exists only once {brand.name} accepts it. In a WhatsApp or phone mode, opening a chat or
            dialling the number is not an order — it is a request. The restaurant confirms availability, charges
            and timing on that call, and staff may decline an order for reasons such as an address outside the
            delivery area.
          </p>
          <p>
            In the persistent online mode, a submitted order is stored with a reference and starts as{" "}
            <span className="text-ivory/85">Pending</span>. Staff then accept or reject it, and the status moves
            through preparation and delivery. The website never shows an order as accepted on the
            restaurant&apos;s behalf.
          </p>

          <h2 className="pt-4 text-[1.25rem] text-ivory">Prices and what the customer sees</h2>
          <p>
            Item prices come from the restaurant&apos;s approved menu. Where a charge has not been confirmed —
            delivery fee, taxes, minimum order — the page says so instead of displaying a number. Totals shown
            during checkout are indicative until the restaurant confirms them.
          </p>

          <h2 className="pt-4 text-[1.25rem] text-ivory">Payment</h2>
          <p>
            No online payment is offered in this build, and no payment is ever simulated. If online payment is
            enabled later, it will run through an authorised provider with server-side verification, and this
            policy will be updated first.
          </p>

          <h2 className="pt-4 text-[1.25rem] text-ivory">Delivery scope</h2>
          <p>
            Areas served, radius, exclusions and timings are set by the restaurant and are still to be confirmed.
            Until then the delivery section shows a clearly labelled placeholder.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-[1.25rem] text-ivory">Still to be decided</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {pending.map((item) => (
              <li key={item.title} className="surface-card flex flex-col gap-2 rounded-sm p-4">
                <span className="micro text-clay">{item.title}</span>
                <p className="text-[0.86rem] leading-relaxed text-ash">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-4 border-t border-ivory/10 pt-6">
          <a href={telHref} className="micro text-amber hover:underline">
            Delivery line · {verified.deliveryPhone.display}
          </a>
          <Link href="/policies/privacy" className="micro text-ash hover:text-ivory">
            Privacy notice →
          </Link>
          <Link href="/handoff" className="micro text-ash hover:text-ivory">
            Handoff checklist →
          </Link>
        </div>
      </div>
    </div>
  );
}
