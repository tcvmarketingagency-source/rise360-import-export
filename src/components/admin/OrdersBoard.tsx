"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MicroLabel } from "@/components/ui/Bits";
import { formatPrice } from "@/lib/format";
import { nextStatus as nextStatusMap, statusLabel, statusTransitions, type OrderStatus } from "@/lib/orders/status";

export interface AdminOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_area: string;
  delivery_instructions: string | null;
  subtotal_paise: number;
  total_paise: number;
  item_count: number;
  order_summary: string | null;
  created_at: string;
}

export function OrdersBoard({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter],
  );

  const updateStatus = async (order: AdminOrder, status: OrderStatus, note?: string) => {
    setBusyId(order.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const data: { ok?: boolean; error?: string } = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not update the order.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — the order was not updated.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter orders by status">
        {(["all", "pending", "accepted", "preparing", "dispatched", "delivered", "cancelled"] as const).map(
          (status) => {
            const active = filter === status;
            const total = status === "all" ? orders.length : orders.filter((o) => o.status === status).length;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                aria-pressed={active}
                className={`micro h-10 rounded-full border px-4 transition-colors ${
                  active ? "border-amber/70 bg-amber/12 text-amber" : "border-ivory/15 text-ivory/70"
                }`}
              >
                {status === "all" ? "All" : statusLabel[status]} · {total}
              </button>
            );
          },
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-sm border border-chili/40 bg-chili/10 px-4 py-3 text-[0.85rem] text-chili">
          {error}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-sm border border-ivory/12 bg-char/40 px-5 py-8 text-[0.9rem] text-ash">
          No orders in this view. {orders.length === 0 ? "New orders appear here automatically." : ""}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((order) => {
            const nextStatus = nextStatusMap[order.status];
            const allowed = statusTransitions[order.status] ?? [];
            const expanded = openId === order.id;
            return (
              <li key={order.id} className="rounded-sm border border-ivory/12 bg-char/50 p-5" data-testid="admin-order">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <MicroLabel tone="amber">{order.reference}</MicroLabel>
                      <span className="micro rounded-full border border-ivory/20 px-2.5 py-1 text-ivory/75">
                        {statusLabel[order.status]}
                      </span>
                      <span className="micro text-ash/70">
                        {new Date(order.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Asia/Kolkata",
                        })}
                      </span>
                    </div>
                    <p className="text-[1rem] text-ivory">
                      {order.customer_name} · {order.customer_phone}
                    </p>
                    <p className="max-w-xl text-[0.86rem] leading-relaxed text-ash">
                      {order.delivery_address} · {order.delivery_area}
                    </p>
                    {order.delivery_instructions ? (
                      <p className="text-[0.82rem] text-clay">Note: {order.delivery_instructions}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="tnum text-[1.1rem] text-ivory">{formatPrice(order.total_paise)}</span>
                    <span className="micro text-ash">{order.item_count} items</span>
                    <button
                      type="button"
                      onClick={() => setOpenId(expanded ? null : order.id)}
                      className="micro text-amber hover:underline"
                    >
                      {expanded ? "Hide summary" : "View summary"}
                    </button>
                  </div>
                </div>

                {expanded && order.order_summary ? (
                  <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-sm border border-ivory/10 bg-ink/60 p-4 text-[0.78rem] leading-relaxed text-ivory/85">
{order.order_summary}
                  </pre>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ivory/10 pt-4">
                  {nextStatus ? (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(order, nextStatus)}
                      disabled={busyId === order.id}
                      data-testid={`admin-advance-${order.status}`}
                    >
                      Move to {statusLabel[nextStatus]}
                    </Button>
                  ) : null}
                  {allowed.includes("rejected") ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => updateStatus(order, "rejected", "Rejected by staff.")}
                      disabled={busyId === order.id}
                    >
                      Reject
                    </Button>
                  ) : null}
                  {allowed.includes("cancelled") ? (
                    <Button
                      size="sm"
                      variant="quiet"
                      onClick={() => updateStatus(order, "cancelled", "Cancelled by staff.")}
                      disabled={busyId === order.id}
                    >
                      Cancel
                    </Button>
                  ) : null}
                  <a
                    href={`tel:${order.customer_phone.replace(/\s+/g, "")}`}
                    className="micro ml-auto rounded-full border border-ivory/18 px-4 py-2 text-ivory/80 hover:border-amber/60 hover:text-amber"
                  >
                    Call customer
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
