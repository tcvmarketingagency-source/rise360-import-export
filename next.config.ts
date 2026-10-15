import type { NextConfig } from "next";

/**
 * Security headers are intentionally conservative: this concept build should be
 * safe to share as a preview link before Maitri approves a production domain.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * Development only. The dev server is reached through a proxied preview host
   * (for example https://3000-<id>.e2b.app), so those origins must be trusted
   * explicitly or Next.js rejects dev asset and HMR requests. Production builds
   * and previews are unaffected by this option.
   */
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev", "*.vercel.app", "localhost", "127.0.0.1"],
  images: {
    // Local, art-directed assets only — no remote loaders until Maitri supplies
    // approved photography and a domain allowlist.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 828, 1080, 1280, 1600, 1920, 2560],
    // Declared explicitly: Next 16 requires it, and it keeps every component's
    // chosen quality intentional rather than silently rounded.
    qualities: [70, 75, 78, 80, 82, 84, 90],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
