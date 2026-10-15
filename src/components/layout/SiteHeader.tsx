"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Overlay } from "@/components/ui/Overlay";
import { ButtonLink } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";
import { useMotion } from "@/components/providers/MotionProvider";
import { nav } from "@/lib/content/site";
import { telHref, verified } from "@/lib/config/business";
import { isPreview } from "@/lib/config/order";
import { bezier } from "@/lib/motion/tokens";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const { count, openCart, isOpen } = useCart();
  const { scrollToId } = useMotion();
  const pathname = usePathname();
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        setScrolled(scrollTop > 48);
        setProgress(height > 0 ? Math.min(1, scrollTop / height) : 0);
        rafRef.current = null;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const goTo = (event: React.MouseEvent, href: string) => {
    if (!href.startsWith("#")) return;
    event.preventDefault();
    setMobileOpen(false);
    scrollToId(href);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[100] transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled || mobileOpen
            ? "border-b border-ivory/10 bg-ink/85 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
        data-testid="site-header"
      >
        {/* Scroll-position indicator: a single hairline, no chrome. */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-ivory/8">
          <div
            className="h-px origin-left bg-amber/70"
            style={{ transform: `scaleX(${progress})` }}
            aria-hidden="true"
          />
        </div>

        <div className="shell flex h-[72px] items-center justify-between gap-4">
          <Link
            href="/"
            onClick={(event) => {
              if (pathname === "/") goTo(event, "#hero");
            }}
            className="group flex items-center gap-3"
            aria-label="Maitri Residency — home"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-amber/45 text-[0.8rem] text-amber"
              style={{ fontFamily: "var(--font-display)" }}
            >
              M
            </span>
            <span className="flex flex-col leading-none">
              <span
                className="text-[1.05rem] tracking-[0.02em] text-ivory"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Maitri Residency
              </span>
              <span className="micro mt-1 hidden text-ash/80 sm:block">
                Karimnagar · Telangana
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {nav.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(event) => goTo(event, item.href)}
                className="group relative flex flex-col gap-1 py-1 text-[0.82rem] tracking-wide text-ivory/75 transition-colors hover:text-ivory"
              >
                <span className="micro absolute -top-2 left-0 text-[0.5rem] text-amber/0 transition-colors group-hover:text-amber/70">
                  {item.micro}
                </span>
                {item.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-amber/70 transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isPreview ? (
              <span
                className="micro hidden items-center gap-1.5 rounded-full border border-turmeric/35 px-2.5 py-1.5 text-turmeric lg:inline-flex"
                title="Concept build — sample menu, no orders transmitted"
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-turmeric" />
                Concept
              </span>
            ) : null}

            <a
              href={telHref}
              className="micro hidden items-center gap-2 rounded-full border border-ivory/18 px-3 py-2.5 text-ivory/85 transition-colors hover:border-amber/60 hover:text-amber xl:inline-flex"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M4 4h4l2 5-2.5 1.5a12 12 0 006 6L15 14l5 2v4a1 1 0 01-1 1A16 16 0 013 5a1 1 0 011-1z" />
              </svg>
              {verified.deliveryPhone.display}
            </a>

            <CartButton count={count} onClick={openCart} hidden={isOpen} />

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/18 text-ivory transition-colors hover:border-amber/60 hover:text-amber lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              data-testid="nav-open"
            >
              <span aria-hidden="true" className="flex flex-col gap-[5px]">
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-3.5 bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <Overlay
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        kind="sheet-bottom"
        label="Navigation"
        testId="mobile-nav"
      >
        <nav aria-label="Mobile" className="flex flex-col gap-1 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7">
          <div className="flex items-center justify-between">
            <span className="micro text-amber">Menu</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/15 text-ivory/70"
              aria-label="Close navigation menu"
              data-testid="nav-close"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </div>

          <ul className="mt-4 flex flex-col divide-y divide-ivory/8">
            {nav.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  onClick={(event) => goTo(event, item.href)}
                  className="flex items-baseline justify-between py-4 text-[1.35rem] text-ivory"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.label}
                  <span className="micro text-ash/70">{item.micro}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            <ButtonLink href="#menu" size="lg" onClick={(event: React.MouseEvent) => goTo(event, "#menu")}>
              Order from the menu
            </ButtonLink>
            <ButtonLink href={telHref} external variant="secondary" size="lg">
              Call {verified.deliveryPhone.display}
            </ButtonLink>
            {isPreview ? (
              <p className="micro pt-1 text-turmeric/80">
                Concept build · sample menu · no orders transmitted
              </p>
            ) : null}
          </div>
        </nav>
      </Overlay>
    </>
  );
}

export function CartButton({
  count,
  onClick,
  hidden,
}: {
  count: number;
  onClick: () => void;
  hidden?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={{ opacity: hidden ? 0 : 1, scale: hidden ? 0.9 : 1 }}
      transition={{ duration: 0.25, ease: bezier.snap }}
      className="relative flex h-11 items-center gap-2 rounded-full border border-ivory/18 px-4 text-[0.78rem] tracking-wide text-ivory transition-colors hover:border-amber/60 hover:text-amber"
      aria-label={`Open your order — ${count} item${count === 1 ? "" : "s"}`}
      data-testid="cart-button"
      style={{ pointerEvents: hidden ? "none" : "auto" }}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 7h16l-1.4 11.2A2 2 0 0116.6 20H7.4a2 2 0 01-2-1.8L4 7z" />
        <path d="M9 7V5.6A3 3 0 0112 3a3 3 0 013 2.6V7" />
      </svg>
      <span className="hidden sm:inline">Order</span>
      <span className="tnum flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1 text-[0.66rem] font-medium text-ink">
        {count}
      </span>
      <AnimatePresence>
        {count > 0 ? (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.5, ease: bezier.snap }}
            className="pointer-events-none absolute -right-1 -top-1 h-6 w-6 rounded-full border border-amber/60"
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}
