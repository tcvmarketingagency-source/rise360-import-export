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
      // Clear the "intro already seen" flag for the *first* load of this test
      // only. An init script runs on every navigation, and clearing the flag
      // each time makes it impossible to exercise the real session rule — the
      // intro would legitimately replay after any client navigation, so the
      // "does not replay in the same session" scenario could never pass.
      if (!window.localStorage.getItem("e2e.introSeeded")) {
        window.localStorage.setItem("e2e.introSeeded", "1");
        window.sessionStorage.removeItem("maitri.intro.v2");
      }
    } catch {
      /* ignore */
    }
  });
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

/**
 * Waits until React has taken over the server-rendered markup.
 *
 * The site is server-rendered, so controls like the header buttons and the menu
 * filters exist — and look ready — before their handlers are attached. A
 * scripted click that lands in that window is swallowed by the browser, which
 * made these specs depend on how fast the machine hydrated (measured ~1.9s on
 * this build). React marks the nodes it owns with `__reactFiber$…` /
 * `__reactProps$…`; the server HTML has none, so that is a reliable signal that
 * does not depend on a testid added purely for tests.
 */
export async function waitForHydration(page: Page, timeout = 20_000) {
  await page.waitForFunction(
    () => {
      const node =
        document.querySelector('[data-testid="nav-open"]') ??
        document.querySelector('[data-testid="menu-grid"]') ??
        document.querySelector("main");
      return (
        !!node &&
        Object.keys(node).some((key) => key.startsWith("__reactFiber$") || key.startsWith("__reactProps$"))
      );
    },
    undefined,
    { timeout },
  );
}

/** Reloads the current page and waits until the app is interactive again. */
export async function reloadSite(page: Page) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForHydration(page);
}

/** Navigates to a path and waits until the app is interactive again. */
export async function visitSite(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForHydration(page);
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
  await waitForHydration(page);
}

/**
 * Waits until the order has actually been written to storage.
 *
 * The cart is persisted in an effect *after* the state change (deliberately, so
 * the server HTML and the first render agree). A navigation or reload that races
 * ahead of that write legitimately loses the order, which is what made several
 * specs flaky: they filled the cart and navigated in the same breath.
 */
export async function waitForCartPersisted(page: Page, minimum = 1) {
  await page.waitForFunction(
    (min) => {
      try {
        const raw = window.localStorage.getItem("maitri.cart.v1");
        return ((JSON.parse(raw ?? "[]") as unknown[]).length ?? 0) >= min;
      } catch {
        return false;
      }
    },
    minimum,
    { timeout: 15_000 },
  );
}

/** Adds the first quick-addable dish on the menu grid to the cart. */
export async function addFirstDishToCart(page: Page) {
  await page.locator("#menu").scrollIntoViewIfNeeded();
  const addButton = page.getByTestId("menu-card-add").first();
  if (await addButton.isVisible().catch(() => false)) {
    await addButton.click();
  } else {
    const customise = page.getByTestId("menu-card-customise").first();
    await customise.click();
    await page.getByTestId("item-add-to-cart").click();
  }
  await waitForCartPersisted(page);
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
