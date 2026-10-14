import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupPanel } from "@/components/admin/SetupPanel";
import { getStaffSession } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

/**
 * Server-side gate for every staff screen. Customers cannot reach these routes
 * even by typing the URL, and the database enforces the same rule again.
 */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <SetupPanel title="Staff ordering dashboard" />;
  }

  const session = await getStaffSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="shell flex flex-col gap-8 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory/10 pb-5">
        <div className="flex flex-col gap-2">
          <span className="micro text-amber">Staff dashboard</span>
          <h1 className="text-[1.6rem] leading-tight text-ivory">Maitri Residency · orders</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-4" aria-label="Admin sections">
          <Link href="/admin" className="micro text-ivory/80 hover:text-amber">
            Orders
          </Link>
          <Link href="/admin/menu" className="micro text-ivory/80 hover:text-amber">
            Menu
          </Link>
          <Link href="/admin/settings" className="micro text-ivory/80 hover:text-amber">
            Delivery & service
          </Link>
          <span className="micro text-ash/70">{session.email}</span>
        </nav>
      </header>
      {children}
    </div>
  );
}
