"use client";

import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion";
import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useState } from "react";
import { useMotion } from "@/components/providers/MotionProvider";
import { bezier } from "@/lib/motion/tokens";

type OverlayKind = "drawer-right" | "dialog" | "sheet-bottom";

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  kind?: OverlayKind;
  labelledBy?: string;
  label?: string;
  children: React.ReactNode;
  /** Wrapper class for the panel itself. */
  panelClassName?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  testId?: string;
}

type PanelVariant = { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition };

const panelMotion: Record<OverlayKind, PanelVariant> = {
  "drawer-right": {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
  dialog: {
    initial: { opacity: 0, y: 18, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 12, scale: 0.99 },
  },
  "sheet-bottom": {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
  },
};

const panelPosition: Record<OverlayKind, string> = {
  "drawer-right":
    "fixed inset-y-0 right-0 w-full max-w-[27rem] border-l border-ivory/10 bg-char",
  dialog:
    "fixed left-1/2 top-1/2 max-h-[88dvh] w-[min(46rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 " +
    "overflow-hidden rounded-sm border border-ivory/12 bg-char",
  "sheet-bottom":
    "fixed inset-x-0 bottom-0 max-h-[86dvh] w-full overflow-hidden rounded-t-lg border-t border-ivory/12 bg-char",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible overlay shell used by the cart drawer, item dialog and mobile nav.
 * Handles: Escape to close, focus trap, focus restore, background scroll lock,
 * aria-modal semantics and click-outside dismissal.
 */
export function Overlay({
  open,
  onClose,
  kind = "dialog",
  labelledBy,
  label,
  children,
  panelClassName = "",
  initialFocusRef,
  testId,
}: OverlayProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const { lockScroll, reducedMotion } = useMotion();
  const fallbackId = useId();
  const ariaLabelledBy = labelledBy ?? (label ? fallbackId : undefined);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    restoreRef.current = document.activeElement as HTMLElement | null;

    const raf = window.requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (initialFocusRef?.current ?? first ?? panelRef.current)?.focus?.();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      // `offsetParent` is null for everything inside a fixed-position panel, so
      // visibility is measured with client rects instead.
      const list = Array.from(nodes).filter(
        (node) => node.getClientRects().length > 0 || node === document.activeElement,
      );
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      lockScroll(false);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose, lockScroll, initialFocusRef]);

  const onBackdrop = useCallback(() => onClose(), [onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120]" data-testid={testId}>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.3, ease: bezier.soft }}
            onClick={onBackdrop}
            className="absolute inset-0 bg-ink/78 backdrop-blur-[3px]"
            aria-hidden="true"
          />
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
            tabIndex={-1}
            initial={panelMotion[kind].initial}
            animate={panelMotion[kind].animate}
            exit={panelMotion[kind].exit}
            transition={{
              duration: reducedMotion ? 0.01 : kind === "dialog" ? 0.3 : 0.42,
              ease: bezier.cinematic,
            }}
            className={`${panelPosition[kind]} z-10 flex flex-col outline-none ${panelClassName}`}
          >
            {label && !labelledBy ? (
              <span id={fallbackId} className="sr-only">
                {label}
              </span>
            ) : null}
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function OverlayHeader({
  title,
  micro,
  onClose,
  closeLabel = "Close",
}: {
  title: string;
  micro?: string;
  onClose: () => void;
  closeLabel?: string;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-ivory/10 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-2">
        {micro ? <span className="micro text-amber">{micro}</span> : null}
        <h2 className="text-xl leading-tight text-ivory">{title}</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-amber/60 hover:text-amber"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>
    </header>
  );
}
