import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DietaryKind, MenuItem, MenuSource, MenuOptionGroup, SpiceLevel } from "./types";

/**
 * Maps published Supabase rows into the same `MenuSource` shape the sample menu
 * uses, so switching the site from sample content to Maitri's approved menu is a
 * data-source change and nothing else.
 *
 * Wiring it up (once credentials exist):
 *
 *   // src/lib/menu/index.ts
 *   export async function getMenu(): Promise<MenuSource> {
 *     const supabase = await createServerSupabaseClient();
 *     if (!supabase) return sampleMenu;
 *     return (await fetchPublishedMenu(supabase)) ?? sampleMenu;
 *   }
 *
 * The exported pages then become dynamic (or use revalidate), which is the
 * intended production behaviour for a live menu.
 */

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  blurb: string | null;
  sort_order: number;
}

interface ItemRow {
  id: string;
  slug: string;
  category_id: string | null;
  name: string;
  summary: string | null;
  description: string | null;
  price_paise: number;
  image_path: string | null;
  image_alt: string | null;
  dietary_kind: DietaryKind | null;
  dietary_verified: boolean;
  spice_level: SpiceLevel | null;
  is_available: boolean;
  unavailable_note: string | null;
  option_groups: MenuOptionGroup[] | null;
  is_featured: boolean;
}

export async function fetchPublishedMenu(supabase: SupabaseClient): Promise<MenuSource | null> {
  const [categoriesResult, itemsResult] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, slug, name, blurb, sort_order")
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select(
        "id, slug, category_id, name, summary, description, price_paise, image_path, image_alt, dietary_kind, dietary_verified, spice_level, is_available, unavailable_note, option_groups, is_featured",
      )
      .eq("is_published", true),
  ]);

  if (categoriesResult.error || itemsResult.error) return null;
  const categoryRows = (categoriesResult.data ?? []) as CategoryRow[];
  const itemRows = (itemsResult.data ?? []) as ItemRow[];
  if (categoryRows.length === 0 || itemRows.length === 0) return null;

  const categoryIdBySlug = new Map(categoryRows.map((row) => [row.id, row.slug]));

  const items: MenuItem[] = itemRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary ?? "",
    description: row.description ?? "",
    pricePaise: row.price_paise,
    categoryId: row.category_id ? (categoryIdBySlug.get(row.category_id) ?? "") : "",
    image: {
      src: row.image_path ?? "/images/menu/placeholder.jpg",
      alt: row.image_alt ?? row.name,
      width: 1200,
      height: 900,
      tone: "#2a2119",
    },
    dietary: row.dietary_kind ? [{ kind: row.dietary_kind, verified: row.dietary_verified }] : [],
    spice: row.spice_level ?? undefined,
    availability: {
      available: row.is_available,
      reason: row.unavailable_note ?? undefined,
    },
    optionGroups: row.option_groups ?? [],
    featured: row.is_featured,
    // Live rows are the restaurant's own content, so they are not sample data.
    demo: false,
  }));

  return {
    source: "supabase",
    updatedAt: new Date().toISOString(),
    categories: categoryRows.map((row) => ({
      id: row.slug,
      slug: row.slug,
      name: row.name,
      blurb: row.blurb ?? "",
      order: row.sort_order,
    })),
    items: items.map((item) => ({
      ...item,
      categoryId: item.categoryId || (categoryRows[0]?.slug ?? ""),
    })),
  };
}
