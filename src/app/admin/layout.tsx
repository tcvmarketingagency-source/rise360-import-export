import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff dashboard",
  description: "Order management for Maitri Residency (concept build).",
  robots: { index: false, follow: false, nocache: true },
};

/** Admin surface is never indexed and never linked from customer navigation. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-ink pt-[72px]">{children}</div>;
}
