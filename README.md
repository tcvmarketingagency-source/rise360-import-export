# Maitri Residency — Cinematic Restaurant & Food-Delivery Experience

A premium, cinematic concept experience for **Maitri Residency / Hotel Maitri, Karimnagar, Telangana**:
a film-like introduction that becomes a practical ordering product the moment a visitor wants to buy.

> **This is a private concept build, not Maitri Residency's official website.**
> Menu items, prices, delivery areas, charges and timings shown here are clearly labelled
> placeholders. In the default configuration **no order is transmitted, no message is sent and no
> payment is taken.** See [`HANDOFF.md`](./HANDOFF.md) for everything the restaurant must approve
> before launch.

---

## 1. Creative direction

**From Maitri's kitchen to your doorstep.**

The visual story follows one meal: `INGREDIENTS → KITCHEN CRAFT → THE PLATE → THE MENU → THE ORDER → THE DOORSTEP`.

| | |
|---|---|
| Palette | Deep warm black + charcoal, ivory and bone surfaces, controlled amber / turmeric / chilli / herb accents |
| Type | Variable serif display (Fraunces) with Inter Tight for UI and JetBrains Mono for technical micro-labels |
| Texture | Warm directional studio light, soft contact shadows, CSS film grain, controlled negative space |
| Motion | Slow deliberate reveals for the story, crisp short transitions for menu and cart actions |

The food photography is real editorial imagery, and every dish whose photograph has not been produced
yet renders an **explicitly labelled** placeholder frame (`PHOTOGRAPHY PENDING — replace with Maitri's
own photography`) at the exact path the real photo will occupy.

---

## 2. Stack

- **Next.js 15** (App Router), React 19, TypeScript strict (`noUncheckedIndexedAccess` on)
- **Tailwind CSS 4** with design tokens in `src/app/globals.css`
- **Three.js / React Three Fiber / drei** for the hero scene (client-only, lazily mounted)
- **GSAP + ScrollTrigger** for the scroll narrative
- **Framer Motion** for interface state (drawers, dialogs, filters, adds)
- **Lenis** for smooth scrolling on desktop pointers only
- **Zod** for validation shared between client and server
- **Supabase** (optional) for persistent orders, staff auth and menu management
- **Playwright** for e2e, responsive, motion and domain tests
- **Vercel** for deployment

### Animation architecture (one owner per property)

| Concern | Owner |
|---|---|
| Scroll position | Lenis, feeding `ScrollTrigger.update` |
| Scroll narrative: pinning, scene reveals, rail, journey line | GSAP + ScrollTrigger |
| Hero 3D: camera, materials, steam, light | React Three Fiber frame loop |
| Interface state: drawer, dialog, filter, add-to-cart | Framer Motion |
| Hover, focus, underline, grain | CSS |

The WebGL frame loop never listens to scroll: `ScrollTrigger` writes into a mutable bridge
(`src/lib/three/scrollBridge.ts`) and the render loop only reads it — no React re-renders per frame.
The hero copy's entrance animates `yPercent` while pointer parallax animates `y`, so the two systems
never fight over the same transform channel.

---

## 3. Getting started

```bash
npm install
cp .env.example .env.local     # variable names only — no secrets in this repo
npm run dev                    # http://localhost:3000
```

Useful scripts:

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` in strict mode |
| `npm run test:e2e` | Playwright: e2e + responsive + motion + domain |
| `npm run test:e2e -- --project=unit` | Domain tests only (no browser needed) |
| `npm run test:e2e -- --project=mobile-390` | One device profile |
| `node scripts/build-assets.mjs` | Normalise photography + derive hero and story crops |
| `node scripts/make-placeholders.mjs` | Generate labelled placeholder frames for pending photography |
| `npm run db:apply` | Print the Supabase migration status for a project |

### QA shortcuts

| URL | Effect |
|---|---|
| `/?no3d=1` | Force the photographic hero (WebGL fallback path) |
| `/?force3d=1` | Force the 3D scene when WebGL is available |
| `sessionStorage` key `maitri.intro.v2` | Set to `done` to skip the intro; clear it to replay |

---

## 4. Configuration

Everything customer-facing is configuration, not code.

| File | Controls |
|---|---|
| `src/lib/config/business.ts` | Verified public facts (address, delivery line, socials) and the list of details still awaiting confirmation |
| `src/lib/config/order.ts` | **Order mode**, capabilities (delivery pricing, taxes, pickup, payments, admin), preview banner, sample-content flags |
| `src/lib/content/site.ts` | Every headline, paragraph, CTA label and section micro-label |
| `src/lib/motion/tokens.ts` | Durations, easings, staggers, ScrollTrigger defaults |
| `src/lib/menu/sample-menu.ts` | The authored sample menu (all entries flagged `demo: true`) |

### Order modes

Set `NEXT_PUBLIC_ORDER_MODE`:

| Mode | Behaviour | Transmits? |
|---|---|---|
| `preview` **(default)** | Full journey — menu, cart, checkout, reviewed summary — stops at a finalised summary step. Nothing leaves the browser. | No |
| `whatsapp` | Builds the reviewed summary, then opens WhatsApp or the dialler to **+91 89850 51111**. The site states clearly that the order is confirmed by the restaurant, not by opening a chat. | On customer action |
| `online` | Server-validated orders stored in Supabase with a unique reference and a staff status workflow. Requires Supabase variables. | Yes |

An unset or invalid value always resolves to `preview`.

### Money rules

All amounts are integer **paise**. The pricing engine (`src/lib/cart/pricing.ts`) returns `null` for
any component the restaurant has not configured, and the UI renders *"to be confirmed"* instead of
inventing a number. There are no fabricated discounts, no fake scarcity, and no simulated payments.
The server (`src/lib/orders/server.ts`) re-derives every price from its own menu data and rejects a
tampered payload with a 409.

---

## 5. The ordering journey

1. **Menu explorer** — search, category filters, dietary filters, availability states, item dialog
   with sample option groups, quantity selector, add to cart.
2. **Cart drawer** — add, remove, increase, decrease, subtotal, clear-with-confirmation, empty state.
3. **Checkout** — mobile-first form (name, phone, address, locality, optional instructions) with Zod
   validation, per-field errors, focus sent to the first invalid field.
4. **Review** — the exact text that would be sent, including reference, items, options, totals and
   delivery details, plus the honest statement of what happens next.
5. **Handoff** — in preview mode the journey ends with a clearly labelled "not sent" state. In
   `whatsapp` mode it opens the reviewed draft. In `online` mode it stores the order and shows the
   reference with a *Pending* status.

**Customer data:** the cart lives in `localStorage` on the customer's own device. Nothing is stored on
a server unless `online` mode is configured.

---

## 6. Admin foundation (optional)

`/admin` is a server-gated staff area. With no Supabase configuration it renders a setup panel
explaining exactly what to supply — it never fakes a logged-in session.

With Supabase configured it provides:

- **Orders board** with status filters and the lifecycle `pending → accepted → preparing → ready/
  dispatched → delivered`, plus reject/cancel. Illegal transitions are refused server-side.
- **Menu manager** — edit price, publish/unpublish, mark temporarily unavailable, mark dietary
  classifications as verified.
- **Delivery & service settings** — delivery charge, minimum order, free-delivery threshold, payment
  methods and announcement copy. Empty means "not confirmed", never ₹0.

Authorization is enforced twice: `requireStaff()` in every API route and Row Level Security in
`supabase/migrations/0001_init.sql`. Customers can read published menu content only.

### Setting up Supabase (Mode B)

```bash
# 1. Create a project, then apply the schema:
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init.sql
#    (or paste it into the Supabase SQL editor)

# 2. Add to .env.local:
#    NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. Invite staff in Supabase Auth, then grant each one a role:
#    insert into public.staff_profiles (user_id, full_name, role)
#    values ('<auth user id>', 'Manager name', 'manager');

# 4. Switch on persistent ordering:
#    NEXT_PUBLIC_ORDER_MODE=online
```

To serve the live menu instead of sample content, wire `fetchPublishedMenu()` from
`src/lib/menu/supabase-source.ts` into `getMenu()` in `src/lib/menu/index.ts` (the file documents the
exact snippet).

Razorpay is deliberately **not** implemented: keys must be supplied and authorised first, must live
server-side only, and no payment is ever simulated.

---

## 7. Testing

```bash
npm run test:e2e                                   # everything, all profiles
npm run test:e2e -- --project=unit                 # domain logic (no browser)
npm run test:e2e -- --project=desktop-chromium
npm run test:e2e -- --project=mobile-360 --project=mobile-390
npm run test:e2e -- --project=reduced-motion
E2E_BASE_URL=https://<preview-url> npm run test:e2e # against a deployment
```

Covered:

- **Domain** (`tests/unit/domain.spec.ts`, 27 tests): cart arithmetic, option deltas, line merging,
  quantity caps, pricing nulls, server-side price re-derivation, tampered-payload rejection,
  unavailable-item rejection, order reference format, WhatsApp message formatting and encoding, Zod
  validation (including Devanagari and typographic quotes), order lifecycle transitions, and the
  configuration fallback rule.
- **e2e**: homepage structure and CTAs, intro skip and non-replay, menu search/filters/empty state,
  cart operations and totals, checkout validation and preview-mode safety, WhatsApp formatting,
  boundary anchors, no overflowing layout at 360/390/768/1024/1440 px, touch-target sizes, keyboard
  and focus behaviour, reduced-motion completeness, WebGL fallback, SEO and structured data,
  robots/sitemap, admin protection.

### Manual checks still required before launch

A headless browser could not be installed in the build sandbox, so these are **not** yet verified and
must be checked on a real device: WebGL rendering quality on low-end Android, Lenis smooth-scroll feel
on desktop trackpads and mice, real-device touch behaviour on the item dialog, and Core Web Vitals on
a production deployment. No performance score should be claimed until that run happens.

---

## 8. Performance and accessibility

- Self-hosted variable fonts, subset to Latin, preloaded — no third-party font requests.
- Photography is normalised and compressed by `scripts/build-assets.mjs`; Next/Image serves AVIF/WebP
  with explicit `sizes`, and every card has a colour-matched surface behind it so nothing shifts.
- The WebGL scene mounts only after first paint (idle callback), only when WebGL is available, and
  pauses when the hero leaves the viewport or the tab is hidden. Device profiling scales DPR, particle
  counts and geometry segments.
- A photographic poster layer is always rendered underneath the scene: WebGL failure or `?no3d=1`
  still gives a complete first impression.
- Semantic landmarks, one `h1` per page, labelled inputs, `aria-live` for the cart toast, focus trap
  and Escape handling in dialogs, visible focus rings, 44 px+ touch targets, and a skip link.
- `prefers-reduced-motion` removes the intro, all scroll pinning and every reveal — content is never
  hidden behind animation, and nothing is left at `opacity: 0` (verified by test).
- Keyboard users get the same journey: filters, dialogs, drawers, quantity steppers and checkout.

---

## 9. SEO

Metadata, canonical URL, Open Graph card (generated at build time), sitemap, structured data and a
`robots.txt` that currently **disallows everything** — an unfinished concept build must not compete
with the restaurant's real public presence. Flip `previewBanner.enabled` in `src/lib/config/order.ts`
to `false` once the domain is approved, and set `NEXT_PUBLIC_SITE_URL` to publish the production
rules. Structured data uses verified facts only; there are no ratings, price ranges or awards.

---

## 10. Deployment

1. Push the branch and import the repository in Vercel (framework preset: Next.js).
2. Set environment variables from `.env.example` — keep `NEXT_PUBLIC_ORDER_MODE=preview` for the
   review deployment.
3. Deploy. Vercel previews are the right vehicle for sending Maitri a link to review.
4. Only after written approval: set the production domain, switch the order mode, and turn indexing on.

---

## 11. Handoff

[`HANDOFF.md`](./HANDOFF.md) is the checklist of every business fact and integration Maitri must
approve before launch — menu, prices, dietary classifications, delivery areas and charges, hours,
taxes, payment methods, contact reconciliation, assets, policies, notification channel and domain.
The same list is rendered at `/handoff` for review with the client.
