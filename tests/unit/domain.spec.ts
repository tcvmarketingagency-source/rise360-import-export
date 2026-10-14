import { expect, test } from "@playwright/test";
import { buildCartLine, cartSubtotal, addLine, setLineQuantity, removeLine, defaultSelection } from "@/lib/cart/line";
import { computeTotals, previewPricing } from "@/lib/cart/pricing";
import { buildOrderMessage, buildWhatsAppHref, createOrderReference } from "@/lib/orders/message";
import { getMenuItems, filterMenuItems, getFeaturedItems, getCategoryFacets } from "@/lib/menu";
import { checkoutFormSchema, orderPayloadSchema, toFieldErrors } from "@/lib/validation/order";
import { verifyOrderPayload } from "@/lib/orders/server";
import { canTransition, nextStatus, statusTransitions, ORDER_STATUSES } from "@/lib/orders/status";
import { whatsappBaseHref, verified } from "@/lib/config/business";
import { orderMode } from "@/lib/config/order";

/**
 * Pure domain tests — no browser required.
 *
 *   E2E_BASE_URL=none npx playwright test tests/unit
 *
 * These cover the parts of the product where a bug costs real money: cart
 * arithmetic, price re-derivation on the server, validation and the state
 * machine. They run in Node against the same modules the app uses.
 */

const biryani = getMenuItems().find((item) => item.slug === "chicken-dum-biryani")!;
const naan = getMenuItems().find((item) => item.slug === "butter-naan")!;

test.describe("Menu model", () => {
  test("every item declares a category that exists and carries an image", () => {
    const slugs = new Set(getCategoryFacets().map((category) => category.id));
    for (const item of getMenuItems()) {
      expect(slugs.has(item.categoryId), `${item.name} has an unknown category`).toBe(true);
      expect(item.image.src).toMatch(/^\/images\//);
      expect(item.image.alt.length).toBeGreaterThan(12);
      expect(Number.isInteger(item.pricePaise) && item.pricePaise > 0).toBe(true);
    }
  });

  test("sample content is flagged as sample everywhere", () => {
    for (const item of getMenuItems()) {
      expect(item.demo, `${item.name} must be flagged as demo content`).toBe(true);
      for (const mark of item.dietary) {
        // Nothing may claim a verified dietary status before the restaurant confirms it.
        expect(mark.verified).toBe(false);
      }
    }
  });

  test("search, category and dietary filters behave", () => {
    const all = getMenuItems();
    expect(filterMenuItems(all, { search: "biryani" }).length).toBeGreaterThan(0);
    expect(filterMenuItems(all, { search: "BIRYANI" })).toEqual(filterMenuItems(all, { search: "biryani" }));
    expect(filterMenuItems(all, { search: "no-such-dish" })).toEqual([]);
    expect(filterMenuItems(all, { categoryId: "biryani" }).every((i) => i.categoryId === "biryani")).toBe(true);
    expect(filterMenuItems(all, { diet: undefined } as never).length).toBe(all.length);
    expect(filterMenuItems(all, { dietary: "veg" }).every((i) => i.dietary.some((d) => d.kind === "veg"))).toBe(
      true,
    );
    expect(filterMenuItems(all, { onlyAvailable: true }).every((i) => i.availability.available)).toBe(true);
  });

  test("featured selection always returns a full row", () => {
    expect(getFeaturedItems(6)).toHaveLength(6);
    expect(getFeaturedItems(6).every((item) => typeof item.id === "string")).toBe(true);
  });
});

test.describe("Cart arithmetic", () => {
  test("default selection satisfies every required option group", () => {
    const draft = defaultSelection(biryani);
    for (const group of biryani.optionGroups.filter((g) => g.required)) {
      expect(draft[group.id]?.length).toBeGreaterThan(0);
    }
  });

  test("option price deltas are included in the unit price", () => {
    const draft = defaultSelection(biryani);
    draft.portion = ["full"];
    const line = buildCartLine(biryani, draft, 1);
    const fullChoice = biryani.optionGroups
      .find((g) => g.id === "portion")!
      .choices.find((c) => c.id === "full")!;
    expect(line.unitPricePaise).toBe(biryani.pricePaise + fullChoice.priceDeltaPaise);
    expect(line.selectionsDeltaPaise).toBe(fullChoice.priceDeltaPaise);
  });

  test("identical configurations merge; different ones stay separate", () => {
    const half = buildCartLine(biryani, { ...defaultSelection(biryani), portion: ["half"] }, 1);
    const full = buildCartLine(biryani, { ...defaultSelection(biryani), portion: ["full"] }, 1);

    let lines = addLine([], half);
    lines = addLine(lines, half);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.quantity).toBe(2);

    lines = addLine(lines, full);
    expect(lines).toHaveLength(2);
  });

  test("quantity 0 removes the line, and the cap is respected", () => {
    const line = buildCartLine(naan, defaultSelection(naan), 1);
    expect(setLineQuantity([line], line.key, 0)).toHaveLength(0);
    expect(setLineQuantity([line], line.key, 99)[0]!.quantity).toBe(20);
    expect(removeLine([line], line.key)).toHaveLength(0);
  });

  test("subtotal is the sum of line totals", () => {
    const a = buildCartLine(naan, defaultSelection(naan), 3);
    const b = buildCartLine(biryani, defaultSelection(biryani), 2);

    // Independently computed in the test: 3×₹50 + 2×₹300 (sample prices).
    expect(naan.pricePaise).toBe(5000);
    expect(biryani.pricePaise).toBe(30000);
    expect(cartSubtotal([a, b])).toBe(3 * 5000 + 2 * 30000);
  });

  test("no invented delivery fee, tax, discount or minimum order", () => {
    const lines = [buildCartLine(biryani, defaultSelection(biryani), 1)];
    const totals = computeTotals(lines, previewPricing);

    expect(totals.subtotalPaise).toBe(30000);
    expect(totals.deliveryPaise).toBeNull();
    expect(totals.taxesPaise).toBeNull();
    expect(totals.minimumOrderPaise).toBeNull();
    expect(totals.meetsMinimumOrder).toBeNull();
    expect(totals.discountPaise).toBeNull();
    expect(totals.totalPaise).toBe(totals.subtotalPaise);
    expect(totals.hasUnconfirmedComponents).toBe(true);
    expect(totals.notes.join(" ")).toMatch(/not configured/i);
  });

  test("a configured delivery fee is only applied when the capability is on", () => {
    const lines = [buildCartLine(biryani, defaultSelection(biryani), 1)];
    // deliveryPricing is off in this configuration, so a supplied fee must be ignored.
    const totals = computeTotals(lines, { deliveryPaise: 4900 });
    expect(totals.deliveryPaise).toBeNull();
    expect(totals.totalPaise).toBe(30000);
  });
});

test.describe("Order reference", () => {
  test("is unique-looking and human-readable", () => {
    const fixed = new Date("2026-03-04T10:00:00Z");
    const reference = createOrderReference(fixed, () => 0.5);
    // Preview mode prefixes the reference so nobody mistakes a demo for a real order.
    expect(reference).toMatch(/^(CONCEPT-)?MR-260304-[A-Z0-9]{4}$/);

    const many = new Set(
      Array.from({ length: 400 }, () => createOrderReference(new Date("2026-03-04T10:00:00Z"))),
    );
    expect(many.size).toBeGreaterThan(380);
  });

  test("carries no lookalike characters", () => {
    const reference = createOrderReference();
    expect(reference.slice(-4)).not.toMatch(/[O0I1]/);
  });
});

test.describe("WhatsApp / call order message", () => {
  const lines = [buildCartLine(biryani, defaultSelection(biryani), 2)];

  test("formats items, options, totals and delivery details", () => {
    const message = buildOrderMessage({
      reference: "MR-260304-ABCD",
      customerName: "Ravi Kumar",
      phone: "9876543210",
      address: "Flat 4B, Sai Residency, near Clock Tower",
      area: "Mukaram Pura",
      instructions: "Call on arrival",
      lines,
      subtotalPaise: 60000,
      deliveryPaise: null,
      taxesPaise: null,
      totalPaise: 60000,
      placedAt: new Date(),
    });

    expect(message).toContain("Ref: MR-260304-ABCD");
    expect(message).toContain("• Chicken Dum Biryani × 2");
    expect(message).toContain("– Portion: Half");
    expect(message).toContain("Indicative total: ₹600");
    expect(message).toContain("Name: Ravi Kumar");
    expect(message).toContain("Instructions: Call on arrival");

    // The closing line must match the configuration: preview mode says nothing
    // was transmitted, a live mode says the restaurant confirms the order.
    if (orderMode === "preview") {
      expect(message).toContain("ORDER SUMMARY — CONCEPT PREVIEW");
      expect(message).toContain("No order has been sent to the restaurant and no charge has been made");
    } else {
      expect(message).toContain("Delivery order request");
      expect(message).toContain("confirmed only once Maitri Residency accepts it");
    }
  });

  test("points at the publicly posted delivery line and encodes the text", () => {
    expect(whatsappBaseHref).toBe("https://wa.me/918985051111");
    const href = buildWhatsAppHref("Hello • Chicken × 2 · ₹600");
    expect(href.startsWith(`${whatsappBaseHref}?text=`)).toBe(true);
    expect(decodeURIComponent(href.split("?text=")[1]!)).toBe("Hello • Chicken × 2 · ₹600");
    expect(verified.deliveryPhone.display).toBe("+91 89850 51111");
  });
});

test.describe("Validation", () => {
  const base = {
    customerName: "Ravi Kumar",
    phone: "9876543210",
    address: "Flat 4B, Sai Residency, near Clock Tower, Karimnagar",
    area: "Mukaram Pura",
    instructions: "",
    fulfilment: "delivery" as const,
  };

  test("accepts a well-formed order and rejects each broken field", () => {
    expect(checkoutFormSchema.safeParse(base).success).toBe(true);

    const cases: Array<[keyof typeof base, string]> = [
      ["customerName", "A"],
      ["phone", "12345"],
      ["phone", "5876543210"],
      ["address", "too short"],
      ["area", ""],
    ];
    for (const [field, value] of cases) {
      const result = checkoutFormSchema.safeParse({ ...base, [field]: value });
      expect(result.success, `${field} should reject "${value}"`).toBe(false);
      if (!result.success) {
        const errors = toFieldErrors(result.error);
        expect(errors[field], `${field} should report an error message`).toBeTruthy();
      }
    }
  });

  test("quotation marks and Devanagari free text are accepted without breaking", () => {
    const result = checkoutFormSchema.safeParse({
      ...base,
      customerName: "Ravi “Bhai” Kumar",
      instructions: "गेट के पास कॉल करें",
    });
    expect(result.success).toBe(true);
  });

  test("order payload requires at least one line", () => {
    const result = orderPayloadSchema.safeParse({ ...base, lines: [], expectedSubtotalPaise: 0 });
    expect(result.success).toBe(false);
  });
});

test.describe("Server-side order verification", () => {
  const lines = [buildCartLine(biryani, defaultSelection(biryani), 1)];
  const payload = {
    customerName: "Ravi Kumar",
    phone: "9876543210",
    address: "Flat 4B, Sai Residency, near Clock Tower, Karimnagar",
    area: "Mukaram Pura",
    instructions: "",
    fulfilment: "delivery" as const,
    lines: JSON.parse(JSON.stringify(lines)),
    expectedSubtotalPaise: cartSubtotal(lines),
  };

  test("accepts a legitimate order and recomputes the total itself", () => {
    const verifiedResult = verifyOrderPayload(payload);
    expect(verifiedResult.ok).toBe(true);
    if (verifiedResult.ok) {
      expect(verifiedResult.order.subtotalPaise).toBe(30000);
      expect(verifiedResult.order.reference).toMatch(/MR-\d{6}-[A-Z0-9]{4}/);
    }
  });

  test("rejects tampered client prices", () => {
    const tampered = JSON.parse(JSON.stringify(payload)) as typeof payload;
    tampered.lines[0].unitPricePaise = 1;
    tampered.lines[0].lineTotalPaise = 1;
    tampered.expectedSubtotalPaise = 1;

    const result = verifyOrderPayload(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.error).toMatch(/price/i);
    }
  });

  test("rejects an item that is not on the menu", () => {
    const tampered = JSON.parse(JSON.stringify(payload)) as typeof payload;
    tampered.lines[0].itemId = "not-a-real-item";
    const result = verifyOrderPayload(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(422);
  });

  test("rejects an unavailable dish", () => {
    const unavailable = getMenuItems().find((item) => !item.availability.available)!;
    const line = buildCartLine(unavailable, defaultSelection(unavailable), 1);
    const result = verifyOrderPayload({
      ...payload,
      lines: [JSON.parse(JSON.stringify(line))],
      expectedSubtotalPaise: line.lineTotalPaise,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });

  test("rejects an unknown option choice", () => {
    const tampered = JSON.parse(JSON.stringify(payload)) as typeof payload;
    tampered.lines[0].selections.push({
      groupId: "portion",
      groupLabel: "Portion",
      choiceIds: ["gigantic"],
      choiceLabels: ["Gigantic"],
      priceDeltaPaise: 0,
    });
    const result = verifyOrderPayload(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(422);
  });

  test("rejects a subtotal that does not match the recomputed total", () => {
    const result = verifyOrderPayload({ ...payload, expectedSubtotalPaise: 12345 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });
});

test.describe("Order lifecycle", () => {
  test("moves forward through the kitchen, and never backwards", () => {
    expect(nextStatus.pending).toBe("accepted");
    expect(canTransition("pending", "accepted")).toBe(true);
    expect(canTransition("pending", "rejected")).toBe(true);
    expect(canTransition("delivered", "preparing")).toBe(false);
    expect(canTransition("cancelled", "accepted")).toBe(false);
    expect(canTransition("accepted", "delivered")).toBe(false);
  });

  test("every status is reachable and terminal states are closed", () => {
    for (const status of ORDER_STATUSES) {
      expect(statusTransitions[status]).toBeDefined();
    }
    expect(statusTransitions.delivered).toEqual([]);
    expect(statusTransitions.rejected).toEqual([]);
    expect(statusTransitions.cancelled).toEqual([]);
  });
});

test.describe("Configuration safety", () => {
  test("an unset or invalid order mode always falls back to preview", () => {
    const configured = process.env.NEXT_PUBLIC_ORDER_MODE;
    const valid = configured === "whatsapp" || configured === "online" || configured === "preview";

    // A concept build must never be able to transmit a real order by accident.
    if (!valid) {
      expect(orderMode).toBe("preview");
    } else {
      expect(orderMode).toBe(configured);
    }
    expect(["preview", "whatsapp", "online"]).toContain(orderMode);
  });
});
