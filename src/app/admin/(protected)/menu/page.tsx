import { MenuManager, type AdminMenuItem } from "@/components/admin/MenuManager";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <p className="text-ash">Supabase is not configured.</p>;

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, slug, name, summary, price_paise, is_available, is_published, dietary_kind, dietary_verified, unavailable_note")
    .order("name", { ascending: true });

  if (error) {
    return (
      <p className="rounded-sm border border-chili/40 bg-chili/10 px-4 py-3 text-[0.85rem] text-chili">
        Menu items could not be loaded: {error.message}
      </p>
    );
  }

  return <MenuManager items={(data ?? []) as AdminMenuItem[]} />;
}
