"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MicroLabel } from "@/components/ui/Bits";
import { formatPrice } from "@/lib/format";

export interface AdminMenuItem {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  price_paise: number;
  is_available: boolean;
  is_published: boolean;
  dietary_kind: string | null;
  dietary_verified: boolean;
  unavailable_note: string | null;
}

export function MenuManager({ items }: { items: AdminMenuItem[] }) {
  const [rows, setRows] = useState(items);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const patch = async (id: string, body: Record<string, unknown>, optimistic: Partial<AdminMenuItem>) => {
    setBusyId(id);
    setMessage(null);
    const previous = rows;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...optimistic } : row)));
    try {
      const response = await fetch(`/api/admin/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: { ok?: boolean; error?: string } = await response.json();
      if (!response.ok || !data.ok) {
        setRows(previous);
        setMessage({ kind: "error", text: data.error ?? "Update failed." });
        return;
      }
      setMessage({ kind: "ok", text: "Saved." });
    } catch {
      setRows(previous);
      setMessage({ kind: "error", text: "Network error — nothing was saved." });
    } finally {
      setBusyId(null);
    }
  };

  const savePrice = (row: AdminMenuItem, rupees: string) => {
    const parsed = Number.parseFloat(rupees);
    if (Number.isNaN(parsed) || parsed < 0) {
      setMessage({ kind: "error", text: "Enter a valid price in rupees." });
      return;
    }
    const paise = Math.round(parsed * 100);
    void patch(row.id, { pricePaise: paise }, { price_paise: paise });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-sm border border-ivory/12 bg-char/50 p-5">
        <h2 className="text-[1.1rem] text-ivory">Menu control</h2>
        <p className="mt-2 max-w-3xl text-[0.88rem] leading-relaxed text-ash">
          Prices are stored in paise (integers) so no rounding error can reach a customer&apos;s total. Items stay
          invisible to customers until they are published, and dietary labels stay unverified until someone at
          the restaurant confirms them in writing.
        </p>
        {message ? (
          <p
            role="status"
            className={`mt-3 text-[0.84rem] ${message.kind === "ok" ? "text-herb" : "text-chili"}`}
          >
            {message.text}
          </p>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-sm border border-ivory/12 bg-char/40 px-5 py-8 text-[0.9rem] text-ash">
          No menu rows yet. Import Maitri&apos;s approved menu into <code>menu_items</code>, or keep serving the
          sample menu from <code>src/lib/menu/sample-menu.ts</code> until it is ready.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="grid gap-4 rounded-sm border border-ivory/12 bg-char/40 p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] lg:items-center"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[0.98rem] text-ivory">{row.name}</span>
                <span className="text-[0.8rem] text-ash">{row.summary}</span>
                <span className="micro text-ash/70">
                  {row.dietary_kind ?? "no dietary label"}
                  {row.dietary_kind && !row.dietary_verified ? " · unverified" : ""}
                </span>
              </div>

              <label className="flex items-center gap-2">
                <span className="micro text-ash">Price ₹</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={(row.price_paise / 100).toFixed(2)}
                  onBlur={(event) => savePrice(row, event.target.value)}
                  className="h-11 w-24 rounded-sm border border-ivory/15 bg-ink/50 px-3 text-[0.9rem] text-ivory focus-visible:border-amber"
                  aria-label={`Price for ${row.name} in rupees`}
                />
                <span className="micro text-ash/70">{formatPrice(row.price_paise)}</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={row.is_available ? "quiet" : "danger"}
                  disabled={busyId === row.id}
                  onClick={() =>
                    patch(
                      row.id,
                      {
                        isAvailable: !row.is_available,
                        unavailableNote: row.is_available ? "Not available at the moment." : null,
                      },
                      { is_available: !row.is_available },
                    )
                  }
                >
                  {row.is_available ? "Mark unavailable" : "Mark available"}
                </Button>
                <Button
                  size="sm"
                  variant={row.is_published ? "secondary" : "primary"}
                  disabled={busyId === row.id}
                  onClick={() =>
                    patch(row.id, { isPublished: !row.is_published }, { is_published: !row.is_published })
                  }
                >
                  {row.is_published ? "Unpublish" : "Publish"}
                </Button>
                {row.is_published ? <MicroLabel tone="amber">Live</MicroLabel> : <MicroLabel>Draft</MicroLabel>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
