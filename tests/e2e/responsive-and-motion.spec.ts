import { expect, test } from "@playwright/test";
import { openSite } from "./helpers";

const widths = [360, 390, 768, 1024, 1440];

test.describe("Responsive layout", () => {
  for (const width of widths) {
    test(`no overflow or clipped headings at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 800 ? 740 : 900 });
      await openSite(page);

      // Walk the page so every section is laid out at this width.
      await page.evaluate(async () => {
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 90));
        }
      });

      const { overflow, clipped } = await page.evaluate(() => {
        const viewport = window.innerWidth;
        const clippedHeadings: string[] = [];
        for (const heading of Array.from(document.querySelectorAll("h1, h2, h3"))) {
          const rect = heading.getBoundingClientRect();
          if (rect.width > 0 && (rect.left < -1 || rect.right > viewport + 1)) {
            clippedHeadings.push(`${heading.tagName}: ${(heading.textContent ?? "").slice(0, 40)}`);
          }
        }
        return {
          overflow: document.documentElement.scrollWidth - viewport,
          clipped: clippedHeadings,
        };
      });

      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(2);
      expect(clipped, `clipped headings at ${width}px`).toEqual([]);
    });
  }

  test("touch targets are at least 44px on the primary mobile controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSite(page);
    await page.locator("#menu").scrollIntoViewIfNeeded();

    const targets = [
      page.getByTestId("cart-button"),
      page.getByTestId("menu-search"),
      page.locator('[data-testid="menu-card-add"]').first(),
    ];

    for (const target of targets) {
      const box = await target.boundingBox();
      expect(box, "control should be laid out").toBeTruthy();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("mobile navigation opens, navigates and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSite(page);

    await page.getByTestId("nav-open").click();
    const nav = page.getByTestId("mobile-nav");
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "Menu" }).click();
    await expect(nav).toBeHidden();
    await expect(page.locator("#menu")).toBeInViewport();
  });

  test("desktop navigation jumps between sections", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openSite(page);

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Delivery" }).click();
    await expect(page.locator("#delivery")).toBeInViewport();
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Menu" }).click();
    await expect(page.locator("#menu")).toBeInViewport();
  });

  test("persistent mobile order bar appears only once scrolling starts", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSite(page);

    await expect(page.getByTestId("mobile-order-bar")).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
    await expect(page.getByTestId("mobile-order-bar")).toBeVisible();
  });
});

test.describe("Motion accessibility", () => {
  // The OS-level "reduce motion" setting, applied per describe block.
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("reduced motion keeps every section visible and interactive", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openSite(page);

    for (const id of ["story", "menu", "favourites", "order", "delivery", "visit", "invitation"]) {
      const section = page.locator(`#${id}`);
      await section.scrollIntoViewIfNeeded();
      await expect(section).toBeVisible();
    }

    // Nothing may remain hidden at opacity 0 when motion is disabled.
    const invisible = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-child]"))
        .filter((node) => Number.parseFloat(getComputedStyle(node).opacity) < 0.9)
        .map((node) => node.className || node.tagName),
    );
    expect(invisible).toEqual([]);

    // The menu is fully usable without any animation running.
    await page.locator("#menu").scrollIntoViewIfNeeded();
    await page.getByTestId("menu-search").fill("dosa");
    await expect(page.getByTestId("menu-card").first()).toBeVisible();
  });
});

test.describe("WebGL fallback", () => {
  test("the page is complete without a 3D scene", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openSite(page, "/?no3d=1");

    await expect(page.getByTestId("hero-canvas")).toHaveCount(0);
    // The photographic hero layer carries the first impression instead.
    await expect(page.getByTestId("hero-poster")).toBeVisible();
    await expect(page.getByTestId("hero-cta-menu")).toBeVisible();
    await expect(page.getByTestId("hero-cta-call")).toBeVisible();

    // And the menu still works.
    await page.locator("#menu").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("menu-grid")).toBeVisible();
  });
});
