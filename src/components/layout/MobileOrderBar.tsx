"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useMotion } from "@/components/providers/MotionProvider";
import { telHref, verified } from "@/lib/config/business";
import { bezier } from "@/lib/motion/tokens";

/**
 * Persistent bottom ordering bar — phones only, and only once the visitor has
 * started scrolling, so it never covers the hero, the menu search or a dialog.
 * It disappears while the cart drawer is open.
 */
export function MobileOrderBar() {
  const [visible, setVisible] = useState(false);
  const { count, openCart, isOpen } = useCart();
  const { scrollToId } = useMotion();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shown = visible && !isOpen && pathname !== "/checkout";

  return (
    <AnimatePresence>
      {shown ? (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.4, ease: bezier.cinematic }}
          className="fixed inset-x-0 bottom-0 z-[95] border-t border-ivory/12 bg-ink/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
          data-testid="mobile-order-bar"
        >
          <div className="flex items-stretch gap-2 px-3 py-2.5">
            <button
              type="button"
              onClick={() => scrollToId("#menu")}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-sm border border-ivory/18 text-[0.72rem] uppercase tracking-[0.16em] text-ivory"
            >
              Menu
            </button>
            <a
              href={telHref}
              className="flex h-12 w-14 items-center justify-center rounded-sm border border-ivory/18 text-ivory"
              aria-label={`Call the delivery line on ${verified.deliveryPhone.display}`}
            >
              <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 4h4l2 5-2.5 1.5a12 12 0 006 6L15 14l5 2v4a1 1 0 01-1 1A16 16 0 013 5a1 1 0 011-1z" />
              </svg>
            </a>
            <button
              type="button"
              onClick={openCart}
              className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-sm bg-amber text-[0.72rem] uppercase tracking-[0.16em] text-ink"
              data-testid="mobile-order-bar-cart"
            >
              Your order
              <span className="tnum flex h-5 min-w-5 items-center justify-center rounded-full bg-ink/15 px-1 text-[0.66rem]">
                {count}
              </span>
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
