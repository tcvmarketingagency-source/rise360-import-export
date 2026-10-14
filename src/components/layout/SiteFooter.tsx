import Link from "next/link";
import { footerCopy } from "@/lib/content/site";
import { brand, externalLinks, legacyContactConflicts, telHref, verified } from "@/lib/config/business";
import { orderModeMeta } from "@/lib/config/order";
import { MicroLabel } from "@/components/ui/Bits";

const columnHrefs: Record<string, { label: string; href: string; external?: boolean }[]> = {
  experience: [
    { label: "The Story", href: "/#story" },
    { label: "Menu", href: "/#menu" },
    { label: "How Ordering Works", href: "/#order" },
    { label: "Delivery", href: "/#delivery" },
  ],
  visit: [
    { label: "Address & Contact", href: "/contact" },
    { label: "Stays & Functions", href: verified.links.legacyWebsite, external: true },
    { label: "Instagram", href: verified.links.instagram, external: true },
  ],
  legal: [
    { label: "Handoff & Disclaimers", href: "/handoff" },
    { label: "Privacy (draft)", href: "/policies/privacy" },
    { label: "Order & Delivery Policy (draft)", href: "/policies/order-delivery" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="relative border-t border-ivory/10 bg-char pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-16 lg:pb-16">
      <div className="shell flex flex-col gap-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-5">
            <p
              className="text-[1.6rem] leading-tight text-ivory"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {brand.name}
            </p>
            <address className="not-italic text-[0.92rem] leading-relaxed text-ash">
              {verified.address.line1}
              <br />
              {verified.address.line2}
              <br />
              {verified.address.city} – {verified.address.postalCode}, {verified.address.region}
            </address>
            <div className="flex flex-col gap-2">
              <MicroLabel tone="amber">Food delivery line</MicroLabel>
              <a href={telHref} className="text-lg text-ivory underline decoration-amber/40 underline-offset-4 hover:text-amber">
                {verified.deliveryPhone.display}
              </a>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              {externalLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="micro rounded-full border border-ivory/18 px-3 py-2 text-ivory/80 transition-colors hover:border-amber/60 hover:text-amber"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {footerCopy.columns.map((column) => (
              <nav key={column.id} aria-label={column.title} className="flex flex-col gap-4">
                <MicroLabel tone="ivory">{column.title}</MicroLabel>
                <ul className="flex flex-col gap-2.5">
                  {(columnHrefs[column.id] ?? []).map((link) =>
                    link.external ? (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[0.9rem] text-ivory/75 transition-colors hover:text-amber"
                        >
                          {link.label}
                        </a>
                      </li>
                    ) : (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-[0.9rem] text-ivory/75 transition-colors hover:text-amber"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-ivory/10 pt-8">
          <div className="flex flex-col gap-3">
            <MicroLabel tone="amber">Status</MicroLabel>
            <p className="max-w-3xl text-[0.86rem] leading-relaxed text-ash">
              Order mode: <span className="text-ivory/85">{orderModeMeta.preview.label}</span>.{" "}
              {orderModeMeta.preview.summary}
            </p>
          </div>

          <details className="group max-w-3xl rounded-sm border border-ivory/12 bg-ink/40 px-4 py-3">
            <summary className="micro cursor-pointer list-none text-turmeric marker:content-none">
              Details Maitri must confirm before launch ({legacyContactConflicts.length})
            </summary>
            <ul className="mt-4 flex flex-col gap-3">
              {legacyContactConflicts.map((conflict) => (
                <li key={conflict.id} className="text-[0.84rem] leading-relaxed text-ash">
                  <span className="text-ivory/85">{conflict.label}.</span> {conflict.detail}
                </li>
              ))}
            </ul>
            <Link href="/handoff" className="micro mt-4 inline-block text-amber hover:underline">
              Full handoff list →
            </Link>
          </details>

          <p className="max-w-3xl text-[0.78rem] leading-relaxed text-ash/70">{footerCopy.disclaimer}</p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="micro text-ash/60">
              © {new Date().getFullYear()} Concept build · prepared for {brand.name}
            </p>
            <p className="micro text-ash/60">From Maitri&apos;s kitchen to your doorstep</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
