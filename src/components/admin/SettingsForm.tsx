"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

export interface AdminSettings {
  delivery_charge_paise: number | null;
  minimum_order_paise: number | null;
  free_delivery_over_paise: number | null;
  taxes_enabled: boolean;
  tax_percent: number | null;
  accepts_cash: boolean;
  accepts_upi: boolean;
  accepts_online: boolean;
  announcement: string | null;
}

const toRupees = (paise: number | null) => (paise === null ? "" : (paise / 100).toFixed(2));

export function SettingsForm({ settings }: { settings: AdminSettings }) {
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const parseRupees = (value: string): number | null => {
      if (value.trim() === "") return null; // null = "not confirmed yet"
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? null : Math.round(parsed * 100);
    };

    const payload = {
      deliveryChargePaise: form.delivery_charge_paise,
      minimumOrderPaise: form.minimum_order_paise,
      freeDeliveryOverPaise: form.free_delivery_over_paise,
      taxesEnabled: form.taxes_enabled,
      taxPercent: form.tax_percent,
      acceptsCash: form.accepts_cash,
      acceptsUpi: form.accepts_upi,
      acceptsOnline: form.accepts_online,
      announcement: form.announcement,
    };
    void parseRupees;

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: { ok?: boolean; error?: string } = await response.json();
      if (!response.ok || !data.ok) {
        setMessage({ kind: "error", text: data.error ?? "Could not save settings." });
        return;
      }
      setMessage({ kind: "ok", text: "Delivery and service settings saved." });
    } catch {
      setMessage({ kind: "error", text: "Network error — settings were not saved." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-8" noValidate>
      <section className="flex flex-col gap-5 rounded-sm border border-ivory/12 bg-char/50 p-5">
        <h2 className="text-[1.1rem] text-ivory">Delivery economics</h2>
        <p className="text-[0.86rem] leading-relaxed text-ash">
          Leave a field empty until Maitri confirms it. An empty field means the customer sees &ldquo;to be
          confirmed&rdquo; instead of a number nobody agreed to.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            label="Delivery charge ₹"
            name="delivery_charge"
            inputMode="decimal"
            value={toRupees(form.delivery_charge_paise)}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                delivery_charge_paise: event.target.value === "" ? null : Math.round(Number(event.target.value) * 100),
              }))
            }
            micro
          />
          <TextField
            label="Minimum order ₹"
            name="minimum_order"
            inputMode="decimal"
            value={toRupees(form.minimum_order_paise)}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                minimum_order_paise: event.target.value === "" ? null : Math.round(Number(event.target.value) * 100),
              }))
            }
            micro
          />
          <TextField
            label="Free delivery over ₹"
            name="free_delivery"
            inputMode="decimal"
            value={toRupees(form.free_delivery_over_paise)}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                free_delivery_over_paise: event.target.value === "" ? null : Math.round(Number(event.target.value) * 100),
              }))
            }
            micro
          />
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-sm border border-ivory/12 bg-char/50 p-5">
        <h2 className="text-[1.1rem] text-ivory">Payment methods</h2>
        <div className="flex flex-wrap gap-3">
          {(
            [
              { key: "accepts_cash" as const, label: "Cash on delivery" },
              { key: "accepts_upi" as const, label: "UPI" },
              { key: "accepts_online" as const, label: "Online payment (Razorpay, credentials required)" },
            ] as const
          ).map((option) => {
            const active = form[option.key];
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={active}
                onClick={() => setForm((current) => ({ ...current, [option.key]: !active }))}
                className={`min-h-[44px] rounded-full border px-4 text-[0.84rem] transition-colors ${
                  active ? "border-amber/70 bg-amber/12 text-amber" : "border-ivory/15 text-ivory/70"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="text-[0.8rem] text-ash/80">
          Razorpay stays off until Maitri supplies and authorises keys. Payment keys live server-side only — this
          dashboard never sees them.
        </p>
      </section>

      <section className="flex flex-col gap-5 rounded-sm border border-ivory/12 bg-char/50 p-5">
        <h2 className="text-[1.1rem] text-ivory">Announcement</h2>
        <TextField
          label="Banner copy"
          name="announcement"
          value={form.announcement ?? ""}
          maxLength={200}
          onChange={(event) => setForm((current) => ({ ...current, announcement: event.target.value }))}
          hint="Shown as a slim banner once approved. Left empty, no banner appears."
          micro
        />
      </section>

      {message ? (
        <p role="status" className={`text-[0.86rem] ${message.kind === "ok" ? "text-herb" : "text-chili"}`}>
          {message.text}
        </p>
      ) : null}

      <div>
        <Button type="submit" size="lg" disabled={busy} data-testid="admin-settings-save">
          {busy ? "Saving…" : "Save delivery settings"}
        </Button>
      </div>
    </form>
  );
}
