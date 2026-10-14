import { NextResponse } from "next/server";
import { orderMode } from "@/lib/config/order";
import { rateLimit, verifyOrderPayload } from "@/lib/orders/server";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { buildOrderMessage } from "@/lib/orders/message";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Persistent order intake (Mode B).
 *
 * Disabled unless NEXT_PUBLIC_ORDER_MODE=online AND Supabase is configured.
 * The concept preview therefore cannot create a real order even if someone
 * posts to this endpoint directly.
 */
export async function POST(request: Request) {
  if (orderMode !== "online") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Persistent ordering is switched off in this configuration. Orders are not being accepted by this build.",
      },
      { status: 403 },
    );
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "The order service is not configured yet, so nothing was saved. Please call the delivery line to place this order.",
      },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`order:${ip}`)) {
    return NextResponse.json(
      { ok: false, error: "Too many order attempts from this connection. Please try again shortly." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request body." }, { status: 400 });
  }

  const verified = verifyOrderPayload(raw);
  if (!verified.ok) {
    return NextResponse.json(
      { ok: false, error: verified.error, fieldErrors: verified.fieldErrors },
      { status: verified.status },
    );
  }

  const { order } = verified;
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Order service unavailable." }, { status: 503 });
  }

  const summary = buildOrderMessage({
    reference: order.reference,
    customerName: order.payload.customerName,
    phone: order.payload.phone,
    address: order.payload.address,
    area: order.payload.area,
    instructions: order.payload.instructions,
    lines: order.payload.lines,
    subtotalPaise: order.subtotalPaise,
    deliveryPaise: null,
    taxesPaise: null,
    totalPaise: order.subtotalPaise,
    placedAt: new Date(),
  });

  const { data: inserted, error } = await supabase
    .from("orders")
    .insert({
      reference: order.reference,
      status: "pending",
      customer_name: order.payload.customerName,
      customer_phone: order.payload.phone,
      delivery_address: order.payload.address,
      delivery_area: order.payload.area,
      delivery_instructions: order.payload.instructions ?? null,
      fulfilment: order.payload.fulfilment,
      subtotal_paise: order.subtotalPaise,
      delivery_paise: null,
      taxes_paise: null,
      total_paise: order.subtotalPaise,
      item_count: order.lineCount,
      order_summary: summary,
      source: "website",
    })
    .select("id, reference, status, created_at")
    .single();

  if (error || !inserted) {
    console.error("[orders] insert failed", error?.message);
    return NextResponse.json(
      {
        ok: false,
        error:
          "We could not save the order. Nothing was charged — please call the delivery line to place it.",
      },
      { status: 500 },
    );
  }

  const items = order.payload.lines.map((line) => ({
    order_id: inserted.id as string,
    item_id: line.itemId,
    item_name: line.name,
    quantity: line.quantity,
    unit_price_paise: line.unitPricePaise,
    line_total_paise: line.lineTotalPaise,
    options: line.selections.map((selection) => ({
      group: selection.groupLabel,
      choices: selection.choiceLabels,
    })),
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(items);
  if (itemsError) {
    console.error("[orders] order_items insert failed", itemsError.message);
  }

  await supabase.from("order_events").insert({
    order_id: inserted.id as string,
    status: "pending",
    note: "Order received from the website.",
  });

  // Staff notification is only attempted when an approved channel is configured.
  const webhook = process.env.ORDER_NOTIFICATION_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.ORDER_NOTIFICATION_WEBHOOK_SECRET
            ? { "x-maitri-secret": process.env.ORDER_NOTIFICATION_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify({ reference: inserted.reference, summary }),
      });
    } catch (notificationError) {
      // The order is already stored; a failed notification must not fail the order.
      console.error("[orders] staff notification failed", notificationError);
    }
  }

  return NextResponse.json({
    ok: true,
    reference: inserted.reference as string,
    status: inserted.status as string,
  });
}
