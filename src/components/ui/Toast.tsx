"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { bezier } from "@/lib/motion/tokens";
import { pluralise } from "@/lib/format";

/**
 * Add-to-cart confirmation. Deliberately a toast rather than an auto-opened
 * drawer: the customer keeps browsing, and the cart is one tap away.
 */
export function CartToast() {
  const { lastAdded, count, openCart } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 4200);
    return () => window.clearTimeout(timer);
  }, [lastAdded]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[130] flex justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-6"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {visible && lastAdded ? (
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.99 }}
            transition={{ duration: 0.32, ease: bezier.cinematic }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-sm border border-amber/25 bg-char/95 px-4 py-3 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-sm"
            data-testid="cart-toast"
          >
            <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-amber/15 text-amber">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.92rem] text-ivory">
                <span className="text-amber">Added</span> · {lastAdded.name}
              </p>
              <p className="micro mt-1 text-ash">
                {count} {pluralise(count, "item")} in your order
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setVisible(false);
                openCart();
              }}
              className="micro shrink-0 rounded-sm border border-ivory/20 px-3 py-2 text-ivory transition-colors hover:border-amber/60 hover:text-amber"
            >
              View
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
