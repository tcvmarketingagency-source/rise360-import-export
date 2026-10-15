import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { ConfirmedChip, MicroLabel, PendingChip } from "@/components/ui/Bits";
import { brand, telHref, verified } from "@/lib/config/business";
import { deliveryNotes } from "@/lib/config/order";

export const metadata: Metadata = {
  title: "Contact & location",
  description:
    "Address, delivery order line and location details for Maitri Residency / Hotel Maitri, Mukaram Pura, Karimnagar.",
  alternates: { canonical: "/contact" },
};

const mapsQuery = encodeURIComponent(
  `${brand.hospitalityName}, ${verified.address.line1}, ${verified.address.line2}, ${verified.address.city}, ${verified.address.region} ${verified.address.postalCode}`,
);

export default function ContactPage() {
  return (
    <div className="bg-ink pb-24 pt-32">
      <div className="shell flex flex-col gap-12">
        <header className="flex flex-col gap-5">
          <MicroLabel tone="amber">Contact</MicroLabel>
          <h1 className="max-w-[22ch] text-[length:var(--text-display-sm)] leading-[0.98] text-ivory">
            Where the kitchen is, and how to reach it.
          </h1>
        </header>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <section className="flex flex-col gap-6">
            <h2 className="text-[1.35rem] text-ivory">Address</h2>
            <div className="flex flex-col gap-4 rounded-sm border border-ivory/12 bg-char/40 p-5">
              <span className="flex">
                <ConfirmedChip label="Published address" />
              </span>
              <address className="not-italic text-[1rem] leading-relaxed text-ivory/85">
                {brand.hospitalityName}
                <br />
                {verified.address.line1}
                <br />
                {verified.address.line2}
                <br />
                {verified.address.city} – {verified.address.postalCode}
                <br />
                {verified.address.region}, {verified.address.country}
              </address>
              <ButtonLink
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                external
                variant="secondary"
                size="md"
              >
                Open in Google Maps ↗
              </ButtonLink>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-[1.35rem] text-ivory">Food delivery orders</h2>
            <div className="flex flex-col gap-4 rounded-sm border border-ivory/12 bg-char/40 p-5">
              <span className="flex">
                <ConfirmedChip label="Publicly posted order line" />
              </span>
              <a
                href={telHref}
                className="text-[1.6rem] text-ivory underline decoration-amber/40 underline-offset-4 hover:text-amber"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {verified.deliveryPhone.display}
              </a>
              <p className="text-[0.88rem] leading-relaxed text-ash">
                This is the number Hotel Maitri posted publicly for food-delivery orders. In this concept build,
                the website prepares your order summary and hands it to this line — the restaurant confirms every
                order.
              </p>
              <ButtonLink href={telHref} external size="lg">
                Call the delivery line
              </ButtonLink>
            </div>

            <div className="flex flex-col gap-4 rounded-sm border border-ivory/12 bg-char/40 p-5">
              <span className="flex">
                <PendingChip label="Awaiting confirmation" />
              </span>
              <dl className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <dt className="micro text-ash/80">Kitchen & delivery hours</dt>
                  <dd className="text-[0.92rem] text-ivory/85">{deliveryNotes.hoursNote}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="micro text-ash/80">Delivery areas and charges</dt>
                  <dd className="text-[0.92rem] text-ivory/85">{deliveryNotes.chargesNote}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="micro text-ash/80">Dine-in, stays and functions</dt>
                  <dd className="text-[0.92rem] text-ivory/85">
                    Enquiries run through the hotel&apos;s existing website so they never compete with food
                    orders:{" "}
                    <a
                      href={verified.links.legacyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber hover:underline"
                    >
                      maitriresidency.com ↗
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-3 rounded-sm border border-ivory/12 bg-char/40 p-5">
              <MicroLabel tone="ivory">Official social</MicroLabel>
              <a
                href={verified.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.95rem] text-ivory/85 hover:text-amber"
              >
                Instagram · {verified.instagramHandle} ↗
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
