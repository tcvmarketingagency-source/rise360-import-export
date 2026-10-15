/**
 * Order lifecycle — shared by the server (validation, API) and the client
 * (staff dashboard). Deliberately free of server-only imports so both sides can
 * agree on exactly the same state machine.
 */

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "dispatched",
  "delivered",
  "cancelled",
  "rejected",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const statusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export const statusDescription: Record<OrderStatus, string> = {
  pending: "Received from the website, waiting for staff to accept.",
  accepted: "Accepted — the kitchen has the order.",
  preparing: "Being prepared in the kitchen.",
  ready: "Ready for handover to the delivery rider.",
  dispatched: "Out for delivery.",
  delivered: "Delivered to the customer.",
  cancelled: "Cancelled before completion.",
  rejected: "Rejected by staff (for example, outside the delivery area).",
};

/** The next step staff would normally take, used for one-tap progression. */
export const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "dispatched",
  dispatched: "delivered",
};

/** Allowed forward transitions, so staff cannot jump to an impossible state. */
export const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "dispatched", "cancelled"],
  ready: ["dispatched", "delivered", "cancelled"],
  dispatched: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return statusTransitions[from].includes(to);
}
