# Handoff — Maitri Residency concept experience

**Status:** private concept build. **Not** the restaurant's official website, and not to be presented
as one. No order has been transmitted, no message sent, no payment charged. The configuration shipped
in this repository is `NEXT_PUBLIC_ORDER_MODE=preview`, which cannot transmit anything.

Prepared for: **Maitri Residency / Hotel Maitri**, H.No. 2-8-266 & 267, beside Circus Grounds,
Mukaram Pura, Karimnagar – 505001, Telangana, India.

Delivery order line used in this build: **+91 89850 51111** — the number publicly posted by the
restaurant for food-delivery orders.

---

## 1. Verified facts used

These appear in the build as-is because they are publicly posted by the restaurant:

| Fact | Value |
|---|---|
| Brand | Maitri Residency / Hotel Maitri |
| Address | H.No. 2-8-266 & 267, beside Circus Grounds, Mukaram Pura, Karimnagar – 505001, Telangana |
| Food-delivery line | +91 89850 51111 |
| Instagram | https://www.instagram.com/maitriresidency/ |
| Existing website | https://www.maitriresidency.com/ |

Nothing else in the build is presented as confirmed. Menu items, prices, option groups, dietary
classifications, photography captions and delivery parameters are all placeholders.

---

## 2. Details to reconcile (conflicting or missing publicly)

| # | Item | Why it needs a decision |
|---|---|---|
| 1 | **Legacy contact numbers** on maitriresidency.com | They differ from the publicly posted delivery number. Confirm which numbers stay live, and whether calls and delivery orders share one line. |
| 2 | **Opening hours / kitchen cut-off** | Stated inconsistently across public channels. Needed before any delivery window, "open now" state or last-order time is displayed. |
| 3 | **Official menu, prices and portions** | The menu on this concept site is authored sample content, not Maitri's menu. |
| 4 | **Delivery areas, charges, minimums** | Radius, localities served, exclusions, delivery fee and minimum order are unconfirmed; the configuration deliberately holds these as empty so the UI says "to be confirmed". |

---

## 3. Approval checklist

### Menu and content
1. Official menu: item names, spellings, categories and groupings.
2. Prices for every item **and** every option (portion upgrades, add-ons) in rupees.
3. Vegetarian / non-vegetarian / egg classification for every item — written confirmation, so the
   "to confirm" labels can be replaced with verified marks.
4. Availability rules: always available, time-bound, seasonal; what customers are told when a dish
   runs out.
5. Long-form descriptions for each dish (the current copy is written to be safe and generic).
6. Official logo files (vector preferred) and approved brand colours and fonts.
7. Food photography — a shoot list is provided; placeholder frames in `public/images` are labelled and
   sit at the exact paths the real photographs will occupy.

### Delivery and service
8. Delivery areas: locality list or pincodes, plus exclusions.
9. Delivery charge, free-delivery threshold and minimum order value.
10. Delivery hours, last order time and holiday closures.
11. Whether pickup / counter collection is offered.
12. GST: whether taxes apply, at what rate, and the invoice format. No tax line is displayed until
    this is confirmed.
13. Payment methods: cash on delivery, UPI, or online. Online payment additionally requires an
    authorised Razorpay account; keys stay server-side and no payment is simulated in this build.
14. Confirmation of the primary order line, who answers it, and what happens outside service hours.

### Ordering operations
15. Choose the launch order mode: **Mode A** (WhatsApp/call assisted, works today with the public
    number) or **Mode B** (persistent online orders with a staff dashboard, requires a Supabase
    project).
16. For Mode B: who receives new-order notifications and through which approved channel (for example
    WhatsApp Business API or e-mail), plus a webhook URL and shared secret.
17. Staff accounts for the dashboard (one per person) and the role each should have: owner, manager or
    viewer.
18. Who may change prices, publish/unpublish items and mark items unavailable.
19. Expected order volume per day, so rate limits and notification channels are set sensibly.

### Legal, data and launch
20. Privacy notice approved (`/policies/privacy` is a draft), including retention period and how a
    customer requests correction or deletion of their data.
21. Order, cancellation, refund and delivery policy approved — including what happens if an item runs
    out, and if the rider cannot reach the address (`/policies/order-delivery` is a draft).
22. Production domain decision: whether the ordering experience replaces or sits beside
    maitriresidency.com, and the canonical URLs to use.
23. Analytics decision: whether any measurement runs, and what it may collect. None is enabled today.
24. Search indexing switched on only after approval (`robots.txt` currently disallows everything).

---

## 4. How to switch each part on

| To do this | Change |
|---|---|
| Replace the sample menu | Edit `src/lib/menu/sample-menu.ts`, or import rows into the Supabase `menu_items` / `menu_categories` tables and wire `fetchPublishedMenu()` into `getMenu()` |
| Replace placeholder photography | Drop the real files at the same paths under `public/images/`, then run `node scripts/build-assets.mjs` and delete the placeholder entry from `scripts/make-placeholders.mjs` |
| Turn on WhatsApp/call ordering | `NEXT_PUBLIC_ORDER_MODE=whatsapp` |
| Turn on persistent orders | Apply `supabase/migrations/0001_init.sql`, set the Supabase variables, then `NEXT_PUBLIC_ORDER_MODE=online` |
| Show delivery charges and taxes | Set the values in the staff dashboard (or `service_settings`) **and** enable `capabilities.deliveryPricing` / `capabilities.taxes` in `src/lib/config/order.ts` |
| Enable pickup | Only if Maitri offers it: `capabilities.pickup = true` |
| Allow search indexing | Set `previewBanner.enabled = false` and `NEXT_PUBLIC_SITE_URL` to the production domain |
| Update contact details | `src/lib/config/business.ts` feeds the header, footer, contact page, delivery section and structured data |

---

## 5. What this build deliberately does **not** do

- It does not claim online ordering, delivery availability, prices, offers, opening hours or delivery
  times are confirmed by the restaurant.
- It does not invent ratings, reviews, testimonials, awards, hygienic certificates, "best in
  Karimnagar" claims or customer statistics — and a test enforces that.
- It does not show discounts, fake scarcity or countdown timers.
- It does not display a delivery fee, tax line or minimum order that nobody approved.
- It does not claim that opening WhatsApp places an order, or that a submitted order is accepted.
- It does not fake a successful payment, and it contains no API keys, tokens or credentials.

## 6. Open technical items before production

- Run the Playwright suite against the deployed preview and against a real Android device.
- Verify WebGL quality and frame stability on a low-end Android phone (the scene scales itself via
  `getDeviceProfile()`, but it has not been measured on real hardware).
- Measure Core Web Vitals on the production deployment — **no performance score has been claimed**.
- Add rate limiting backed by a shared store (the current limiter is in-memory per instance).
- Decide the notification channel and add its secret; confirm the webhook is retried on failure.
