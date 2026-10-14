import "server-only";
import { NextResponse } from "next/server";
import { getStaffSession, type StaffSession } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

/**
 * Server-side authorization for every admin API route.
 *
 * A missing session, a non-staff user or an unconfigured project all resolve to
 * an explicit error response — there is no "demo mode" that silently allows
 * writes.
 */
export type GuardResult =
  | { ok: true; session: StaffSession }
  | { ok: false; response: NextResponse };

export async function requireStaff(): Promise<GuardResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error:
            "Admin access requires Supabase configuration (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY). No keys are invented in this concept build.",
        },
        { status: 503 },
      ),
    };
  }

  const session = await getStaffSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Sign in with a staff account first." },
        { status: 401 },
      ),
    };
  }

  return { ok: true, session };
}

export {
  ORDER_STATUSES,
  canTransition,
  nextStatus,
  statusLabel,
  statusTransitions,
  type OrderStatus,
} from "@/lib/orders/status";
