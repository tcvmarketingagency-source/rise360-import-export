import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/lib/menu/types";
import { verified, whatsappBaseHref } from "@/lib/config/business";
import { isPreview } from "@/lib/config/order";

export interface OrderDraft {
  reference: string;
  customerName: string;
  phone: string;
  address: string;
  area: string;
  instructions?: string;
  lines: CartLine[];
  subtotalPaise: number;
  deliveryPaise: number | null;
  taxesPaise: number | null;
  totalPaise: number;
  placedAt: Date;
}

/**
 * Human-readable, unique-looking reference for the customer AND for staff to
 * find in a WhatsApp thread. `MR-<YYMMDD>-<4 chars>`.
 * In preview mode the reference is prefixed CONCEPT so nobody can mistake a
 * demo summary for a real order token.
 */
export function createOrderReference(now: Date = new Date(), random = Math.random): string {
  const stamp = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += alphabet[Math.floor(random() * alphabet.length)] ?? "X";
  }
  return `${isPreview ? "CONCEPT-" : ""}MR-${stamp}-${suffix}`;
}

function formatLine(line: CartLine): string[] {
  const rows = [`• ${line.name} × ${line.quantity}`];
  for (const selection of line.selections) {
    const priced = selection.priceDeltaPaise !== 0 ? ` (${formatPrice(selection.priceDeltaPaise)})` : "";
    rows.push(`    – ${selection.groupLabel}: ${selection.choiceLabels.join(", ")}${priced}`);
  }
  rows.push(`    Line total: ${formatPrice(line.lineTotalPaise)}`);
  return rows;
}

/**
 * Builds the exact text a customer reviews before anything is sent.
 * Nothing is transmitted by this function — it only produces a string.
 */
export function buildOrderMessage(draft: OrderDraft): string {
  const rows: string[] = [];
  rows.push(isPreview ? "ORDER SUMMARY — CONCEPT PREVIEW" : "Delivery order request");
  rows.push(`Ref: ${draft.reference}`);
  rows.push("");
  rows.push("Items");
  for (const line of draft.lines) rows.push(...formatLine(line));
  rows.push("");
  rows.push(`Subtotal: ${formatPrice(draft.subtotalPaise)}`);
  rows.push(
    draft.deliveryPaise === null
      ? "Delivery charge: to be confirmed by the restaurant"
      : `Delivery charge: ${formatPrice(draft.deliveryPaise)}`,
  );
  rows.push(
    draft.taxesPaise === null
      ? "Taxes: to be confirmed by the restaurant"
      : `Taxes: ${formatPrice(draft.taxesPaise)}`,
  );
  rows.push(`Indicative total: ${formatPrice(draft.totalPaise)}`);
  rows.push("");
  rows.push("Delivery details");
  rows.push(`Name: ${draft.customerName}`);
  rows.push(`Phone: ${draft.phone}`);
  rows.push(`Address: ${draft.address}`);
  rows.push(`Area: ${draft.area}`);
  if (draft.instructions && draft.instructions.trim().length > 0) {
    rows.push(`Instructions: ${draft.instructions.trim()}`);
  }
  rows.push("");
  rows.push(
    isPreview
      ? "This is a finalised concept preview. No order has been sent to the restaurant and no charge has been made."
      : "This is an order request. It is confirmed only once Maitri Residency accepts it on this number.",
  );
  return rows.join("\n");
}

/** WhatsApp deep link pre-filled with the reviewed message (whatsapp mode only). */
export function buildWhatsAppHref(message: string): string {
  return `${whatsappBaseHref}?text=${encodeURIComponent(message)}`;
}

export const deliveryPhoneDisplay = verified.deliveryPhone.display;
