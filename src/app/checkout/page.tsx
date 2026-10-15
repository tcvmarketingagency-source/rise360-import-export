import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { orderModeMeta, orderMode } from "@/lib/config/order";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Review your order and delivery details for Hotel Maitri, Karimnagar. Concept preview — no orders are transmitted.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="min-h-dvh bg-ink">
      <p className="sr-only">
        Checkout for the Maitri Residency concept experience. Current order mode: {orderModeMeta[orderMode].label}.
      </p>
      <CheckoutFlow />
    </div>
  );
}
