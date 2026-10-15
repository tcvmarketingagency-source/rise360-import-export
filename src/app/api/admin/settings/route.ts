import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Nullable on purpose: a null value means "not confirmed yet", which is a
 *  legitimate state for this business and must not silently become ₹0. */
const nullablePaise = z.number().int().nonnegative().max(1_000_000).nullable();

const bodySchema = z.object({
  deliveryChargePaise: nullablePaise.optional(),
  minimumOrderPaise: nullablePaise.optional(),
  freeDeliveryOverPaise: nullablePaise.optional(),
  taxesEnabled: z.boolean().optional(),
  taxPercent: z.number().min(0).max(50).nullable().optional(),
  acceptsCash: z.boolean().optional(),
  acceptsUpi: z.boolean().optional(),
  acceptsOnline: z.boolean().optional(),
  announcement: z.string().trim().max(200).nullable().optional(),
});

export async function PUT(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings." },
      { status: 422 },
    );
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Settings service unavailable." }, { status: 503 });
  }

  const input = parsed.data;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.deliveryChargePaise !== undefined) updates.delivery_charge_paise = input.deliveryChargePaise;
  if (input.minimumOrderPaise !== undefined) updates.minimum_order_paise = input.minimumOrderPaise;
  if (input.freeDeliveryOverPaise !== undefined)
    updates.free_delivery_over_paise = input.freeDeliveryOverPaise;
  if (input.taxesEnabled !== undefined) updates.taxes_enabled = input.taxesEnabled;
  if (input.taxPercent !== undefined) updates.tax_percent = input.taxPercent;
  if (input.acceptsCash !== undefined) updates.accepts_cash = input.acceptsCash;
  if (input.acceptsUpi !== undefined) updates.accepts_upi = input.acceptsUpi;
  if (input.acceptsOnline !== undefined) updates.accepts_online = input.acceptsOnline;
  if (input.announcement !== undefined) updates.announcement = input.announcement;

  const { data, error } = await supabase
    .from("service_settings")
    .update(updates)
    .eq("id", 1)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: "Could not save settings." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, settings: data });
}
