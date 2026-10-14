import { expect, test } from "@playwright/test";
import { openSite } from "./helpers";

test.describe("Concept-preview safety and trust", () => {
  test("preview mode is stated on the customer journey", async ({ page }) => {
    await openSite(page);
    await expect(page.getByTestId("site-header")).toContainText(/concept/i);

    await page.locator("#delivery").scrollIntoViewIfNeeded();
    await expect(page.locator("#delivery")).toContainText(/published|confirmed public detail/i);
    await expect(page.locator("#delivery")).toContainText(/awaiting confirmation/i);
    await expect(page.locator("#delivery")).toContainText(/to be confirmed/i);
  });

  test("no fabricated social proof anywhere on the site", async ({ page }) => {
    await openSite(page);
    const body = (await page.locator("body").innerText()).toLowerCase();

    const banned = [
      /best in karimnagar/,
      /\b\d(?:\.\d)?\s*\/\s*5\b/,
      /\b\d+\s*(?:five-star|5-star)\b/,
      /\bawards?\b/,
      /hygiene certificate/,
      /guaranteed delivery/,
      /\d+\s*\+?\s*happy customers/,
      /\brated\s+\d/,
      /free delivery/,
      /% off|\bdiscount\b/,
      /\bhurry\b|only \d+ left/,
    ];
    for (const pattern of banned) {
      expect(body, `site copy must not contain ${pattern}`).not.toMatch(pattern);
    }
  });

  test("the delivery number matches the publicly posted one, everywhere", async ({ page }) => {
    await openSite(page);
    const telLinks = await page.locator('a[href^="tel:"]').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("href")),
    );
    expect(telLinks.length).toBeGreaterThan(0);
    for (const href of telLinks) {
      expect(href).toBe("tel:+918985051111");
    }
  });

  test("SEO essentials are present and honest", async ({ page, request }) => {
    await openSite(page);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBeTruthy();

    const og = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(og).toContain("Maitri Residency");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toBeTruthy();

    const ogImageResponse = await request.get(new URL(ogImage!).pathname);
    expect(ogImageResponse.status()).toBe(200);

    const jsonLd = await page.locator('script[type="application/ld+json"]').first().innerText();
    const parsed = JSON.parse(jsonLd) as Record<string, unknown>[];
    const restaurant = parsed.find((entry) => entry["@type"] === "Restaurant") as
      | Record<string, unknown>
      | undefined;
    expect(restaurant).toBeTruthy();
    expect(restaurant?.telephone).toBe("+91 89850 51111");
    // Verified facts may appear; unverified claims may not.
    expect(JSON.stringify(parsed)).not.toMatch(/aggregateRating|priceRange|award/i);
  });

  test("robots and sitemap render", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    const text = await robots.text();
    // Unreleased concept build: kept out of search results entirely.
    expect(text).toContain("Disallow: /");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
  });

  test("policy drafts and the handoff list are reachable", async ({ page }) => {
    await page.goto("/handoff");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/approve before this goes live/i);
    await expect(page.locator("main, body")).toContainText(/not the restaurant's official website/i);

    await page.goto("/policies/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/privacy notice/i);

    await page.goto("/policies/order-delivery");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/order & delivery policy/i);
  });

  test("admin is never exposed to customers", async ({ page }) => {
    const response = await page.goto("/admin");
    // Without Supabase configuration the dashboard shows a setup panel, never data.
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(/setup required/i);
    await expect(page.locator("body")).not.toContainText(/customer_phone|delivery_address/);

    const api = await page.request.patch("/api/admin/orders/00000000-0000-0000-0000-000000000000", {
      data: { status: "accepted" },
    });
    expect([401, 503]).toContain(api.status());
  });
});
