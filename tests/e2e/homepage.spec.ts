import { expect, test } from "@playwright/test";
import { openSite, waitForHydration, watchForProblems } from "./helpers";

test.describe("Homepage — structure, copy and navigation", () => {
  test("renders the hero, every story section and the footer", async ({ page }) => {
    const problems = watchForProblems(page);
    await openSite(page);

    await expect(page).toHaveTitle(/Maitri Residency/i);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/taste that feels closer/i);

    for (const id of ["hero", "story", "menu", "favourites", "order", "delivery", "visit", "invitation"]) {
      await expect(page.locator(`#${id}`), `section #${id} should exist`).toHaveCount(1);
    }

    await expect(page.locator("footer")).toContainText(/Karimnagar/i);
    await expect(page.locator("footer")).toContainText("H.No. 2-8-266 & 267");
    expect(problems, problems.join("\n")).toEqual([]);
  });

  test("primary CTAs are present, reachable and never inert", async ({ page }) => {
    await openSite(page);

    const menuCta = page.getByTestId("hero-cta-menu");
    await expect(menuCta).toBeVisible();
    await menuCta.click();
    await expect(page.locator("#menu")).toBeInViewport();

    // Call CTAs must be real tel: links to the publicly posted delivery line.
    const callCta = page.getByTestId("hero-cta-call");
    await expect(callCta).toHaveAttribute("href", "tel:+918985051111");
    await expect(callCta).toContainText(/call for delivery/i);

    // Every anchor on the page must resolve to something that exists on it.
    const brokenAnchors = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
      return anchors
        .map((anchor) => anchor.getAttribute("href") ?? "")
        .filter((href) => href !== "#" && !document.querySelector(href));
    });
    expect(brokenAnchors).toEqual([]);
  });

  test("all local images load and describe themselves", async ({ page }) => {
    await openSite(page);

    // Scroll the whole page so lazy images are requested.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      window.scrollTo(0, 0);
    });

    const broken = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"));
      return images
        .filter((image) => image.getAttribute("src") && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src") ?? "");
    });
    expect(broken, `broken images: ${broken.join(", ")}`).toEqual([]);

    const missingAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"));
      return images.filter((image) => image.getAttribute("alt") === null).map((image) => image.src);
    });
    expect(missingAlt, `images without alt text: ${missingAlt.join(", ")}`).toEqual([]);
  });

  test("keyboard navigation reaches the menu and the cart", async ({ page }) => {
    await openSite(page);

    // Assert the tab order on a *returning* load. The intro was dismissed with
    // a click above, and Chromium keeps the sequential focus starting point
    // where the clicked (now unmounted) button was, so Tab would resume in the
    // header instead of at the top of the document. A fresh load is the honest
    // way to test "the skip link comes first".
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForHydration(page);

    await page.keyboard.press("Tab");
    await expect(page.locator("a.skip-link")).toBeFocused();

    const cartButton = page.getByTestId("cart-button");
    await cartButton.focus();
    await expect(cartButton).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("cart-drawer")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("cart-drawer")).toBeHidden();
  });

  test("no horizontal overflow at any tested width", async ({ page }) => {
    await openSite(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
    const overflow = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    // A couple of pixels of rounding tolerance; anything more is a real bug.
    expect(overflow.documentWidth - overflow.viewportWidth).toBeLessThanOrEqual(2);
  });
});
