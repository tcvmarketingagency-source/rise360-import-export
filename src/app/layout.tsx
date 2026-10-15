import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fraunces, interTight, jetbrainsMono } from "@/lib/fonts";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { IntroOverlay } from "@/components/intro/IntroOverlay";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartToast } from "@/components/ui/Toast";
import { MobileOrderBar } from "@/components/layout/MobileOrderBar";
import { StructuredData } from "@/components/seo/StructuredData";
import { brand, siteUrl } from "@/lib/config/business";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Maitri Residency, Karimnagar — Menu & Doorstep Delivery (Concept)",
    template: "%s · Maitri Residency",
  },
  description:
    "A cinematic concept experience for Maitri Residency / Hotel Maitri, Karimnagar: browse the sample menu, build an order and see how doorstep delivery would work. Concept build — not the restaurant's official site.",
  applicationName: "Maitri Residency — Concept Experience",
  authors: [{ name: "Concept build for Maitri Residency" }],
  keywords: [
    "Maitri Residency",
    "Hotel Maitri Karimnagar",
    "Karimnagar restaurant",
    "food delivery Karimnagar",
    "biryani Karimnagar",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: brand.name,
    title: "Maitri Residency — A taste that feels closer",
    description:
      "Sample menu, order builder and delivery preview for Hotel Maitri, Karimnagar. Concept build pending approval.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maitri Residency — A taste that feels closer",
    description:
      "Sample menu, order builder and delivery preview for Hotel Maitri, Karimnagar. Concept build pending approval.",
  },
  category: "restaurant",
  formatDetection: { telephone: true, address: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0706",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Runs before first paint: hides the intro overlay for visitors who already saw
 * it this session, so a returning visitor lands straight on the hero instead of
 * watching the film again.
 *
 * Only the *session* case is handled here. `prefers-reduced-motion` is decided
 * purely in CSS (see the intro-gating block in globals.css), so that half needs
 * no script, no storage read and no DOM write at all.
 *
 * `sessionStorage` is the visitor's own browser state; the server cannot know
 * it, so this attribute is written before hydration by design. React is told
 * about that deliberate, single-attribute difference on <html> below.
 *
 * The second half of the script exists because the overlay is server-rendered:
 * it is on screen — with its SKIP control — several hundred milliseconds before
 * React hydrates and attaches `IntroOverlay`'s handlers. A dismissal in that
 * window used to be swallowed (measured: hydration at ~1.9s on this build), so
 * the visitor was held behind the whole film after pressing SKIP. The native
 * listeners below release the intro exactly the way the React version does, by
 * writing the same flag the CSS gate already understands, and they stay passive
 * and disappear from the equation once the overlay unmounts (the `closest`
 * lookup simply never matches again).
 */
const introFlagScript = `try{
var d=document.documentElement,k='maitri.intro.v2',done=false;
var inside=function(t){return t&&t.closest&&t.closest('[data-intro-root]')};
var onClick=function(e){if(inside(e.target))release()};
var onKey=function(){release()};
var onTouch=function(e){if(inside(e.target))release()};
var release=function(){
if(done)return;done=true;
document.removeEventListener('click',onClick,true);
document.removeEventListener('keydown',onKey,true);
document.removeEventListener('wheel',onTouch,true);
document.removeEventListener('touchstart',onTouch,true);
d.dataset.intro='skip';
try{sessionStorage.setItem(k,'done')}catch(e){}
};
if(sessionStorage.getItem(k)==='done'){d.dataset.intro='skip'}else{
document.addEventListener('click',onClick,true);
document.addEventListener('keydown',onKey,true);
document.addEventListener('wheel',onTouch,{passive:true,capture:true});
document.addEventListener('touchstart',onTouch,{passive:true,capture:true});
}}catch(e){document.documentElement.dataset.intro='skip'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /**
     * `suppressHydrationWarning` is scoped to this <html> element only and is
     * the one documented React escape hatch for attributes that a pre-paint
     * script owns before hydration (the same pattern React and Next recommend
     * for theme scripts). It covers <html>'s own attribute diff — children are
     * still validated normally, so real mismatches elsewhere still surface.
     * Verified against react-dom 19.1's diffHydratedProperties: the flag only
     * clears extra-attribute reporting for the element that carries it.
     * The only such attribute here is `data-intro`, set by introFlagScript.
     */
    <html
      lang="en-IN"
      className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: introFlagScript }} />
        {/* Without JavaScript the intro can never finish, so it is removed and
            the visitor gets the full page immediately. */}
        <noscript>
          <style>{`[data-intro-root]{display:none !important}`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh bg-ink text-ivory antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <MotionProvider>
          <CartProvider>
            <IntroOverlay />
            <SiteHeader />
            <main id="main" className="relative">
              {children}
            </main>
            <SiteFooter />
            <MobileOrderBar />
            <CartDrawer />
            <CartToast />
          </CartProvider>
        </MotionProvider>
        <StructuredData />
      </body>
    </html>
  );
}
