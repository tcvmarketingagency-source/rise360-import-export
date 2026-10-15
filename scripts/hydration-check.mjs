/**
 * Hydration smoke test.
 *
 *   node scripts/hydration-check.mjs [url] [--full] [--prod]
 *
 * Loads the real server-rendered page into a DOM implementation, executes the
 * actual Next.js client bundles, and reports every React hydration warning or
 * console error they produce. This is the closest thing to a browser console
 * check that can run without a browser binary, which makes it usable in CI and
 * in sandboxes where Chromium cannot be downloaded.
 *
 * Design notes
 * ------------
 * • Hydration is *asserted*, never assumed: a case only counts once React has
 *   attached to the server markup (its internal `__reactFiber$` keys appear on
 *   the header node). A run where React never attached is reported as a failure
 *   rather than a clean pass.
 * • The first jsdom realm in a Node process runs cold (JIT warm-up, first
 *   bundle evaluation) and React's dev-only hydration diff is not reliable
 *   there, so the script performs one discarded warm-up pass first.
 * • Sensitivity is proven in the same process: two must-fail controls inject
 *   classic mismatch classes and the run FAILS if either goes undetected. A
 *   clean result without working controls would prove nothing.
 * • Intentionally not a control: extra attributes on <html> itself. The root
 *   layout declares `suppressHydrationWarning` on <html> because a pre-paint
 *   script owns `data-intro` there (see src/app/layout.tsx) — that element's
 *   own attribute diff is the one documented exemption. Control A therefore
 *   targets a body-level element, which must still be caught.
 * • WebGL is intentionally absent, which also exercises the non-WebGL fallback.
 */
import { JSDOM, VirtualConsole } from "jsdom";
import { TextDecoder, TextEncoder } from "node:util";

const target = process.argv[2] ?? "http://127.0.0.1:3000/";
const FULL = process.argv.includes("--full");
/**
 * Production mode (`--prod`): React's production build never prints the
 * hydration-diff explanation, so the dev-only controls cannot fire. In this
 * mode the check verifies that hydration attaches cleanly and that no console
 * error (including "Hydration failed because the initial UI does not match")
 * is emitted, and it reports the controls as skipped rather than failed.
 */
const PROD = process.argv.includes("--prod");
const ATTEMPTS = 2;

/** Console/error noise that is environmental rather than a rendering bug. */
const IGNORE = [
  /Could not parse CSS stylesheet/i,
  /Not implemented: window\.(scrollTo|scroll)/i,
  /Not implemented: HTMLCanvasElement/i,
  /Error: Not implemented/i,
  /WebGL/i,
  /THREE\./i,
];

function isNoise(text) {
  return IGNORE.some((pattern) => pattern.test(text));
}

/** APIs a browser has and jsdom does not. Mirrors real behaviour cheaply. */
function installPolyfills(window) {
  const { matchMediaMissing, IntersectionObserverMissing, ResizeObserverMissing } = {};

  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  }

  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  if (!window.IntersectionObserver) window.IntersectionObserver = Observer;
  if (!window.ResizeObserver) window.ResizeObserver = Observer;
  if (!window.MutationObserver) window.MutationObserver = Observer;

  window.requestIdleCallback = (callback) => window.setTimeout(() => callback({ didTimeout: false }), 0);
  window.cancelIdleCallback = (id) => window.clearTimeout(id);

  // jsdom's scrollTo throws "Not implemented"; make it a quiet no-op so the
  // smooth-scroll and anchor code paths can still run.
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.scroll = () => {};

  window.HTMLCanvasElement.prototype.getContext = () => null;

  // Next's client runtime (streaming RSC, fetch, encoders) relies on web globals
  // that Node provides but jsdom's window does not re-export.
  const fromNode = [
    "TextEncoder",
    "TextDecoder",
    "ReadableStream",
    "WritableStream",
    "TransformStream",
    "ByteLengthQueuingStrategy",
    "CountQueuingStrategy",
    "fetch",
    "Headers",
    "Request",
    "Response",
    "FormData",
    "AbortController",
    "AbortSignal",
    "structuredClone",
    "queueMicrotask",
    "performance",
    "URL",
    "URLSearchParams",
    "Blob",
    "File",
    "atob",
    "btoa",
    "setImmediate",
    "clearImmediate",
  ];
  for (const key of fromNode) {
    if (typeof globalThis[key] === "undefined") continue;
    if (typeof window[key] === "undefined") {
      window[key] = globalThis[key];
    }
  }
  // React reads these off the global scope inside the jsdom realm.
  window.global = window.global ?? window;

  if (!window.crypto) window.crypto = {};
  if (!window.crypto.randomUUID) {
    window.crypto.randomUUID = () =>
      "00000000-0000-4000-8000-000000000000".replace(/0/g, () => Math.floor(Math.random() * 16).toString(16));
  }

  void matchMediaMissing;
  void IntersectionObserverMissing;
  void ResizeObserverMissing;
}

async function run(label, { preHydrationScript, mangleHtml, quiet = false }) {
  let html = await fetch(target).then((response) => response.text());
  if (mangleHtml) html = mangleHtml(html);

  const messages = [];
  const virtualConsole = new VirtualConsole();
  for (const level of ["error", "warn"]) {
    virtualConsole.on(level, (...args) => {
      const text = args
        .map((value) => (value instanceof Error ? value.message : typeof value === "string" ? value : ""))
        .join(" ");
      if (text && !isNoise(text)) messages.push(`[${level}] ${text}`);
    });
  }
  virtualConsole.on("jsdomError", (error) => {
    if (!isNoise(error.message)) messages.push(`[jsdom] ${error.message}`);
  });

  const dom = new JSDOM(html, {
    url: target,
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse: installPolyfills,
  });

  // Simulate the pre-paint script exactly as the browser would run it: after
  // <head> is parsed but before the React bundles execute.
  if (preHydrationScript) preHydrationScript(dom.window);

  // Wait for React to actually attach to the server markup rather than guessing
  // with a fixed delay: hydrated nodes carry React's internal properties.
  const isHydrated = () => {
    const node = dom.window.document.querySelector("[data-testid='site-header']");
    if (!node) return false;
    return Object.keys(node).some((key) => key.startsWith("__reactFiber$") || key.startsWith("__reactContainer$"));
  };

  let elapsed = 0;
  while (!isHydrated() && elapsed < 20000) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    elapsed += 250;
  }

  // React flushes its dev-only hydration diff asynchronously: a clean-room
  // React 19 test (renderToStaticMarkup + hydrateRoot in jsdom, extra attribute
  // injected pre-hydration) showed the console message arriving well after
  // hydration had completed. Counting messages the instant React attaches can
  // therefore report a mismatched page as clean. Wait for the console to go
  // quiet instead, capped so a silent page still finishes quickly.
  let lastCount = messages.length;
  let quietFor = 0;
  while (quietFor < 1500 && elapsed < 24000) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    elapsed += 200;
    quietFor += 200;
    if (messages.length !== lastCount) {
      lastCount = messages.length;
      quietFor = 0;
    }
  }

  const hydrated = isHydrated();
  const sticky = [...dom.window.document.documentElement.attributes].map((a) => a.name).sort();

  dom.window.close();

  if (!hydrated) {
    messages.push("[check] React never hydrated the page — results are not trustworthy");
  }
  const hydrationMessages = messages.filter((text) =>
    /hydrat|did not match|server-rendered|never hydrated/i.test(text),
  );
  if (!quiet) {
    console.log(`\n─── ${label} ───`);
    console.log(`html attributes present post-hydration: ${sticky.join(", ")}`);
    console.log(`React hydrated: ${hydrated ? "yes" : "NO (chunk failure or never attached)"}`);
    console.log(`console errors/warnings: ${messages.length}`);
    for (const text of messages.slice(0, 12)) console.log(`  ${FULL ? text : text.slice(0, 240)}`);
    console.log(`hydration-specific warnings: ${hydrationMessages.length}`);
  }
  return hydrationMessages;
}

/**
 * Each attempt is an independent jsdom realm. React's dev-only hydration diff
 * is not emitted in every realm (a cold-start effect in jsdom, not a property
 * of the page), so a case counts as FAILING if any attempt reports a mismatch.
 * That direction is deliberate: the harness must never report "clean" because a
 * measurement happened to be silent. Per-attempt counts are printed so the
 * flakiness stays visible rather than hidden.
 */
async function measure(label, options, attempts = ATTEMPTS) {
  const hits = [];
  const perAttempt = [];
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const found = await run(`${label} — attempt ${attempt}/${attempts}`, options);
    perAttempt.push(found.length);
    hits.push(...found.map((text) => `attempt ${attempt}: ${text}`));
  }
  return { hits, perAttempt };
}

// ── Server markup must be identical for every visitor ──────────────────────
const ssrHtml = await fetch(target).then((response) => response.text());
const ssrHtmlTag = ssrHtml.match(/<html[^>]*>/)?.[0] ?? "(no <html> tag found)";
const ssrCarriesFlag = /<html[^>]*data-intro/.test(ssrHtml);
console.log(`target: ${target}`);
console.log(`server <html> tag: ${ssrHtmlTag}`);
console.log(
  ssrCarriesFlag
    ? "server markup: carries data-intro — unexpected, server output should not depend on visitor state"
    : "server markup: no data-intro — static and identical for every visitor",
);

// ── Warm-up (discarded) ────────────────────────────────────────────────────
await run("warm-up (discarded)", { preHydrationScript: null, quiet: true });
console.log("warm-up pass complete (first jsdom realm in a process is cold; not measured)");

// ── Real cases ─────────────────────────────────────────────────────────────
const results = {};

// Case 1 — fresh session, intro plays, no pre-paint attribute set.
results.fresh = await measure("fresh visit (server markup untouched)", { preHydrationScript: null });

// Case 2 — returning visit within the same session, or blocked storage:
// the inline script sets `data-intro="skip"` on <html> before hydration.
results.skipped = await measure("returning visit (pre-paint data-intro on <html>)", {
  preHydrationScript: (window) => {
    window.document.documentElement.dataset.intro = "skip";
  },
});

// ── Controls ───────────────────────────────────────────────────────────────
// A harness that cannot detect a mismatch proves nothing, so two classic
// mismatch classes are injected deliberately and MUST be caught.
const controls = {};
if (!PROD) {
// Control A: an extra attribute that React never rendered, on a body-level
// element (<html> itself is the documented exemption, see the header comment).
controls.attribute = await measure(
  "CONTROL A — extra attribute on <header> (must be caught)",
  { mangleHtml: (html) => html.replace("<header class=", '<header data-injected="extension" class=') },
  3,
);

// Control B: an existing attribute whose *value* differs from the client's.
// This is a different mismatch class from Control A, so the two together show
// the harness catches both an unexpected attribute and a changed one.
// (Text-node differences are deliberately not used: React does not surface
// them in this environment — verified against the header wordmark, the hero
// <h1> and the skip link, all silently ignored.)
controls.value = await measure(
  "CONTROL B — changed class value on the hero <h1> (must be caught)",
  { mangleHtml: (html) => html.replace('class="max-w-[15ch]', 'class="max-w-[14ch]') },
  3,
);

// Not a gate — this documents the blast radius of the documented exemption:
// <html>'s own extra attributes are intentionally no longer reported.
await run("note — extra attribute on <html> (documented exemption, expected quiet)", {
  mangleHtml: (html) => html.replace('<html lang="en-IN"', '<html data-extension="theme" lang="en-IN"'),
});
} else {
  console.log("\nproduction mode: dev-only controls skipped (React's production build does not print hydration diffs)");
}

// ── Verdict ────────────────────────────────────────────────────────────────
const realCases = [...results.fresh.hits, ...results.skipped.hits];
const controlFailures = [];
if (!PROD) {
  if (controls.attribute?.hits.length === 0) controlFailures.push("Control A (extra attribute) was not detected");
  if (controls.value?.hits.length === 0) controlFailures.push("Control B (changed attribute value) was not detected");
}

console.log("\n════════ summary ════════");
console.log(`server markup:   ${ssrCarriesFlag ? "carries data-intro (FAIL)" : "static, no data-intro"}`);
console.log(
  `app markup:      ${realCases.length === 0 ? "clean" : `${realCases.length} warning(s)`}` +
    `  (fresh warnings per attempt: [${results.fresh.perAttempt.join(", ")}],` +
    ` returning: [${results.skipped.perAttempt.join(", ")}])`,
);
for (const text of realCases) console.log(`  ✗ ${text}`);
console.log(
  `controls:        ${PROD ? "skipped in production mode" : controlFailures.length === 0 ? "both caught (harness is sensitive)" : "FAILED"}`,
);
for (const text of controlFailures) console.log(`  ✗ ${text}`);
if (controls.attribute?.hits.length)
  console.log(`  ✓ Control A caught (warnings per attempt: [${controls.attribute.perAttempt.join(", ")}])`);
if (controls.value?.hits.length)
  console.log(`  ✓ Control B caught (warnings per attempt: [${controls.value.perAttempt.join(", ")}])`);

const failed = realCases.length > 0 || controlFailures.length > 0 || ssrCarriesFlag;
console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
