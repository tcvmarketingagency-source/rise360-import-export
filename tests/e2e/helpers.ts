import { expect, type Page } from "@playwright/test";

/**
 * Shared helpers.
 *
 * Every spec starts with `openSite`, which clears the session flag so the
 * cinematic intro actually plays, then dismisses it the way a real visitor
 * would. Specs that want to test the intro itself use `openSiteWithIntro`.
 */
export async function openSiteWithIntro(page: Page, path = "/") {
  await page.addInitScript(() => {
    try {
      window.sessionStorage.removeItem("maitri.intro.v2");
    } catch {
      /* ignore */
    }
  });
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

export async function skipIntroIfPresent(page: Page) {
  const skip = page.getByTestId("intro-skip");
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await expect(page.getByTestId("intro-overlay")).toBeHidden({ timeout: 5_000 });
  }
}

export async function openSite(page: Page, path = "/") {
  await openSiteWithIntro(page, path);
  await skipIntroIfPresent(page);
}

/** Adds the first quick-addable dish on the menu grid to the cart. */
export async function addFirstDishToCart(page: Page) {
  await page.locator("#menu").scrollIntoViewIfNeeded();
  const addButton = page.getByTestId("menu-card-add").first();
  if (await addButton.isVisible().catch(() => false)) {
    await addButton.click();
    return;
  }
  const customise = page.getByTestId("menu-card-customise").first();
  await customise.click();
  await page.getByTestId("item-add-to-cart").click();
}

export async function readCartCount(page: Page): Promise<number> {
  const label = await page.getByTestId("cart-button").getAttribute("aria-label");
  const match = label?.match(/(\d+)\s+item/);
  return match?.[1] ? Number.parseInt(match[1], 10) : 0;
}

/** Fails the test if the page reports a console error or a failed request. */
export function watchForProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      // WebGL is unavailable in some CI containers; that is covered separately.
      if (/WebGL|THREE\.WebGLRenderer|Error creating WebGL context/i.test(text)) return;
      problems.push(`console: ${text}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      const url = response.url();
      if (url.includes("/_next/") || url.includes("favicon")) return;
      problems.push(`http ${response.status()}: ${url}`);
    }
  });
  return problems;
}
