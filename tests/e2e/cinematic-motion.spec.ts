import { expect, test } from "@playwright/test";
import { openSite } from "./helpers";

/**
 * Cinematic-motion acceptance.
 *
 * These are the checks that protect the *page-wide* choreography: that nothing
 * is stranded invisible, that every section actually animates in, that the
 * menu's results swap cleanly, that the favourites rail behaves per breakpoint,
 * and that preview-mode order safety survives all of it.
 *
 * Timing is intentionally generous. Entrance timelines are driven by
 * requestAnimationFrame, so on a software-rendered or single-core machine a
 * 0.9s reveal can take several seconds of wall-clock time — a "still hidden"
 * assertion is only meaningful once the page has gone quiet.
 */

/**
 * Waits until the page has stopped changing opacity for a moment.
 *
 * The watched set is exactly the set the acceptance sweep judges: a narrower set
 * reported "quiet" while a section that was not in it was still entering, which
 * made the sweep read mid-flight opacities. A genuinely stranded element holds a
 * constant opacity, so it still contributes no change here and is still caught
 * by the assertion.
 */
async function settle(page: import("@playwright/test").Page, quietMs = 1_500, selector?: string) {
  await page.evaluate(
    async ({ quiet, sel }) => {
      let last = -1;
      let stableFor = 0;
      const step = 150;
      while (stableFor < quiet && stableFor < 15_000) {
        await new Promise((resolve) => setTimeout(resolve, step));
        const nodes = document.querySelectorAll<HTMLElement>(
          sel ?? "[data-beat],[data-card-line],[data-menu-card],[data-image-reveal]",
        );
        let sum = 0;
        for (const node of nodes) sum += Number.parseFloat(getComputedStyle(node).opacity) || 0;
        if (Math.abs(sum - last) < 0.001) stableFor += step;
        else stableFor = 0;
        last = sum;
      }
    },
    { quiet: quietMs, sel: selector },
  );
}

const ANIMATED = [
  "[data-beat]",
  "[data-card-line]",
  "[data-menu-card]",
  "[data-image-reveal]",
  "[data-delivery-row]",
  "[data-order-step]",
  "[data-scene-act]",
  "[data-scene-headline]",
  "[data-scene-support]",
  "[data-scene-marker]",
  "[data-entrance-extra]",
  "[data-entrance-nested]",
].join(",");

test.describe("Cinematic motion", () => {
  test("every animated section reaches full opacity — nothing is stranded", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openSite(page);

    // Walk the whole page so every scroll-triggered timeline has fired.
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.6);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
    });
    await settle(page, 1_500, ANIMATED);

    const stranded = await page.evaluate((selector) => {
      return Array.from(document.querySelectorAll<HTMLElement>(selector))
        .filter((node) => {
          const style = getComputedStyle(node);
          if (style.visibility === "hidden" || style.display === "none") return false;
          return Number.parseFloat(style.opacity) < 0.85;
        })
        .map((node) => (node.textContent ?? "").trim().slice(0, 40));
    }, ANIMATED);

    expect(stranded, `elements left below 0.85 opacity: ${stranded.join(" | ")}`).toEqual([]);
  });

  test("each section animates in as it is scrolled to", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openSite(page);

    for (const id of ["story", "menu", "favourites", "order", "delivery", "visit", "invitation"]) {
      const section = page.locator(`#${id}`);
      await section.scrollIntoViewIfNeeded();
      await expect(section, `#${id} should be visible`).toBeVisible();
      // The section's own micro label is a beat element in every section.
      const labels = section.locator("[data-beat], [data-entrance-extra]").first();
      if (await labels.count()) {
        await expect(labels, `#${id} should finish revealing`).toHaveCSS("opacity", "1", { timeout: 25_000 });
      }
    }
  });

  test("menu filtering keeps the grid readable and returns to the full list", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openSite(page);
    await page.locator("#menu").scrollIntoViewIfNeeded();

    const cards = page.getByTestId("menu-card");
    const initial = await cards.count();
    expect(initial).toBeGreaterThan(5);

    await page.getByTestId("menu-search").fill("dosa");
    await expect(cards).toHaveCount(1, { timeout: 15_000 });

    await page.getByTestId("menu-search").fill("zzz-nothing-matches");
    await expect(page.getByTestId("menu-empty")).toBeVisible({ timeout: 15_000 });

    // Every filter is reset from the empty state, and the whole menu returns.
    // The control's accessible name is the site copy, not the word "reset".
    await page
      .getByTestId("menu-empty")
      .getByRole("button", { name: /clear search/i })
      .click();
    await expect(cards).toHaveCount(initial, { timeout: 15_000 });
    await expect(page.getByTestId("menu-search")).toHaveValue("");
  });

  test("add to order updates the live summary without leaving the page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openSite(page);
    await page.locator("#menu").scrollIntoViewIfNeeded();

    const checkoutPrompt = page.getByTestId("order-summary-browse");
    await expect(checkoutPrompt).toBeVisible();

    await page.getByTestId("menu-card-add").first().click();
    await expect(page.getByTestId("order-summary-count")).toContainText("1 item", { timeout: 10_000 });
    await expect(page.getByTestId("order-summary-subtotal")).toContainText("₹");
    // The working checkout action appears — and must not be gated by animation.
    await expect(page.getByTestId("order-summary-checkout")).toBeVisible({ timeout: 10_000 });
  });

  test("order API stays in preview mode (403) while testing", async ({ page }) => {
    await openSite(page);
    const status = await page.evaluate(async () => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: [] }),
      });
      return response.status;
    });
    expect(status, "preview mode must refuse real orders").toBe(403);
  });
});

test.describe("Favourites rail", () => {
  test("desktop pins the rail and moves it with scroll, then releases", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openSite(page);

    const track = page.getByTestId("favourites-rail");
    // Scroll the section's top to the viewport top so the pin (start: "top top")
    // is genuinely engaged before measuring.
    await page.evaluate(() => {
      const section = document.getElementById("favourites");
      if (section) window.scrollTo(0, section.offsetTop);
    });
    await page.waitForTimeout(1500);

    const readX = () =>
      page.evaluate(() => {
        const node = document.querySelector<HTMLElement>("[data-testid=favourites-rail]");
        if (!node) return null;
        const transform = getComputedStyle(node).transform;
        if (!transform || transform === "none") return 0;
        const match = transform.match(/matrix3d\(([^)]+)\)|matrix\(([^)]+)\)/);
        if (!match) return 0;
        const values = (match[1] ?? match[2] ?? "").split(",").map(Number);
        return match[1] ? values[12] : values[4];
      });

    const startX = await readX();
    // Travel through the pinned region: the rail must move horizontally.
    for (let i = 0; i < 3; i += 1) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(700);
    }
    const movedX = await readX();
    expect(movedX).not.toBeNull();
    expect(Math.abs((movedX ?? 0) - (startX ?? 0))).toBeGreaterThan(40);

    // The last card must be reachable — no premature stop, no dead region.
    for (let i = 0; i < 10; i += 1) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(1500);
    const lastCardVisible = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-testid=favourites-rail] > *"));
      const last = cards[cards.length - 1];
      if (!last) return false;
      const rect = last.getBoundingClientRect();
      return rect.left < window.innerWidth && rect.right > 0;
    });
    expect(lastCardVisible, "the final rail card should be reachable").toBe(true);
    expect(await track.count()).toBe(1);
  });

  test("mobile keeps native horizontal scrolling instead of a pinned rail", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSite(page);
    await page.locator("#favourites").scrollIntoViewIfNeeded();

    const overflow = await page.evaluate(() => {
      const node = document.querySelector<HTMLElement>("[data-testid=favourites-rail]");
      return node ? getComputedStyle(node).overflowX : null;
    });
    expect(overflow).toBe("auto");

    // Swipe-free assertion: the track is genuinely scrollable, so touch users
    // can reach every card natively.
    const scrollable = await page.evaluate(() => {
      const node = document.querySelector<HTMLElement>("[data-testid=favourites-rail]");
      if (!node) return false;
      const before = node.scrollLeft;
      node.scrollLeft = before + 400;
      const moved = node.scrollLeft > before;
      node.scrollLeft = before;
      return moved;
    });
    expect(scrollable).toBe(true);
  });
});

test.describe("Reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("all animated content is present and fully opaque immediately", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openSite(page);

    const hidden = await page.evaluate((selector) => {
      return Array.from(document.querySelectorAll<HTMLElement>(selector))
        .filter((node) => Number.parseFloat(getComputedStyle(node).opacity) < 0.9)
        .map((node) => (node.textContent ?? "").trim().slice(0, 40));
    }, ANIMATED);

    expect(hidden, `hidden under reduced motion: ${hidden.join(" | ")}`).toEqual([]);
  });
});
