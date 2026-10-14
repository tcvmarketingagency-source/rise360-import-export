import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    pricePaise: z.number().int().nonnegative().max(10_000_00).optional(),
    isAvailable: z.boolean().optional(),
    unavailableNote: z.string().trim().max(200).nullable().optional(),
    isPublished: z.boolean().optional(),
    name: z.string().trim().min(2).max(80).optional(),
    summary: z.string().trim().max(200).optional(),
    description: z.string().trim().max(1200).optional(),
    dietaryVerified: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update." });

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
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid update." },
      { status: 422 },
    );
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Menu service unavailable." }, { status: 503 });
  }

  const updates: Record<string, unknown> = {};
  const input = parsed.data;
  if (input.pricePaise !== undefined) updates.price_paise = input.pricePaise;
  if (input.isAvailable !== undefined) updates.is_available = input.isAvailable;
  if (input.unavailableNote !== undefined) updates.unavailable_note = input.unavailableNote;
  if (input.isPublished !== undefined) updates.is_published = input.isPublished;
  if (input.name !== undefined) updates.name = input.name;
  if (input.summary !== undefined) updates.summary = input.summary;
  if (input.description !== undefined) updates.description = input.description;
  if (input.dietaryVerified !== undefined) updates.dietary_verified = input.dietaryVerified;

  const { data, error } = await supabase
    .from("menu_items")
    .update(updates)
    .eq("id", id)
    .select("id, name, price_paise, is_available, is_published")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: "Could not update the item." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: data });
}
