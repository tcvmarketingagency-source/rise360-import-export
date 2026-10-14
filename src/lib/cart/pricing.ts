import { capabilities } from "@/lib/config/order";
import type { CartLine } from "@/lib/menu/types";
import { cartSubtotal } from "./line";

/**
 * Pricing engine.
 *
 * Rule: never display a money line the restaurant has not configured.
 * Every component that can be configured (delivery fee, tax, packaging,
 * minimum order, free-delivery threshold) resolves to `null` until a confirmed
 * value exists, and the cart renders a clearly-labelled "to be confirmed" note
 * instead of inventing a number.
 */

export interface CartTotals {
  subtotalPaise: number;
  deliveryPaise: number | null;
  taxesPaise: number | null;
  packagingPaise: number | null;
  discountPaise: number | null;
  totalPaise: number;
  /** True while one or more configured components are still unknown. */
  hasUnconfirmedComponents: boolean;
  notes: string[];
  minimumOrderPaise: number | null;
  meetsMinimumOrder: boolean | null;
}

export interface PricingConfig {
  deliveryPaise?: number | null;
  taxesPaise?: number | null;
  packagingPaise?: number | null;
  minimumOrderPaise?: number | null;
}

/**
 * Concept preview passes an empty config on purpose — the cart then reads
 * "Delivery charges confirmed at the time of order" rather than ₹0.
 */
export const previewPricing: PricingConfig = {
  deliveryPaise: null,
  taxesPaise: null,
  packagingPaise: null,
  minimumOrderPaise: null,
};

export function computeTotals(lines: CartLine[], config: PricingConfig = previewPricing): CartTotals {
  const subtotalPaise = cartSubtotal(lines);
  const notes: string[] = [];

  const deliveryPaise =
    capabilities.deliveryPricing && typeof config.deliveryPaise === "number"
      ? Math.max(0, Math.round(config.deliveryPaise))
      : null;
  const taxesPaise =
    capabilities.taxes && typeof config.taxesPaise === "number"
      ? Math.max(0, Math.round(config.taxesPaise))
      : null;
  const packagingPaise =
    typeof config.packagingPaise === "number" ? Math.max(0, Math.round(config.packagingPaise)) : null;
  const minimumOrderPaise =
    typeof config.minimumOrderPaise === "number" ? Math.max(0, Math.round(config.minimumOrderPaise)) : null;

  if (deliveryPaise === null) {
    notes.push("Delivery charge not configured — the restaurant confirms it on the call.");
  }
  if (taxesPaise === null) {
    notes.push("Taxes (if applicable) will be confirmed by the restaurant.");
  }

  const totalPaise = subtotalPaise + (deliveryPaise ?? 0) + (taxesPaise ?? 0) + (packagingPaise ?? 0);

  return {
    subtotalPaise,
    deliveryPaise,
    taxesPaise,
    packagingPaise,
    discountPaise: null,
    totalPaise,
    hasUnconfirmedComponents: deliveryPaise === null || taxesPaise === null,
    notes,
    minimumOrderPaise,
    meetsMinimumOrder: minimumOrderPaise === null ? null : subtotalPaise >= minimumOrderPaise,
  };
}
