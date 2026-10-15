/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ORDER MODE + PRICING CONFIGURATION
 *
 * The entire ordering journey reads from this file. Switching the experience
 * from a safe concept preview to live WhatsApp ordering or persistent Supabase
 * ordering is a configuration change, not a rewrite.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type OrderMode = "preview" | "whatsapp" | "online";

const rawOrderMode = process.env.NEXT_PUBLIC_ORDER_MODE;

/**
 * PREVIEW is always the safe default: filling the checkout form never reaches
 * the restaurant, never opens a chat, never charges anything.
 */
export const orderMode: OrderMode =
  rawOrderMode === "whatsapp" || rawOrderMode === "online" ? rawOrderMode : "preview";

export const orderModeMeta: Record<
  OrderMode,
  { label: string; summary: string; transmits: boolean }
> = {
  preview: {
    label: "Concept preview",
    summary:
      "No orders are sent. The full journey — menu, cart, checkout, order summary — is fully explorable and stops at a review step.",
    transmits: false,
  },
  whatsapp: {
    label: "WhatsApp / call assisted",
    summary:
      "A formatted order summary is prepared and reviewed by the customer, then opened in WhatsApp or dialled to the delivery line. The order is confirmed by the restaurant, not by this website.",
    transmits: true,
  },
  online: {
    label: "Persistent online orders",
    summary:
      "Orders are validated on the server and saved with a unique reference and a staff status workflow.",
    transmits: true,
  },
};

export const isPreview = orderMode === "preview";

/**
 * Capabilities that require either restaurant approval or credentials that
 * do not exist yet. Flipping any of these to `true` requires the matching
 * approved value in configuration — the UI changes shape automatically.
 */
export const capabilities = {
  /** Delivery zone list, charges and minimums are unconfirmed by Maitri. */
  deliveryPricing: false,
  /** GST/taxes must be confirmed before any tax line is displayed. */
  taxes: false,
  /** Pickup is not offered on this concept build. */
  pickup: false,
  /** No payment provider is authorised — never simulated. */
  payments: false,
  /** Requires NEXT_PUBLIC_SUPABASE_* plus a service-role key server-side. */
  persistentOrders: orderMode === "online" && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  /** Staff dashboard needs Supabase Auth. */
  adminDashboard: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  /** Shows unverified dietary marks with an explicit "to confirm" label. */
  showUnverifiedDietaryInPreview: true,
  /** Item availability, spice levels and portion options are sample content. */
  itemOptions: true,
} as const;

/** Pre-filled placeholder for area selectors until delivery zones are approved. */
export const unconfirmedDeliveryAreas: string[] = [];

export const deliveryNotes = {
  areaPlaceholder: "Delivery areas to be confirmed by the restaurant",
  chargesNote:
    "Delivery charges, minimum order value and free-delivery thresholds are not configured yet. They will be shown here once Maitri approves them.",
  hoursNote: "Kitchen and delivery hours are not confirmed yet.",
} as const;

/** Banner shown site-wide while the concept build is unreleased. */
export const previewBanner = {
  enabled: true,
  label: "CONCEPT PREVIEW",
  message:
    "Concept build for Maitri Residency. Sample menu and placeholder prices — no orders are transmitted in this mode.",
} as const;

/**
 * Demo/sample content markers. Every authored menu entry carries
 * `demo: true` so it can be filtered, badged, or removed in one pass.
 */
export const contentFlags = {
  markSampleContent: true,
  sampleLabel: "SAMPLE",
  sampleNote: "Authored placeholder — replace with Maitri's approved menu and prices.",
} as const;
