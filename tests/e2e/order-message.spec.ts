import { expect, test } from "@playwright/test";
import { addFirstDishToCart, openSite } from "./helpers";

/**
 * Mode A formatting, exercised through the real checkout UI.
 *
 * These specs pin the exact shape of the WhatsApp/call-assisted order summary
 * without ever sending one: the message is built and rendered on the page in
 * preview mode, and its format is asserted against what a staff member would
 * actually need to read in a WhatsApp thread.
 *
 * Pure-function coverage of the message builder and the pricing engine lives in
 * tests/unit/domain.spec.ts.
 */
test.describe("Order summary format (WhatsApp / call assisted)", () => {
  test.beforeEach(async ({ page }) => {
    await openSite(page);
    await page.evaluate(() => window.localStorage.removeItem("maitri.cart.v1"));
    await page.reload({ waitUntil: "domcontentloaded" });
  });

  test("summary is complete, readable and honest about confirmation", async ({ page }) => {
    await addFirstDishToCart(page);
    await page.goto("/checkout");
    await page.locator("#field-customerName").fill("Anitha Rao");
    await page.locator("#field-phone").fill("9123456780");
    await page.locator("#field-address").fill("H.No 12-4-88, near Circus Grounds, Karimnagar");
    await page.locator("#field-area").fill("Mukaram Pura");
    await page.locator("#field-instructions").fill("Ring the bell twice.");
    await page.getByTestId("checkout-review").click();

    const summary = await page.locator("pre").first().innerText();

    // Structure a staff member can scan quickly.
    expect(summary).toMatch(/Ref: CONCEPT-MR-\d{6}-[A-Z0-9]{4}/);
    expect(summary).toContain("Items");
    expect(summary).toMatch(/• .+ × 1/);
    expect(summary).toMatch(/Line total: ₹/);
    expect(summary).toMatch(/Subtotal: ₹/);
    expect(summary).toContain("Delivery charge: to be confirmed by the restaurant");
    expect(summary).toContain("Taxes: to be confirmed by the restaurant");

    // Customer-supplied details appear only after this review step.
    expect(summary).toContain("Anitha Rao");
    expect(summary).toContain("9123456780");
    expect(summary).toContain("H.No 12-4-88, near Circus Grounds, Karimnagar");
    expect(summary).toContain("Mukaram Pura");
    expect(summary).toContain("Ring the bell twice.");

    // Never claims the order was received.
    expect(summary).toMatch(/no order has been sent to the restaurant and no charge has been made/i);
  });

  test("customer phone number is exactly the publicly posted delivery line", async ({ page }) => {
    await openSite(page, "/contact");
    await expect(page.locator('a[href^="tel:"]').first()).toHaveAttribute("href", "tel:+918985051111");
    await expect(page.getByText("+91 89850 51111").first()).toBeVisible();
  });

  test("checkout copy never promises a delivery time, fee or discount", async ({ page }) => {
    await addFirstDishToCart(page);
    await page.goto("/checkout");
    const text = (await page.locator("body").innerText()).toLowerCase();

    expect(text).not.toMatch(/\b\d+\s*(min|mins|minutes)\b/);
    expect(text).not.toMatch(/free delivery/);
    expect(text).not.toMatch(/discount|% off/);
    expect(text).toContain("to be confirmed");
  });
});
