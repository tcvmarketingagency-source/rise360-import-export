import { chromium as playwrightChromium } from "playwright-core";
import { writeFileSync } from "node:fs";
const chromium = (await import("/tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
const browser = await playwrightChromium.launch({
  executablePath: "/tmp/chromium",
  args: [...chromium.args, "--disable-dev-shm-usage"],
  chromiumSandbox: false,
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/nssroot/lib" },
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await page.context().newCDPSession(page);
const shot = async (name) => {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`/tmp/browser/${name}.png`, Buffer.from(data, "base64"));
};
await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(1000);
const skip = page.getByTestId("intro-skip");
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForTimeout(3000);

// Report every layer in the hero and its background, then hide the CSS glow.
const before = await page.evaluate(() => {
  const hero = document.querySelector("#hero");
  return Array.from(hero.querySelectorAll("div")).slice(0, 14).map((el, i) => ({
    i,
    testid: el.getAttribute("data-testid"),
    cls: (el.className || "").toString().slice(0, 90),
    bg: getComputedStyle(el).backgroundImage.slice(0, 120),
    z: getComputedStyle(el).zIndex,
  }));
});
console.log(JSON.stringify(before.filter((b) => b.bg && b.bg !== "none"), null, 1));

await page.evaluate(() => {
  const hero = document.querySelector("#hero");
  // hide the -z-30 gradient stack entirely
  for (const el of hero.querySelectorAll("div")) {
    const cls = (el.className || "").toString();
    if (cls.includes("-z-30")) el.style.display = "none";
  }
});
await page.waitForTimeout(500);
await shot("diag-5-no-glow-layer");
await browser.close();
