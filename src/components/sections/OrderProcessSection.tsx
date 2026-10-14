"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button, ButtonLink } from "@/components/ui/Button";
import { MicroLabel, RuleLine } from "@/components/ui/Bits";
import { useCart } from "@/components/cart/CartProvider";
import { orderCopy } from "@/lib/content/site";
import { formatPrice, pluralise } from "@/lib/format";
import { orderMode, orderModeMeta } from "@/lib/config/order";
import { bezier } from "@/lib/motion/tokens";
import { useHeadlineReveal, useSectionReveal } from "@/lib/motion/gsap";
import { useMotion } from "@/components/providers/MotionProvider";

/**
 * Scene 05 — the hand-off from brand film to product.
 * A deliberately light, practical section: the story has been told, now the
 * visitor needs to see how ordering behaves before they commit to it.
 */
export function OrderProcessSection() {
  const rootRef = useSectionReveal<HTMLElement>();
  const headlineRef = useHeadlineReveal<HTMLDivElement>({ start: "top 84%" });
  const { lines, count, totals, openCart } = useCart();
  const { scrollToId } = useMotion();

  return (
    <section
      id="order"
      ref={rootRef}
      className="relative border-y border-ink/10 bg-ivory py-20 text-ink sm:py-28"
      aria-labelledby="order-heading"
    >
      <div className="shell flex flex-col gap-14">
        <div ref={headlineRef} className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
          <div className="flex flex-col gap-5">
            <MicroLabel tone="amber">{orderCopy.micro}</MicroLabel>
            <h2
              id="order-heading"
              data-split="true"
              className="whitespace-pre-line text-[length:var(--text-display-sm)] leading-[0.98] text-ink"
            >
              {orderCopy.headline}
            </h2>
          </div>
          <p className="max-w-lg text-[0.95rem] leading-relaxed text-ink/70">{orderCopy.support}</p>
        </div>

        <RuleLine className="bg-ink/15" />

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
          <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2" data-reveal-group>
            {orderCopy.steps.map((step) => (
              <li key={step.index} className="flex flex-col gap-3">
                <span
                  className="text-[2.6rem] leading-none text-amber-deep/80"
                  style={{ fontFamily: "var(--font-display)" }}
                  aria-hidden="true"
                >
                  {step.index}
                </span>
                <h3 className="text-[1.2rem] leading-snug text-ink">{step.title}</h3>
                <p className="text-[0.9rem] leading-relaxed text-ink/65">{step.body}</p>
              </li>
            ))}
          </ol>

          {/* Live order summary — the practical proof that this is a product */}
          <aside
            className="flex h-fit flex-col gap-5 rounded-sm border border-ink/12 bg-bone/60 p-5 sm:p-6"
            aria-label="Current order summary"
            data-testid="order-summary-panel"
          >
            <div className="flex items-center justify-between gap-4">
              <MicroLabel tone="amber">Your order</MicroLabel>
              <motion.span
                key={count}
                initial={{ scale: 0.85, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: bezier.snap }}
                className="micro rounded-full border border-ink/20 px-2.5 py-1 text-ink/80"
                data-testid="order-summary-count"
              >
                {count} {pluralise(count, "item")}
              </motion.span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {lines.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: bezier.soft }}
                  className="flex flex-col gap-3"
                >
                  <p className="text-[0.95rem] text-ink/80">Nothing in your order yet.</p>
                  <p className="text-[0.86rem] leading-relaxed text-ink/60">
                    Add a dish from the menu above and it appears here instantly — with its choices, quantities
                    and running subtotal.
                  </p>
                </motion.div>
              ) : (
                <motion.ul
                  key="lines"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: bezier.soft }}
                  className="flex flex-col divide-y divide-ink/10"
                  data-testid="order-summary-lines"
                >
                  {lines.map((line) => (
                    <li key={line.key} className="flex items-baseline justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate text-[0.9rem] text-ink">
                          {line.quantity} × {line.name}
                        </span>
                        {line.selections.length > 0 ? (
                          <span className="block truncate text-[0.76rem] text-ink/55">
                            {line.selections.map((selection) => selection.choiceLabels.join(", ")).join(" · ")}
                          </span>
                        ) : null}
                      </span>
                      <span className="tnum shrink-0 text-[0.9rem] text-ink/85">
                        {formatPrice(line.lineTotalPaise)}
                      </span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            <div className="flex items-baseline justify-between border-t border-ink/12 pt-4">
              <span className="micro text-ink/60">Subtotal</span>
              <span className="tnum text-[1.35rem] text-ink" data-testid="order-summary-subtotal">
                {formatPrice(totals.subtotalPaise)}
              </span>
            </div>

            <p className="text-[0.78rem] leading-relaxed text-ink/55">
              Delivery charge and taxes appear only once Maitri confirms them. Order mode right now:{" "}
              <strong className="font-medium text-ink/75">{orderModeMeta[orderMode].label}</strong>.
            </p>

            <div className="flex flex-col gap-2">
              {lines.length > 0 ? (
                <>
                  <ButtonLink href="/checkout" size="lg" fullWidth data-testid="order-summary-checkout">
                    Continue to delivery details
                  </ButtonLink>
                  <Button
                    variant="quiet"
                    size="md"
                    fullWidth
                    onClick={openCart}
                    data-testid="order-summary-open-cart"
                  >
                    Open the full order
                  </Button>
                </>
              ) : (
                <>
                  <ButtonLink
                    href="#menu"
                    size="lg"
                    fullWidth
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToId("#menu");
                    }}
                    data-testid="order-summary-browse"
                  >
                    {orderCopy.ctaPrimary}
                  </ButtonLink>
                  <Link
                    href="/handoff"
                    className="micro text-center text-ink/55 underline decoration-ink/20 underline-offset-4 hover:text-ink/80"
                  >
                    What still needs Maitri&apos;s approval
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
