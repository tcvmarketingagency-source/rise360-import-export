"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addLine,
  buildCartLine,
  cartCount,
  cartSubtotal,
  removeLine,
  setLineQuantity,
  type DraftSelection,
} from "@/lib/cart/line";
import { computeTotals, previewPricing, type CartTotals } from "@/lib/cart/pricing";
import type { CartLine, MenuItem } from "@/lib/menu/types";

const STORAGE_KEY = "maitri.cart.v1";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalPaise: number;
  totals: CartTotals;
  isOpen: boolean;
  hydrated: boolean;
  /** Latest add, used for the confirmation toast. */
  lastAdded: { name: string; key: string; at: number } | null;
  addItem: (item: MenuItem, selection: DraftSelection, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.key === "string" &&
    typeof candidate.itemId === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.quantity === "number" &&
    typeof candidate.unitPricePaise === "number" &&
    Array.isArray(candidate.selections)
  );
}

function readStoredCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartLine).slice(0, 40);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartContextValue["lastAdded"]>(null);

  // Restore after hydration (never during render → no hydration mismatch).
  useEffect(() => {
    setLines(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* Storage can be unavailable in private modes — the cart still works in memory. */
    }
  }, [lines, hydrated]);

  const addItem = useCallback<CartContextValue["addItem"]>((item, selection, quantity = 1) => {
    const line = buildCartLine(item, selection, quantity);
    setLines((current) => addLine(current, line));
    setLastAdded({ name: item.name, key: line.key, at: Date.now() });
  }, []);

  const updateQuantity = useCallback<CartContextValue["updateQuantity"]>((key, quantity) => {
    setLines((current) => setLineQuantity(current, key, quantity));
  }, []);

  const remove = useCallback<CartContextValue["remove"]>((key) => {
    setLines((current) => removeLine(current, key));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totals = useMemo(() => computeTotals(lines, previewPricing), [lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      subtotalPaise: cartSubtotal(lines),
      totals,
      isOpen,
      hydrated,
      lastAdded,
      addItem,
      updateQuantity,
      remove,
      clear,
      openCart,
      closeCart,
    }),
    [lines, totals, isOpen, hydrated, lastAdded, addItem, updateQuantity, remove, clear, openCart, closeCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
