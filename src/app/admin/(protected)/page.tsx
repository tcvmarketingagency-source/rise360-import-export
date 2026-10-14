import { OrdersBoard, type AdminOrder } from "@/components/admin/OrdersBoard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { orderMode, orderModeMeta } from "@/lib/config/order";
import { statusLabel, type OrderStatus } from "@/lib/orders/status";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return <p className="text-ash">Supabase is not configured.</p>;
  }

  // RLS restricts this query to staff sessions — a customer session sees nothing.
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, reference, status, customer_name, customer_phone, delivery_address, delivery_area, delivery_instructions, subtotal_paise, total_paise, item_count, order_summary, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(120);

  const orders = (data ?? []) as AdminOrder[];
  const counts = (Object.keys(statusLabel) as OrderStatus[]).map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-sm border border-ivory/12 bg-char/50 p-5">
        <h2 className="text-[1.1rem] text-ivory">How orders reach you</h2>
        <p className="mt-2 max-w-3xl text-[0.88rem] leading-relaxed text-ash">
          Current order mode: <span className="text-ivory/85">{orderModeMeta[orderMode].label}</span>.{" "}
          {orderModeMeta[orderMode].summary}
        </p>
        {orderMode !== "online" ? (
          <p className="mt-3 rounded-sm border border-turmeric/30 bg-turmeric/8 px-4 py-3 text-[0.84rem] text-turmeric/90">
            This list stays empty until <code>NEXT_PUBLIC_ORDER_MODE=online</code> and Supabase credentials are
            configured. Nothing is faked in this build.
          </p>
        ) : null}
      </section>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts
          .filter((entry) => entry.count > 0 || entry.status === "pending" || entry.status === "accepted")
          .slice(0, 8)
          .map((entry) => (
            <li key={entry.status} className="rounded-sm border border-ivory/12 bg-ink/40 px-4 py-3">
              <span className="micro text-ash">{statusLabel[entry.status]}</span>
              <p className="tnum mt-2 text-[1.5rem] text-ivory">{entry.count}</p>
            </li>
          ))}
      </ul>

      {error ? (
        <p className="rounded-sm border border-chili/40 bg-chili/10 px-4 py-3 text-[0.85rem] text-chili">
          Orders could not be loaded: {error.message}
        </p>
      ) : (
        <OrdersBoard orders={orders} />
      )}
    </div>
  );
}
