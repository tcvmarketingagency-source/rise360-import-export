import type { Metadata } from "next";
import { Hero } from "@/components/hero/Hero";
import { StorySection } from "@/components/sections/StorySection";
import { MenuSection } from "@/components/sections/MenuSection";
import { FavouritesSection } from "@/components/sections/FavouritesSection";
import { OrderProcessSection } from "@/components/sections/OrderProcessSection";
import { DeliverySection } from "@/components/sections/DeliverySection";
import { BeyondSection } from "@/components/sections/BeyondSection";
import { FinalSection } from "@/components/sections/FinalSection";

export const metadata: Metadata = {
  title: "Maitri Residency, Karimnagar — A taste that feels closer (Concept)",
  description:
    "Cinematic concept experience for Maitri Residency / Hotel Maitri, Karimnagar: explore the sample menu, build an order and see how doorstep delivery is proposed to work.",
  alternates: { canonical: "/" },
};

/**
 * Page composition keeps server rendering for every static section, and only
 * the pieces that genuinely move (hero 3D, scroll story, menu, cart) are client
 * components. No `"use client"` at the page level.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <StorySection />
      <MenuSection />
      <FavouritesSection />
      <OrderProcessSection />
      <DeliverySection />
      <BeyondSection />
      <FinalSection />
    </>
  );
}
