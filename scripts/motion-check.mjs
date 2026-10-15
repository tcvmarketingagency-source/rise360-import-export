/**
 * Motion / composition check — one browser, one page, one viewport at a time.
 *
 * A deliberately low-resource companion to the Playwright suite: it can run
 * where a full parallel test run cannot (a 2-core host, a bundled Chromium, or
 * a container where Playwright's own browser download is unavailable). For each
 * viewport it walks the page and reports:
 *
 *   • elements still below 0.85 opacity after the page settles (stranded content)
 *   • horizontal overflow and clipped headings
 *   • favourites-rail behaviour at that width (pinned vs native snap)
 *   • menu filtering, the empty state, reset and a cart round-trip
 *   • the preview-mode order API status (must stay 403)
 *   • console errors
 * and writes screenshots alongside the report.
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:3000 node scripts/motion-check.mjs 1440x900,390x844
 *   REDUCED=1 ... node scripts/motion-check.mjs 390x844      # prefers-reduced-motion
 *   NO3D=1    ... node scripts/motion-check.mjs 1440x900     # WebGL fallback path
 *   OUT_DIR=/tmp/shots  SHOT=1                                # screenshots on
 *
 * Chromium: uses Playwright's own browser by default. Set CHROMIUM_PATH (and
 * LD_LIBRARY_PATH if needed) to point at an external build — see HANDOFF.md §11.
 */
import { chromium as playwrightChromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
const externalChromium = process.env.CHROMIUM_PATH;
const chromiumModule = externalChromium
  ? null
  : await import("/tmp/browser/node_modules/@sparticuz/chromium/build/index.js").catch(() => null);

const OUT = process.env.OUT_DIR ?? "/tmp/motion-check";
mkdirSync(OUT, { recursive: true });
const VIEWPORTS = (process.argv[2] ?? "1440x900,1280x800,1024x768,786x714,390x844,360x800")
  .split(",")
  .map((s) => s.split("x").map(Number));

/**
 * Launch with whatever Chromium this host has: `CHROMIUM_PATH` if set, otherwise
 * the bundled build. `@sparticuz/chromium` is optional, so a missing module must
 * not be dereferenced (that bug made the documented CHROMIUM_PATH usage crash).
 */
const browser = await playwrightChromium.launch({
  executablePath: externalChromium ?? undefined,
  args: [...(chromiumModule?.args ?? []), "--no-sandbox", "--disable-dev-shm-usage", "--js-flags=--max-old-space-size=1024"],
  chromiumSandbox: false,
});

const report = [];
const context = await browser.newContext({
  reducedMotion: process.env.REDUCED === "1" ? "reduce" : "no-preference",
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);

for (const [W, H] of VIEWPORTS) {
  await page.setViewportSize({ width: W, height: H });
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 200)));

  const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
  const url = process.env.NO3D === "1" ? `${base}/?no3d=1` : `${base}/`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });

  // Intro: skip it the way a visitor would (or let the safety release fire).
  await page.waitForTimeout(2500);
  const skip = page.getByTestId("intro-skip");
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.waitForTimeout(1500);

  const shot = async (name) => {
    if (process.env.SHOT !== "1") return;
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${OUT}/${name}-${W}x${H}.png`, Buffer.from(data, "base64"));
  };

  await shot("hero");

  // Walk the page so every scroll-triggered entrance has fired.
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 140));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 600));
  });
  // Software rendering stretches wall-clock time: a 0.9s entrance can take
  // several seconds here, so give the page a quiet window before judging.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 5000)));

  // Anything still invisible after a full scroll would be a stranded element.
  const invisible = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        "[data-reveal],[data-reveal-child],[data-beat],[data-card-line],[data-image-reveal],[data-menu-card],[data-delivery-row],[data-order-step],[data-entrance-extra],[data-entrance-nested],[data-scene-act],[data-scene-headline],[data-scene-support],[data-scene-marker]",
      ),
    )
      .filter((node) => {
        const style = getComputedStyle(node);
        const opacity = Number.parseFloat(style.opacity);
        const hidden = style.visibility === "hidden" || style.display === "none";
        return !hidden && opacity < 0.85;
      })
      .map((node) => (node.textContent ?? "").trim().slice(0, 40)),
  );

  const layout = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const clipped = Array.from(document.querySelectorAll("h1, h2, h3"))
      .filter((h) => {
        const r = h.getBoundingClientRect();
        return r.width > 0 && (r.left < -1 || r.right > viewport + 1);
      })
      .map((h) => (h.textContent ?? "").slice(0, 30));
    return {
      overflow: document.documentElement.scrollWidth - viewport,
      clipped,
      height: document.body.scrollHeight,
    };
  });

  await shot("final-section");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);
  await shot("hero-return");

  // Interactions — only at the primary desktop and mobile widths.
  let interactions = null;
  if ((W === 1440 || W === 390) && !process.env.REDUCED && !process.env.NO3D) {
    interactions = {};
    // menu filter
    await page.locator("#menu").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const before = await page.getByTestId("menu-card").count();
    await page.getByTestId("menu-search").fill("dosa");
    await page.waitForTimeout(700);
    interactions.searchFilter = { before, after: await page.getByTestId("menu-card").count() };
    await page.getByTestId("menu-search").fill("zzzz-no-such-dish");
    await page.waitForTimeout(700);
    interactions.emptyState = await page.getByTestId("menu-empty").isVisible();
    await page.getByRole("button", { name: /reset|show all|clear/i }).first().click().catch(() => {});
    await page.getByTestId("menu-search").fill("");
    await page.waitForTimeout(700);
    interactions.afterReset = await page.getByTestId("menu-card").count();
    // cart
    const addButton = page.getByTestId("menu-card-add").first();
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);
      interactions.cartCount = await page.getByTestId("cart-count").textContent().catch(() => null);
    }
    // order preview safety — the API must keep refusing in preview mode
    interactions.orderApiStatus = await page.evaluate(async () => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: [] }),
      });
      return response.status;
    });
  }

  // Favourites rail behaviour at this width.
  const rail = await page.evaluate(async () => {
    const track = document.querySelector("[data-testid=favourites-rail]");
    if (!track) return null;
    const scrollable = track.scrollWidth > track.clientWidth + 4;
    const overflowX = getComputedStyle(track).overflowX;
    return { scrollable, overflowX, cards: track.querySelectorAll("article").length };
  });

  const entry = { viewport: `${W}x${H}`, invisible, layout, interactions, rail, errors: errors.slice(0, 5) };
  report.push(entry);
  printEntry(entry);
}

function printEntry(entry) {
  console.log(`\n─── ${entry.viewport} ───`);
  console.log(`  stranded-invisible elements: ${entry.invisible.length ? entry.invisible.join(" | ") : "none"}`);
  console.log(`  overflow: ${entry.layout.overflow}px · clipped headings: ${entry.layout.clipped.length ? entry.layout.clipped.join(" | ") : "none"} · page height ${entry.layout.height}`);
  if (entry.rail) console.log(`  favourites rail: ${entry.rail.cards} cards, overflow-x ${entry.rail.overflowX}, scrollable ${entry.rail.scrollable}`);
  if (entry.interactions) console.log(`  interactions: ${JSON.stringify(entry.interactions)}`);
  console.log(`  console errors: ${entry.errors.length ? entry.errors.join(" | ") : "none"}`);
}
console.log(`\nscreenshots in ${OUT}`);
await browser.close();
