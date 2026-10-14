import "server-only";
import { orderPayloadSchema, type OrderPayload } from "@/lib/validation/order";
import { getMenuItems } from "@/lib/menu";
import { createOrderReference } from "./message";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER-SIDE ORDER HANDLING
 *
 * Trust nothing from the browser:
 *   1. The payload is validated with the same Zod schema the client used.
 *   2. Every price is re-derived from the server's own menu data. A tampered
 *      client price (or an item that does not exist) is rejected outright.
 *   3. Only then is a reference generated and the order stored.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface VerifiedOrder {
  payload: OrderPayload;
  subtotalPaise: number;
  reference: string;
  lineCount: number;
}

export type VerifyResult =
  | { ok: true; order: VerifiedOrder }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> };

export function verifyOrderPayload(raw: unknown): VerifyResult {
  const parsed = orderPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      error: "Some delivery details are missing or invalid. Please review the form and try again.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]),
      ),
    };
  }

  const payload = parsed.data;
  const items = getMenuItems();
  let subtotalPaise = 0;

  for (const line of payload.lines) {
    const item = items.find((candidate) => candidate.id === line.itemId);
    if (!item) {
      return { ok: false, status: 422, error: `“${line.name}” is no longer on the menu.` };
    }
    if (!item.availability.available) {
      return { ok: false, status: 409, error: `“${item.name}” is unavailable right now.` };
    }
    if (line.basePricePaise !== item.pricePaise) {
      return {
        ok: false,
        status: 409,
        error: `The price of “${item.name}” changed. Please refresh the menu and add it again.`,
      };
    }

    // Recompute each option's price from the menu definition, not the client's.
    let delta = 0;
    for (const selection of line.selections) {
      const group = item.optionGroups.find((candidate) => candidate.id === selection.groupId);
      if (!group) {
        return { ok: false, status: 422, error: `Unknown option group on “${item.name}”.` };
      }
      for (const choiceId of selection.choiceIds) {
        const choice = group.choices.find((candidate) => candidate.id === choiceId);
        if (!choice) {
          return { ok: false, status: 422, error: `Unknown option on “${item.name}”.` };
        }
        delta += choice.priceDeltaPaise;
      }
      if (group.required && selection.choiceIds.length === 0) {
        return { ok: false, status: 422, error: `Choose ${group.label} for “${item.name}”.` };
      }
    }

    const unitPrice = item.pricePaise + delta;
    if (unitPrice !== line.unitPricePaise) {
      return {
        ok: false,
        status: 409,
        error: `The price of “${item.name}” changed. Please reopen the item and add it again.`,
      };
    }
    subtotalPaise += unitPrice * line.quantity;
  }

  if (subtotalPaise !== payload.expectedSubtotalPaise) {
    return {
      ok: false,
      status: 409,
      error: "The order total did not match. Please review your order and try again.",
    };
  }

  return {
    ok: true,
    order: {
      payload,
      subtotalPaise,
      reference: createOrderReference(),
      lineCount: payload.lines.length,
    },
  };
}

/** Very small in-memory limiter. Production should use a shared store. */
const attempts = new Map<string, number[]>();

export function rateLimit(key: string, limit = 6, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const history = (attempts.get(key) ?? []).filter((time) => now - time < windowMs);
  history.push(now);
  attempts.set(key, history);
  return history.length <= limit;
}
