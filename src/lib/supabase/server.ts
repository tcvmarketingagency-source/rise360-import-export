import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Request-scoped Supabase client for staff authentication (cookie based).
 * Used by the admin area to read the signed-in user — never by customer pages.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* Called from a Server Component render: cookies are read-only there. */
        }
      },
    },
  }) as unknown as SupabaseClient;
}

export interface StaffSession {
  userId: string;
  email: string | null;
  role: string;
  fullName: string | null;
}

/**
 * Resolves the signed-in user and confirms the `staff` role.
 * Customers can never reach staff-only screens or records: every check happens
 * on the server, and RLS enforces the same rule at the database level.
 */
export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("role, full_name, is_active")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!profile || profile.is_active === false) return null;

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    role: (profile.role as string) ?? "viewer",
    fullName: (profile.full_name as string | null) ?? null,
  };
}
