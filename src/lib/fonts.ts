import localFont from "next/font/local";

/**
 * Self-hosted variable fonts (subset: latin).
 * Why self-hosted: zero third-party requests at runtime, no layout shift,
 * and the build does not depend on an external font CDN.
 */

export const fraunces = localFont({
  src: [
    { path: "../../public/fonts/fraunces-variable.woff2", weight: "100 900", style: "normal" },
    {
      path: "../../public/fonts/fraunces-variable-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Iowan Old Style", "Georgia", "serif"],
  preload: true,
  adjustFontFallback: "Times New Roman",
});

export const interTight = localFont({
  src: [{ path: "../../public/fonts/inter-tight-variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter-tight",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  preload: true,
  adjustFontFallback: "Arial",
});

export const jetbrainsMono = localFont({
  src: [{ path: "../../public/fonts/jetbrains-mono-variable.woff2", weight: "100 800", style: "normal" }],
  variable: "--font-jetbrains-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
  preload: false,
});
