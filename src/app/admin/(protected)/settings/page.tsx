import { SettingsForm, type AdminSettings } from "@/components/admin/SettingsForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const fallback: AdminSettings = {
  delivery_charge_paise: null,
  minimum_order_paise: null,
  free_delivery_over_paise: null,
  taxes_enabled: false,
  tax_percent: null,
  accepts_cash: true,
  accepts_upi: false,
  accepts_online: false,
  announcement: null,
};

export default async function AdminSettingsPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <p className="text-ash">Supabase is not configured.</p>;

  const { data } = await supabase
    .from("service_settings")
    .select(
      "delivery_charge_paise, minimum_order_paise, free_delivery_over_paise, taxes_enabled, tax_percent, accepts_cash, accepts_upi, accepts_online, announcement",
    )
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-sm border border-ivory/12 bg-char/50 p-5">
        <h2 className="text-[1.1rem] text-ivory">Delivery areas</h2>
        <p className="mt-2 max-w-3xl text-[0.88rem] leading-relaxed text-ash">
          Zones live in the <code>delivery_zones</code> table (name, pincodes, charge, minimum, estimated time,
          active flag). Nothing appears on the customer site until Maitri confirms the zone list — the delivery
          section currently shows a clearly labelled placeholder instead.
        </p>
      </section>

      <SettingsForm settings={(data as AdminSettings) ?? fallback} />
    </div>
  );
}
