import type { Metadata } from "next";
import Link from "next/link";
import { MicroLabel, PendingChip } from "@/components/ui/Bits";
import { brand, telHref, verified } from "@/lib/config/business";
import { orderMode, orderModeMeta } from "@/lib/config/order";

export const metadata: Metadata = {
  title: "Privacy notice (draft)",
  description:
    "Draft privacy notice for the Maitri Residency concept ordering experience. Awaiting the restaurant's approval.",
  alternates: { canonical: "/policies/privacy" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="bg-ink pb-24 pt-32">
      <div className="shell flex max-w-3xl flex-col gap-10">
        <header className="flex flex-col gap-5">
          <MicroLabel tone="amber">Draft policy</MicroLabel>
          <h1 className="text-[length:var(--text-display-sm)] leading-[0.98] text-ivory">Privacy notice</h1>
          <div className="flex flex-wrap items-center gap-3">
            <PendingChip label="Draft — requires Maitri's approval" />
            <span className="micro text-ash/70">
              Order mode today: {orderModeMeta[orderMode].label}
            </span>
          </div>
        </header>

        <section className="flex flex-col gap-4 text-[0.95rem] leading-relaxed text-ash">
          <h2 className="text-[1.25rem] text-ivory">What this concept build does</h2>
          <p>
            In its current configuration this website does not transmit orders and does not store customer
            details on a server. Your cart is kept in your own browser&apos;s local storage so it survives a page
            reload, and the checkout summary is assembled in your browser for you to review.
          </p>
          <p>
            If you clear your browser data, or use a different device, the order disappears. Nothing is sent to{" "}
            {brand.name} until an order mode with transmission is enabled and you explicitly continue.
          </p>

          <h2 className="pt-4 text-[1.25rem] text-ivory">What would be collected in live ordering</h2>
          <ul className="flex flex-col gap-2">
            <li>• Name for the order</li>
            <li>• Mobile number, so the restaurant can confirm and the rider can call</li>
            <li>• Delivery address and locality</li>
            <li>• Any delivery instructions you choose to add</li>
            <li>• The items, options and quantities in your order, and its total</li>
          </ul>
          <p>
            That information is used only to prepare, confirm and deliver your order, and to keep the records a
            restaurant is required to keep. No advertising profiles, no selling of data, and no collection of
            anything the order does not need.
          </p>

          <h2 className="pt-4 text-[1.25rem] text-ivory">Who can see it</h2>
          <p>
            Staff accounts at {brand.name} can see orders and their delivery details. Staff access is role-based
            and enforced on the server and at the database level. Payment credentials — if online payment is ever
            enabled — stay on the server and are never exposed to the browser.
          </p>

          <h2 className="pt-4 text-[1.25rem] text-ivory">Retention, correction and deletion</h2>
          <p>
            Retention periods, the exact correction process and the deletion route are yet to be agreed with{" "}
            {brand.name}. Until then, requests can be made on the delivery line,{" "}
            <a href={telHref} className="text-amber hover:underline">
              {verified.deliveryPhone.display}
            </a>
            .
          </p>

          <h2 className="pt-4 text-[1.25rem] text-ivory">Analytics and cookies</h2>
          <p>
            This concept build sets no advertising cookies and runs no third-party analytics. If analytics are
            added after launch, this notice must be updated — and the restaurant must approve what is measured.
          </p>
        </section>

        <div className="flex flex-wrap gap-4 border-t border-ivory/10 pt-6">
          <Link href="/policies/order-delivery" className="micro text-amber hover:underline">
            Order & delivery policy →
          </Link>
          <Link href="/handoff" className="micro text-ash hover:text-ivory">
            Handoff checklist →
          </Link>
        </div>
      </div>
    </div>
  );
}
