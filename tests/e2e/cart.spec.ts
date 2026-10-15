import { expect, test } from "@playwright/test";
import { addFirstDishToCart, openSite, readCartCount, reloadSite } from "./helpers";

test.describe("Cart", () => {
  test.beforeEach(async ({ page }) => {
    await openSite(page);
    await page.evaluate(() => window.localStorage.removeItem("maitri.cart.v1"));
    await reloadSite(page);
  });

  test("empty cart explains what to do next", async ({ page }) => {
    await page.getByTestId("cart-button").click();
    const drawer = page.getByTestId("cart-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(/your order is empty/i);
    await expect(drawer.getByRole("link", { name: /explore the menu/i })).toBeVisible();
  });

  test("add, increase, decrease and remove behave correctly", async ({ page }) => {
    await addFirstDishToCart(page);
    expect(await readCartCount(page)).toBe(1);

    await page.getByTestId("cart-button").click();
    const drawer = page.getByTestId("cart-drawer");
    const line = drawer.getByTestId("cart-line").first();
    await expect(line).toBeVisible();

    const subtotal = drawer.getByTestId("cart-subtotal");
    const firstSubtotal = (await subtotal.innerText()).trim();

    await line.getByRole("button", { name: /increase quantity/i }).click();
    await expect(subtotal).not.toHaveText(firstSubtotal);
    expect(await readCartCount(page)).toBe(2);

    await line.getByRole("button", { name: /decrease quantity/i }).click();
    await expect(subtotal).toHaveText(firstSubtotal);

    await line.getByRole("button", { name: /remove/i }).click();
    await expect(drawer).toContainText(/your order is empty/i);
    expect(await readCartCount(page)).toBe(0);
  });

  test("never invents delivery charges, taxes or discounts", async ({ page }) => {
    await addFirstDishToCart(page);
    await page.getByTestId("cart-button").click();
    const drawer = page.getByTestId("cart-drawer");

    await expect(drawer.getByTestId("cart-delivery")).toContainText(/to be confirmed/i);
    await expect(drawer).toContainText(/Taxes/);
    await expect(drawer).toContainText(/to be confirmed/i);
    await expect(drawer).not.toContainText(/₹0\b/);
    await expect(drawer).not.toContainText(/discount|save ₹|% off/i);
    await expect(drawer).not.toContainText(/only \d+ left|hurry/i);
  });

  test("clearing the order asks for confirmation first", async ({ page }) => {
    await addFirstDishToCart(page);
    await page.getByTestId("cart-button").click();
    const drawer = page.getByTestId("cart-drawer");

    await drawer.getByTestId("cart-clear").click();
    await expect(drawer.getByTestId("cart-clear-confirm")).toBeVisible();
    await drawer.getByRole("button", { name: /cancel/i }).click();
    await expect(drawer.getByTestId("cart-line")).toHaveCount(1);

    await drawer.getByTestId("cart-clear").click();
    await drawer.getByTestId("cart-clear-confirm").click();
    await expect(drawer).toContainText(/your order is empty/i);
  });

  test("order survives a page reload", async ({ page }) => {
    await addFirstDishToCart(page);
    // addFirstDishToCart already waited for the write to land.
    await reloadSite(page);
    // The cart is restored in an effect after hydration (deliberately, so the
    // server HTML and the first render agree), so poll instead of sampling once.
    await expect.poll(() => readCartCount(page)).toBe(1);
  });

  test("cart drawer traps focus, closes on Escape and restores it", async ({ page }) => {
    const cartButton = page.getByTestId("cart-button");
    await cartButton.click();
    const drawer = page.getByTestId("cart-drawer");
    await expect(drawer).toBeVisible();

    // Focus stays inside the dialog while tabbing.
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => {
        const dialog = document.querySelector('[data-testid="cart-drawer"]');
        return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement));
      });
      expect(inside).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(cartButton).toBeFocused();
  });
});
