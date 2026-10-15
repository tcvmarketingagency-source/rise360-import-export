import { chromium as playwrightChromium } from "playwright-core";
const chromium = (await import("/tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
const browser = await playwrightChromium.launch({
  executablePath: "/tmp/chromium",
  args: [...chromium.args, "--disable-dev-shm-usage"],
  chromiumSandbox: false,
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/nssroot/lib" },
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForTimeout(2500);
const skip = page.getByTestId("intro-skip");
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForTimeout(1500);

const countInvisible = () =>
  page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        "[data-beat],[data-card-line],[data-image-reveal],[data-menu-card],[data-delivery-row],[data-order-step],[data-scene-act],[data-scene-headline],[data-scene-support],[data-scene-marker],[data-entrance-extra],[data-entrance-nested]",
      ),
    ).filter((n) => {
      const s = getComputedStyle(n);
      return s.visibility !== "hidden" && s.display !== "none" && Number.parseFloat(s.opacity) < 0.85;
    }).length,
  );

await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.6);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 200));
  }
});
console.log("immediately after the walk:", await countInvisible());
await page.waitForTimeout(6000);
console.log("after 6s settle:", await countInvisible());
await page.waitForTimeout(9000);
console.log("after 15s settle:", await countInvisible());
// scroll back to the top and check the same elements again (two directions)
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2500);
console.log("back at the top:", await countInvisible());

// cart round-trip
await page.locator("#menu").scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
const add = page.getByTestId("menu-card-add").first();
if (await add.isVisible().catch(() => false)) {
  await add.click();
  await page.waitForTimeout(2500);
}
const summary = await page.evaluate(() => ({
  count: document.querySelector("[data-testid=order-summary-count]")?.textContent ?? null,
  subtotal: document.querySelector("[data-testid=order-summary-subtotal]")?.textContent ?? null,
  checkout: Boolean(document.querySelector("[data-testid=order-summary-checkout]")),
  cartBadge: document.querySelector("[data-testid=cart-button]")?.textContent?.trim().slice(0, 30) ?? null,
}));
console.log("cart after add:", JSON.stringify(summary));
await browser.close();
