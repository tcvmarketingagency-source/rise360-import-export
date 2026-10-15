"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { MicroLabel } from "@/components/ui/Bits";
import { useCart } from "@/components/cart/CartProvider";
import { orderCopy } from "@/lib/content/site";
import { formatPrice, pluralise } from "@/lib/format";
import { orderMode, orderModeMeta } from "@/lib/config/order";
import { bezier, gsapEase, revealDistance, stagger } from "@/lib/motion/tokens";
import { useIsomorphicLayoutEffect, useSectionEntrance, gsap } from "@/lib/motion/gsap";
import { useMotion } from "@/components/providers/MotionProvider";

/**
 * Scene 05 — the hand-off from brand film to product.
 * A deliberately light, practical section: the story has been told, now the
 * visitor needs to see how ordering behaves before they commit to it.
 */
export function OrderProcessSection() {
  const rootRef = useSectionEntrance<HTMLElement>({ start: "top 84%" });
  const stepsRef = useRef<HTMLDivElement>(null);
  const { lines, count, totals, openCart } = useCart();
  const { scrollToId } = useMotion();
  const { ready: motionReady, reducedMotion } = useMotion();

  /**
   * The order journey: a connector draws through the steps, each step's number,
   * title and body arrive in sequence, and the live summary panel settles in
   * *after* the steps have started — never before, and never long enough to
   * delay a working checkout button.
   */
  useIsomorphicLayoutEffect(() => {
    const root = stepsRef.current;
    if (!root || !motionReady || reducedMotion) return;

    const context = gsap.context(() => {
      const connector = root.querySelector<HTMLElement>("[data-order-connector]");
      const rows = gsap.utils.toArray<HTMLElement>("[data-order-step]", root);
      const panel = gsap.utils.toArray<HTMLElement>("[data-order-panel]", root);
      const bodies = gsap.utils.toArray<HTMLElement>("[data-order-step-body]", root);
      const numbers = gsap.utils.toArray<HTMLElement>("[data-order-step-number]", root);

      gsap.set([numbers, bodies], { opacity: 0, y: 10 });
      if (rows.length > 0) gsap.set(rows, { opacity: 0, y: revealDistance.card });
      if (panel.length > 0) gsap.set(panel, { opacity: 0, y: revealDistance.panel });

      const timeline = gsap.timeline({
        defaults: { ease: gsapEase.cinematic },
        scrollTrigger: { trigger: root, start: "top 82%", once: true },
      });

      if (connector) {
        gsap.set(connector, { scaleX: 0, transformOrigin: "left center" });
        timeline.to(connector, { scaleX: 1, duration: 1.1, ease: gsapEase.inOut }, 0);
      }

      timeline
        .to(numbers, { opacity: 1, y: 0, duration: 0.6, stagger: stagger.section }, 0.15)
        .to(rows, { opacity: 1, y: 0, duration: 0.7, stagger: stagger.section, clearProps: "transform" }, 0.15)
        .to(
          bodies,
          { opacity: 1, y: 0, duration: 0.6, stagger: stagger.section, clearProps: "transform" },
          0.45,
        );

      // The summary settles after the steps, not on top of them.
      if (panel.length > 0) {
        timeline.to(
          panel,
          { opacity: 1, y: 0, duration: 0.8, clearProps: "transform" },
          0.7,
        );
      }
    }, root);

    return () => context.revert();
  }, [motionReady, reducedMotion]);

  return (
    <section
      id="order"
      ref={rootRef}
      className="relative border-y border-ink/10 bg-ivory py-20 text-ink sm:py-28"
      aria-labelledby="order-heading"
    >
      <div className="shell flex flex-col gap-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
          <div className="flex flex-col gap-5">
            <MicroLabel tone="amber" data-beat="eyebrow">
              {orderCopy.micro}
            </MicroLabel>
            <h2
              id="order-heading"
              data-beat="headline"
              className="whitespace-pre-line text-[length:var(--text-display-sm)] leading-[0.98] text-ink"
            >
              {orderCopy.headline}
            </h2>
          </div>
          <p data-beat="support" className="max-w-lg text-[0.95rem] leading-relaxed text-ink/70">
            {orderCopy.support}
          </p>
        </div>

        {/* Connector: the rule that ties the steps together, drawn on entry. */}
        <span aria-hidden="true" className="relative block h-px w-full bg-ink/12">
          <span
            data-line-draw
            className="absolute inset-0 block origin-left bg-amber-deep/50"
          />
        </span>

        <div ref={stepsRef} className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
          <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {orderCopy.steps.map((step) => (
              <li key={step.index} data-order-step className="flex flex-col gap-3">
                <span
                  data-order-step-number
                  className="text-[2.6rem] leading-none text-amber-deep/80"
                  style={{ fontFamily: "var(--font-display)" }}
                  aria-hidden="true"
                >
                  {step.index}
                </span>
                <h3 className="text-[1.2rem] leading-snug text-ink">{step.title}</h3>
                <p data-order-step-body className="text-[0.9rem] leading-relaxed text-ink/65">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          {/* Live order summary — the practical proof that this is a product */}
          <aside
            data-order-panel
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
