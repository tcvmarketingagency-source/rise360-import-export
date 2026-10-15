import { expect, test } from "@playwright/test";
import { openSite } from "./helpers";

test.describe("Menu explorer", () => {
  test.beforeEach(async ({ page }) => {
    await openSite(page);
    await page.locator("#menu").scrollIntoViewIfNeeded();
  });

  test("shows sample content clearly marked as sample", async ({ page }) => {
    const grid = page.getByTestId("menu-grid");
    await expect(grid).toBeVisible();
    const cards = page.getByTestId("menu-card");
    expect(await cards.count()).toBeGreaterThan(5);

    // Preview mode must label authored placeholder content.
    await expect(page.getByText("SAMPLE").first()).toBeVisible();
    await expect(page.getByTestId("menu-filters")).toContainText(/dietary marks unverified/i);
  });

  test("category filters narrow the results and can be cleared", async ({ page }) => {
    const before = await page.getByTestId("menu-card").count();

    await page.getByTestId("category-biryani").click();
    const filtered = await page.getByTestId("menu-card").count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(before);

    await page.getByTestId("category-biryani").click();
    await expect(page.getByTestId("menu-card")).toHaveCount(before);
  });

  test("search finds a dish and reports emptiness honestly", async ({ page }) => {
    const search = page.getByTestId("menu-search");
    await search.fill("biryani");
    await expect(page.getByTestId("menu-card")).not.toHaveCount(0);
    for (const card of await page.getByTestId("menu-card").all()) {
      await expect(card).toContainText(/biryani/i);
    }

    await search.fill("zzzzzz");
    await expect(page.getByTestId("menu-empty")).toBeVisible();
    await expect(page.getByTestId("menu-empty")).toContainText(/nothing matches/i);

    await page.getByRole("button", { name: /clear search & filters/i }).click();
    await expect(page.getByTestId("menu-card").first()).toBeVisible();
  });

  test("dietary filter uses the unverified marks honestly", async ({ page }) => {
    await page.getByTestId("diet-filter-veg").click();
    const cards = page.getByTestId("menu-card");
    expect(await cards.count()).toBeGreaterThan(0);
    // Unverified classification is always surfaced, never silently asserted.
    await expect(cards.first()).toContainText(/to confirm/i);
  });

  test("item dialog opens with options, quantity and add-to-cart", async ({ page }) => {
    await page.getByTestId("category-biryani").click();
    await page.getByTestId("menu-card-open").first().click();

    const dialog = page.getByTestId("item-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/sample/i);

    // Required option group is pre-selected so the item is orderable in one tap.
    await expect(dialog.getByRole("button", { name: /^Half/ })).toBeVisible();

    await page.getByTestId("item-quantity");
    await dialog.getByRole("button", { name: /increase quantity/i }).click();
    await expect(dialog.getByTestId("item-quantity")).toHaveText("2");

    await page.getByTestId("item-add-to-cart").click();
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("cart-toast")).toBeVisible();
  });

  test("unavailable items cannot be added", async ({ page }) => {
    const unavailable = page.locator('[data-item-slug="apollo-fish"]');
    await unavailable.scrollIntoViewIfNeeded();
    await expect(unavailable).toContainText(/unavailable today/i);
    await expect(unavailable.getByTestId("menu-card-add")).toHaveCount(0);
    await expect(unavailable.getByTestId("menu-card-customise")).toHaveCount(0);
    await expect(unavailable).toContainText(/not orderable/i);
  });
});
