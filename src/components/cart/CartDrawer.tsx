"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Overlay, OverlayHeader } from "@/components/ui/Overlay";
import { ButtonLink } from "@/components/ui/Button";
import { QuantityStepper } from "./QuantityStepper";
import { MicroLabel, SampleBadge } from "@/components/ui/Bits";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/lib/format";
import { bezier } from "@/lib/motion/tokens";
import { deliveryNotes } from "@/lib/config/order";

export function CartDrawer() {
  const { lines, isOpen, closeCart, updateQuantity, remove, clear, totals, count } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <Overlay
      open={isOpen}
      onClose={closeCart}
      kind="drawer-right"
      label="Your order"
      testId="cart-drawer"
    >
      <OverlayHeader
        title="Your order"
        micro={count > 0 ? `${count} item${count === 1 ? "" : "s"}` : "Empty"}
        onClose={closeCart}
        closeLabel="Close your order"
      />

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-4 px-5 py-10 sm:px-6">
          <MicroLabel tone="amber">Nothing here yet</MicroLabel>
          <h3 className="text-[1.5rem] leading-tight text-ivory">Your order is empty.</h3>
          <p className="text-[0.9rem] leading-relaxed text-ash">
            Browse the sample menu and add a dish — everything you choose appears here, and nothing is sent
            until you review it.
          </p>
          <ButtonLink href="/#menu" onClick={closeCart} size="lg" className="mt-2">
            Explore the menu
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <ul className="flex flex-col divide-y divide-ivory/8">
              <AnimatePresence initial={false}>
                {lines.map((line) => (
                  <motion.li
                    key={line.key}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24, height: 0 }}
                    transition={{ duration: 0.28, ease: bezier.soft }}
                    className="flex gap-4 py-4"
                    data-testid="cart-line"
                  >
                    <Link
                      href={`/#menu`}
                      onClick={closeCart}
                      className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-sm border border-ivory/10"
                      aria-label={`See ${line.name} on the menu`}
                    >
                      <Image
                        src={line.imageSrc}
                        alt=""
                        fill
                        sizes="76px"
                        className="object-cover"
                        style={{ backgroundColor: "#2a2119" }}
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[0.95rem] text-ivory">{line.name}</p>
                          {line.selections.length > 0 ? (
                            <p className="mt-1 text-[0.78rem] leading-snug text-ash">
                              {line.selections
                                .map((selection) => selection.choiceLabels.join(", "))
                                .join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <p className="tnum shrink-0 text-[0.92rem] text-ivory/90">
                          {formatPrice(line.lineTotalPaise)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <QuantityStepper
                          value={line.quantity}
                          onChange={(value) => updateQuantity(line.key, value)}
                          itemName={line.name}
                          size="sm"
                        />
                        <button
                          type="button"
                          onClick={() => remove(line.key)}
                          className="micro text-ash/70 transition-colors hover:text-chili"
                          aria-label={`Remove ${line.name} from your order`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <div className="mt-4 flex items-center gap-2">
              <SampleBadge />
              <p className="micro text-ash/70">Prices are sample values</p>
            </div>
          </div>

          <div className="border-t border-ivory/10 bg-char/95 px-5 py-4 sm:px-6">
            <dl className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <dt className="text-[0.9rem] text-ash">Subtotal</dt>
                <dd className="tnum text-[1.1rem] text-ivory" data-testid="cart-subtotal">
                  {formatPrice(totals.subtotalPaise)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[0.86rem] text-ash">Delivery charge</dt>
                <dd className="micro text-ash/80" data-testid="cart-delivery">
                  To be confirmed
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[0.86rem] text-ash">Taxes</dt>
                <dd className="micro text-ash/80">To be confirmed</dd>
              </div>
            </dl>

            <p className="mt-3 text-[0.76rem] leading-relaxed text-ash/75">{deliveryNotes.chargesNote}</p>

            <div className="mt-4 flex flex-col gap-2">
              <ButtonLink href="/checkout" onClick={closeCart} size="lg" fullWidth data-testid="cart-checkout">
                Continue to delivery details
                <span aria-hidden="true">→</span>
              </ButtonLink>
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/#menu"
                  onClick={closeCart}
                  className="micro text-ash transition-colors hover:text-ivory"
                >
                  ← Add more items
                </Link>
                {confirmClear ? (
                  <span className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        clear();
                        setConfirmClear(false);
                      }}
                      className="micro text-chili"
                      data-testid="cart-clear-confirm"
                    >
                      Yes, clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="micro text-ash"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="micro text-ash/70 transition-colors hover:text-chili"
                    data-testid="cart-clear"
                  >
                    Clear order
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Overlay>
  );
}
