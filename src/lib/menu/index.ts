import { sampleMenu } from "./sample-menu";
import type { DietaryKind, MenuCategory, MenuItem, MenuSource } from "./types";

/**
 * Menu repository. Today it returns the authored sample menu; the same shape can
 * later be served from Supabase (see src/lib/supabase/) without touching UI code.
 */
export function getMenu(): MenuSource {
  return sampleMenu;
}

export function getMenuItems(): MenuItem[] {
  return getMenu().items;
}

export function getCategories(): MenuCategory[] {
  return [...getMenu().categories].sort((a, b) => a.order - b.order);
}

export interface CategoryFacet extends MenuCategory {
  count: number;
}

export function getCategoryFacets(items: MenuItem[] = getMenuItems()): CategoryFacet[] {
  return getCategories().map((category) => ({
    ...category,
    count: items.filter((item) => item.categoryId === category.id).length,
  }));
}

export function getItemBySlug(slug: string): MenuItem | undefined {
  return getMenuItems().find((item) => item.slug === slug);
}

export function getFeaturedItems(limit = 6): MenuItem[] {
  const items = getMenuItems();
  const featured = items.filter((item) => item.featured);
  return featured.length >= limit ? featured.slice(0, limit) : [...featured, ...items.slice(0, limit - featured.length)];
}

export interface MenuQuery {
  categoryId?: string | null;
  search?: string;
  dietary?: DietaryKind | "all";
  onlyAvailable?: boolean;
}

/** Pure filter used by the menu explorer and covered by unit-ish E2E checks. */
export function filterMenuItems(items: MenuItem[], query: MenuQuery = {}): MenuItem[] {
  const term = query.search?.trim().toLowerCase() ?? "";
  return items.filter((item) => {
    if (query.categoryId && item.categoryId !== query.categoryId) return false;
    if (query.onlyAvailable && !item.availability.available) return false;
    if (query.dietary && query.dietary !== "all") {
      const matches = item.dietary.some((mark) => mark.kind === query.dietary);
      if (!matches) return false;
    }
    if (term.length > 0) {
      const haystack = [item.name, item.summary, item.description, ...item.dietary.map((d) => d.kind)]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

/** Adds-ons that reuse the same item id so the summary stays readable. */
export function getOptionChoiceLabel(item: MenuItem, groupId: string, choiceId: string): string | null {
  const group = item.optionGroups.find((candidate) => candidate.id === groupId);
  const choice = group?.choices.find((candidate) => candidate.id === choiceId);
  return choice?.label ?? null;
}
