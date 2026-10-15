"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { getDeviceProfile, type DeviceProfile } from "@/lib/webgl";

interface MotionContextValue {
  reducedMotion: boolean;
  /** True once device + motion preferences are known (after hydration). */
  ready: boolean;
  device: DeviceProfile;
  isDesktopPointer: boolean;
  /** Smooth-scroll to an anchored section; falls back to native scrolling. */
  scrollToId: (id: string) => void;
  /** Locks page scroll while a drawer or dialog owns the screen. */
  lockScroll: (locked: boolean) => void;
}

const MotionContext = createContext<MotionContextValue>({
  reducedMotion: false,
  ready: false,
  device: "mid",
  isDesktopPointer: false,
  scrollToId: () => {},
  lockScroll: () => {},
});

let pluginsRegistered = false;
function registerPlugins() {
  if (pluginsRegistered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  pluginsRegistered = true;
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [device, setDevice] = useState<DeviceProfile>("mid");
  const [isDesktopPointer, setIsDesktopPointer] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const lockCount = useRef(0);

  useEffect(() => {
    registerPlugins();
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    const sync = () => {
      reducedMotionRef.current = motionQuery.matches;
      setReducedMotion(motionQuery.matches);
      setIsDesktopPointer(pointerQuery.matches);
      setDevice(getDeviceProfile());
      setReady(true);
    };
    sync();

    motionQuery.addEventListener("change", sync);
    pointerQuery.addEventListener("change", sync);
    return () => {
      motionQuery.removeEventListener("change", sync);
      pointerQuery.removeEventListener("change", sync);
    };
  }, []);

  // Smooth scroll: desktop pointers only, never for reduced-motion users, and
  // never on touch (native momentum scrolling is better there).
  useEffect(() => {
    if (!ready || reducedMotion || !isDesktopPointer) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.2,
      wheelMultiplier: 1,
      autoRaf: false,
    });
    lenisRef.current = lenis;

    // Single owner of scroll position: Lenis feeds ScrollTrigger, not the reverse.
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Stop the smoothing loop while the tab is hidden — saves battery on mobile.
    const onVisibility = () => {
      if (document.hidden) lenis.stop();
      else if (lockCount.current === 0) lenis.start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [ready, reducedMotion, isDesktopPointer]);

  /**
   * A scroll asked for while the page is locked.
   *
   * The mobile drawer closes on the same click that asks to scroll somewhere,
   * and it holds the scroll lock until React has re-rendered without it. That
   * window is fatal for the request: Lenis ignores `scrollTo` while it is
   * stopped, and a locked document cannot scroll (reproduced on a narrow
   * desktop window: the drawer's "Menu" link left the page at the top). So the
   * request is queued and performed the moment the last lock is released.
   */
  const pendingScroll = useRef<{ target: HTMLElement; offset: number } | null>(null);
  const reducedMotionRef = useRef(false);

  const performScroll = useCallback((target: HTMLElement, offset: number) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.15 });
      return;
    }
    const top = target.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: reducedMotionRef.current ? "auto" : "smooth" });
  }, []);

  const scrollToId = useCallback(
    (id: string) => {
      const target = document.getElementById(id.replace(/^#/, ""));
      if (!target) return;
      const offset = -Math.min(96, window.innerHeight * 0.08);
      if (lockCount.current > 0) {
        pendingScroll.current = { target, offset };
        return;
      }
      performScroll(target, offset);
    },
    [performScroll],
  );

  const lockScroll = useCallback(
    (locked: boolean) => {
      lockCount.current = Math.max(0, lockCount.current + (locked ? 1 : -1));
      const shouldLock = lockCount.current > 0;
      if (lenisRef.current) {
        if (shouldLock) lenisRef.current.stop();
        else lenisRef.current.start();
      }
      document.documentElement.style.overflow = shouldLock ? "hidden" : "";
      if (!shouldLock && pendingScroll.current) {
        const { target, offset } = pendingScroll.current;
        pendingScroll.current = null;
        // Let the unlock land before the page starts moving.
        window.requestAnimationFrame(() => performScroll(target, offset));
      }
    },
    [performScroll],
  );

  const value = useMemo<MotionContextValue>(
    () => ({ reducedMotion, ready, device, isDesktopPointer, scrollToId, lockScroll }),
    [reducedMotion, ready, device, isDesktopPointer, scrollToId, lockScroll],
  );

  return (
    <MotionContext.Provider value={value}>
      {/* Framer Motion's own transform animations also honour the OS setting. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </MotionContext.Provider>
  );
}

export function useMotion() {
  return useContext(MotionContext);
}

export { gsap, ScrollTrigger };
