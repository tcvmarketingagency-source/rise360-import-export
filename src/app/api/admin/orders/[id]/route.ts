import { NextResponse } from "next/server";
import { z } from "zod";
import { canTransition, ORDER_STATUSES, requireStaff, type OrderStatus } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(300).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Unknown status value." }, { status: 422 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Order service unavailable." }, { status: 503 });
  }

  const { data: current, error: readError } = await supabase
    .from("orders")
    .select("id, status, reference")
    .eq("id", id)
    .maybeSingle();

  if (readError || !current) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  const from = current.status as OrderStatus;
  const to = parsed.data.status as OrderStatus;

  if (from !== to && !canTransition(from, to)) {
    return NextResponse.json(
      { ok: false, error: `An order that is ${from} cannot move to ${to}.` },
      { status: 409 },
    );
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: to, staff_note: parsed.data.note ?? null })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: "Could not update the order." }, { status: 500 });
  }

  await supabase.from("order_events").insert({
    order_id: id,
    status: to,
    note: parsed.data.note ?? `Status set to ${to} by ${guard.session.email ?? "staff"}.`,
    actor: guard.session.userId,
  });

  return NextResponse.json({ ok: true, status: to });
}
