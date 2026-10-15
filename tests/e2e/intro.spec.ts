import { expect, test } from "@playwright/test";
import { openSiteWithIntro, skipIntroIfPresent } from "./helpers";

test.describe("Cinematic intro", () => {
  test("plays once and never traps the visitor", async ({ page }) => {
    await openSiteWithIntro(page);
    const overlay = page.getByTestId("intro-overlay");

    await expect(overlay).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("intro-skip")).toBeVisible();

    await page.getByTestId("intro-skip").click();
    await expect(overlay).toBeHidden({ timeout: 6_000 });

    // The hero must be immediately usable after skipping.
    await expect(page.getByTestId("hero-cta-menu")).toBeVisible();
    await expect(page.getByTestId("hero-cta-menu")).toBeEnabled();
  });

  test("any key, scroll or tap dismisses it", async ({ page }) => {
    await openSiteWithIntro(page);
    const overlay = page.getByTestId("intro-overlay");

    if (await overlay.isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await expect(overlay).toBeHidden({ timeout: 6_000 });
    }
  });

  test("does not replay on the next visit in the same session", async ({ page }) => {
    await openSiteWithIntro(page);
    await skipIntroIfPresent(page);

    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("intro-overlay")).toBeHidden();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("intro-overlay")).toBeHidden({ timeout: 5_000 });
    await expect(page.getByTestId("hero-cta-menu")).toBeVisible();
  });

  test("is skipped entirely for reduced-motion visitors", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openSiteWithIntro(page);

    // No cinematic sequence at all — the site is simply present.
    await expect(page.getByTestId("intro-overlay")).toBeHidden({ timeout: 5_000 });
    await expect(page.getByTestId("hero-cta-menu")).toBeVisible();
  });
});
