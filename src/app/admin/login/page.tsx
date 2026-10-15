import Link from "next/link";
import { SetupPanel } from "@/components/admin/SetupPanel";
import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export default function AdminLoginPage() {
  if (!isSupabaseConfigured()) {
    return <SetupPanel title="Staff sign-in" />;
  }

  return (
    <div className="shell flex min-h-[70svh] flex-col justify-center gap-8 py-20">
      <div className="flex flex-col gap-3">
        <span className="micro text-amber">Staff access</span>
        <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] leading-tight text-ivory">Sign in to manage orders</h1>
      </div>
      <LoginForm />
      <Link href="/" className="micro text-ash hover:text-ivory">
        ← Back to the site
      </Link>
    </div>
  );
}
