import { expect, test } from "@playwright/test";
import { addFirstDishToCart, openSite } from "./helpers";

const valid = {
  customerName: "Ravi Kumar",
  phone: "9876543210",
  address: "Flat 4B, Sai Residency, near Clock Tower, Mukaram Pura",
  area: "Mukaram Pura",
  instructions: "Please call on arrival, second gate.",
};

async function fillCheckout(page: import("@playwright/test").Page) {
  await page.locator("#field-customerName").fill(valid.customerName);
  await page.locator("#field-phone").fill(valid.phone);
  await page.locator("#field-address").fill(valid.address);
  await page.locator("#field-area").fill(valid.area);
  await page.locator("#field-instructions").fill(valid.instructions);
}

test.describe("Checkout (concept preview)", () => {
  test.beforeEach(async ({ page }) => {
    await openSite(page);
    await page.evaluate(() => window.localStorage.removeItem("maitri.cart.v1"));
    await page.reload({ waitUntil: "domcontentloaded" });
  });

  test("empty order cannot check out", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/nothing to check out/i);
    await expect(page.getByRole("link", { name: /explore the menu/i })).toBeVisible();
  });

  test("validates required fields with specific, readable messages", async ({ page }) => {
    await addFirstDishToCart(page);
    await page.goto("/checkout");

    await page.getByTestId("checkout-review").click();

    await expect(page.getByRole("alert").first()).toBeVisible();
    // The first invalid field receives focus so keyboard users are not lost.
    await expect(page.locator("#field-customerName")).toBeFocused();
    await expect(page.getByText(/please enter the name for this order/i)).toBeVisible();

    await page.locator("#field-customerName").fill("A");
    await page.getByTestId("checkout-review").click();
    await expect(page.getByText(/that name is too long|please enter the name/i).first()).toBeVisible();

    // Too short: the length message fires. A well-formed but invalid number gets
    // the more specific "valid Indian mobile number" message.
    await page.locator("#field-phone").fill("12345");
    await page.getByTestId("checkout-review").click();
    await expect(page.getByText(/10-digit mobile number/i)).toBeVisible();

    await page.locator("#field-phone").fill("1234567890");
    await page.getByTestId("checkout-review").click();
    await expect(page.getByText(/valid indian mobile number/i)).toBeVisible();
  });

  test("review step shows the exact summary and transmits nothing in preview mode", async ({ page }) => {
    await addFirstDishToCart(page);
    await page.goto("/checkout");
    await fillCheckout(page);
    await page.getByTestId("checkout-review").click();

    // Review shows both the delivery details and the literal message text.
    await expect(page.getByText(valid.address)).toBeVisible();
    await expect(page.getByText(/Ref: CONCEPT-MR-/)).toBeVisible();
    await expect(page.getByText(/no order has been sent to the restaurant/i)).toBeVisible();

    // In preview mode the WhatsApp action must not exist.
    await expect(page.getByTestId("checkout-whatsapp")).toHaveCount(0);

    const newPages: string[] = [];
    page.context().on("page", (newPage) => newPages.push(newPage.url()));

    await page.getByTestId("checkout-finalise").click();
    await expect(page.getByTestId("checkout-prepared")).toBeVisible();
    await expect(page.getByTestId("checkout-prepared")).toContainText(/not sent/i);
    await expect(page.getByTestId("checkout-prepared")).toContainText(/no payment was taken/i);

    expect(newPages, "preview mode must not open WhatsApp or any external page").toEqual([]);
    await expect(page.getByTestId("checkout-placed")).toHaveCount(0);
  });

  test("server refuses to create real orders in preview mode", async ({ request }) => {
    const response = await request.post("/api/orders", {
      data: {
        customerName: "Test",
        phone: "9876543210",
        address: "Somewhere with enough characters",
        area: "Karimnagar",
        fulfilment: "delivery",
        lines: [],
        expectedSubtotalPaise: 0,
      },
    });
    expect(response.status()).toBe(403);
    const body = (await response.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/switched off|not being accepted/i);
  });

  test("totals stay consistent between cart and checkout", async ({ page }) => {
    await addFirstDishToCart(page);
    await page.getByTestId("cart-button").click();
    const drawerSubtotal = (await page.getByTestId("cart-subtotal").innerText()).trim();
    await page.keyboard.press("Escape");

    await page.goto("/checkout");
    const checkoutSubtotal = (await page.locator("dl").getByText(/^₹/).first().innerText()).trim();
    expect(checkoutSubtotal).toBe(drawerSubtotal);
  });
});
