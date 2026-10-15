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

## 6. The reported hydration warning — cause, fix and how to re-check it

**Reported:** `A tree hydrated but some attributes of the server rendered HTML didn't match the client
properties`, pointing at `<RootLayout><html …>` with `- data-intro="skip"`.

**Cause.** A pre-paint `<script>` in the root layout wrote `data-intro` onto `<html>` for two cases:
the visitor had already seen the intro in this session, or their OS asks for reduced motion. React
never renders that attribute, so on those visits the DOM carried an attribute the client props did
not — React reports it and, because it never patches attributes during hydration, the attribute kept
working. The mismatch was real but harmless; the noise (and the dev overlay) was not.

**Fix, at the source.**
- `prefers-reduced-motion` is now handled **purely in CSS** (`src/app/globals.css`), so that gate
  needs no script, no storage read and no DOM write at all — and it now works with JavaScript off.
- The session gate keeps its pre-paint attribute, because it is what makes the first paint *be the
  film* instead of a flash of the hero. That single attribute is declared with React's documented
  escape hatch, scoped to `<html>` only (`suppressHydrationWarning` in `src/app/layout.tsx`, with the
  reason inline). It covers that element's own attribute diff; child mismatches still surface.
- **The alternative we did not take:** reading a cookie in the root layout so the server renders the
  attribute. That is fully deterministic but forces every route to render dynamically. Today `/`,
  `/checkout`, `/contact` and the policy pages are statically prerendered (`next build` output), and
  `/` is the page the cinematic opening depends on — so this is a decision for Maitri/production, not
  a silent change. Say the word and it can be switched.

**How to re-check it:**
1. `npm run test:hydration` (dev server running on :3000) — loads the real server HTML, executes the
   real client bundles, asserts React actually attached, and runs two must-fail controls. Any
   hydration warning fails the run.
2. In a browser: visit `/`, let the intro finish, then reload — or enable OS reduced motion and load
   the page. Neither case should log a hydration error in the console.
3. Production check: `npm run build && npx next start -p 3100`, then
   `node scripts/hydration-check.mjs http://127.0.0.1:3100/ --prod`.

**Known limits of that harness:** it is a DOM simulation, not a browser. It detects attribute-level
hydration mismatches (verified by its controls) but React does not surface *text-node* mismatches in
this environment, so text differences are not covered; and React's dev-only diff is not emitted in
every realm, which is why the harness warms up first and treats "any warning in any attempt" as
failure. Real-browser console checks on the preview and on a phone are still part of the pre-launch
list below.

## 7. Chapter numbering

One spine numbers the whole page, and the nav, the section labels and the film all use it:
`01` hero · `02` the kitchen · `03` the plate · `04` menu · `05` favourites · `06` ordering ·
`07` delivery · `08` beyond delivery. The nav jumps `02 → 04` because scene `03` is reached inside
the story section. Edit the numbers in `src/lib/content/site.ts` (`nav`) and the matching
`*.micro` strings in the same file — they are meant to move together.

## 8. Open technical items before production

- Run the Playwright suite against the deployed preview and against a real Android device.
- Verify WebGL quality and frame stability on a low-end Android phone (the scene scales itself via
  `getDeviceProfile()`, but it has not been measured on real hardware).
- Measure Core Web Vitals on the production deployment — **no performance score has been claimed**.
- Add rate limiting backed by a shared store (the current limiter is in-memory per instance).
- Decide the notification channel and add its secret; confirm the webhook is retried on failure.

## 9. Hero art direction (single source of truth)

The hero's composition, lighting, materials and motion budget live in
`src/lib/three/hero-rig.ts`. Nothing in the hero hard-codes them:

- `HERO_COMPOSITION` — panel box per canvas width (`topFrac`, `bottomFrac`,
  `widthFrac`, `centerXFrac`), interpolated by `resolveCompositionPoint`.
- `resolveHeroLayout(width, height)` — the panel box in canvas pixels, resolved
  from the **R3F canvas box**, so an embedded preview composes from its own size.
  `mode` flips to `side` at 768px.
- `PANEL_CROP` / `PANEL_ASPECT` / `BACKDROP_OPACITY` — which part of
  `dish-plated.jpg` is the subject, and how far the wide backdrop is dimmed.
- `HERO_LIGHTS`, `HERO_MATERIALS`, `HERO_MOTION`, `HERO_PANEL_REVEAL`.
- `resolvePanelTransform(layout, w, h, HERO_CAMERA)` — the panel's world
  transform, consumed by `HeroScene.tsx`.

How to change things:

- Different dish photo: replace `public/images/hero/dish-plated.jpg`, then
  re-measure the crop and update `PANEL_CROP` (the crop is expressed as source
  fractions, not pixels).
- Bigger/smaller plate, different framing: edit `HERO_COMPOSITION`. The CSS
  fallback panel re-derives from the same table at render time, so both layers
  move together.
- Brighter/darker food: edit `HERO_LIGHTS` (key/rim/fill/exposure) and
  `HERO_MATERIALS`. The dish panel itself is deliberately **not** tone-mapped
  (`toneMapped={false}`) so the WebGL plate matches the CSS fallback pixel for
  pixel; lit surfaces (table, steam) still are.
- Motion: `HERO_MOTION` is the whole budget (plate yaw ±1.4°, pointer
  ±0.8°/±0.5°, camera drift, scroll rise/dolly, steam and mote counts/opacity).
  GSAP owns scroll position, R3F owns scene motion, Framer Motion owns UI, CSS
  owns hover/focus — one owner per property.

Verification available in-repo:

- `npx tsx scripts/hero-projection-check.mjs` — projects the 3D panel through the
  real camera and compares it against the CSS fallback box at 11 viewports.
  Current result: worst delta 0.00px, panel faces the camera everywhere.
- `npm run test:hydration` — hydration gate (see §6).
- Panel painting is shared: `paintHeroPanel()` in
  `src/lib/three/panelPainting.ts` renders the WebGL texture **and** is mirrored
  by the CSS fallback's crop/feather, so the first paint and the cross-fade agree.

Known limitation: the sandbox this work was done in has no browser or GPU
(`next dev` + jsdom only), so the WebGL layer's *pixels* could not be captured.
Composition and geometry were verified numerically (projection check + served
CSS agreement within 2px); the lighting/material appearance needs one visual
pass in a real browser. Do not run `next build` while `next dev` is running —
both use `.next`, and the production build corrupts the dev server's client
manifest (chunk 404s, "React Client Manifest" errors).

## 10. Site-wide motion system (owners, hooks, how to extend)

One library owns one property, everywhere. The audit that produced this split
found the site animating the *same* CSS transform from three different systems
(Framer `whileInView` on cards, GSAP `data-reveal` on their wrappers, and CSS
transitions on hover) — which is why reveals felt uneven.

| Owner | Animates | Where the code lives |
| --- | --- | --- |
| GSAP + ScrollTrigger | scroll-linked timelines, section entrances, image curtains, rule/line draws, the favourites rail, sequencing | `src/lib/motion/gsap.ts` |
| React Three Fiber | hero scene: camera, materials, steam, spice motes, light | `src/components/three/HeroScene.tsx`, `SteamParticles.tsx` |
| Framer Motion | UI *state*: menu filter swaps, cart lines, dialogs/drawers, dialogs' badges | `MenuExplorer`, `OrderProcessSection`, `CartDrawer`, `ItemDialog` |
| CSS | hover/focus/press, the link underline draws, static layout, reduced-motion fallbacks | component class names, `globals.css` |

### The hooks

- `useSectionEntrance({ start, delay, beats })` — a section's choreography:
  eyebrow → headline (masked words) → support → furniture → CTA (secondary CTA)
  → closing line. Beats are markup-driven (`data-beat="support"`), so a section
  omits a beat without shifting the others. Beat offsets live in
  `beat` in `src/lib/motion/tokens.ts`.
- `useImageReveal({ direction, scrub })` — clip-path curtain on the *frame* plus
  a 1.04–1.08 scale settle on the *image*. Two elements, two properties, never
  two owners.
- `useLineDraw({ axis, scrub })` — draws `[data-line-draw]` rules.
- `useScrubTimeline(build, opts)` — a section-authored scrubbed timeline with
  `invalidateOnRefresh` and `gsap.context` cleanup.
- `useSectionReveal` / `useHeadlineReveal` — the original reveal system, kept for
  sections that need no choreography.

### The rules this codebase now enforces

1. **Nothing is hidden in CSS or in server HTML.** Initial states are set by GSAP
   at the moment it registers the trigger, so a JS failure cannot strand a
   section at `opacity: 0`. Framer components that animate on mount use
   `initial={false}` (see `MenuExplorer`) for exactly this reason.
2. **One refresh.** `ScrollTrigger.refresh()` is funnelled through
   `refreshScrollTriggers()` (debounced). Don't call it per component.
3. **Everything is scoped and reverted.** `gsap.context()` + `split.revert()` on
   unmount; persistent tweens are killed. Mount/unmount/remount must be clean.
4. **No blanket `will-change`.** GSAP promotes what it animates and releases it.
5. **Reduced motion short-circuits every hook** — content is simply present, and
   `MotionConfig reducedMotion="user"` covers Framer.

### Verifying motion in a browser

`E2E_CHROMIUM_PATH=/tmp/chromium LD_LIBRARY_PATH=/tmp/nssroot/lib npm run test:e2e`
runs Playwright against a bundled Chromium with software WebGL (see §11). Two
caveats are worth knowing before you read a failure:

- **Software rendering stretches wall-clock time.** A 0.9s entrance can take
  several seconds, so "element is not yet visible" right after a scroll is
  usually mid-flight, not stranded. Wait for the console/page to settle before
  concluding anything.
- **Playwright's parallel workers get OOM-killed on a 2-core host.** Use
  `--workers=1` there; the intro's wall-clock release valve
  (`INTRO_MAX_MS` in `IntroOverlay.tsx`) exists for the same class of device.

## 11. Running a browser in this sandbox (no apt, no downloadable binaries)

`npx playwright install` cannot download here, and Debian's repositories are not
reachable, so the verification browser is assembled from what *is*:

1. `npm i @sparticuz/chromium` (npm) → bundles a Chromium binary; extract with
   `chromium.executablePath()` (lands at `/tmp/chromium`).
2. That binary needs `libnspr4.so`, `libnss3.so`, `libnssutil3.so`. Neither apt
   nor PyPI nor npm ships them, so they are **built from source**: clone
   `mozilla/nspr` + `mozilla/nss` (github.com is reachable) and run
   `nss/build.sh -o --opt --disable-tests`. Its `dist/Release/lib` then provides
   all needed `.so` files (see `/tmp/browser/build-nss2.sh`).
3. Point Playwright at both via `E2E_CHROMIUM_PATH` and `LD_LIBRARY_PATH`.

This yields real WebGL through SwiftShader (`ANGLE … SwiftShader`), which is how
the hero's light-spill halo was found and fixed — something no 2D compositor or
headless DOM check can show.

