import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration.
 *
 *   npm run test:e2e                 # all projects
 *   npm run test:e2e -- --project=mobile-390
 *
 * The suite is written so it can run against a local dev server or a deployed
 * preview: set E2E_BASE_URL to point it somewhere else.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const useExistingServer = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: "./tests",
  // Unit tests import server-guarded modules; this tsconfig aliases the
  // `server-only` marker to a stub for the Node test runner.
  tsconfig: "./tests/tsconfig.json",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: { timeout: 8_000 },

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    // Motion preference is a context option in Playwright; the reduced-motion
    // profile below overrides it.
    contextOptions: { reducedMotion: "no-preference" },
  },

  projects: [
    {
      // Pure domain tests: pricing, cart maths, validation, order state machine.
      // No browser and no server required.
      name: "unit",
      testMatch: /unit\/.*\.spec\.ts/,
    },
    {
      name: "desktop-chromium",
      testMatch: /e2e\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      // Deliberately modest hardware: this is the profile most Karimnagar
      // customers will actually use.
      name: "mobile-390",
      testMatch: /e2e\/.*\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-360",
      testMatch: /e2e\/.*\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 360, height: 740 },
      },
    },
    {
      name: "tablet",
      testMatch: /e2e\/.*\.spec\.ts/,
      use: { ...devices["iPad Mini"] },
    },
    {
      // Real accessibility profile: the OS-level "reduce motion" setting.
      name: "reduced-motion",
      testMatch: /e2e\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        contextOptions: { reducedMotion: "reduce" },
      },
    },
  ],

  webServer: useExistingServer
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        env: { NEXT_PUBLIC_ORDER_MODE: "preview" },
      },
});
