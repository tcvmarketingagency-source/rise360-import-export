/**
 * Menu domain model.
 *
 * Deliberately separated from every visual component: pages, cards, dialogs and
 * the cart all consume these types, so the same UI can render authored sample
 * content today and Supabase rows (or Maitri's approved menu sheet) later.
 */

export type DietaryKind = "veg" | "non-veg" | "egg" | "vegan" | "jain";

export interface DietaryMark {
  kind: DietaryKind;
  /**
   * `true` only when the restaurant has confirmed the classification.
   * Unverified marks are shown as "TO CONFIRM" in preview mode and are hidden
   * entirely in production mode.
   */
  verified: boolean;
}

export type SpiceLevel = "mild" | "medium" | "hot";

export interface MenuOptionChoice {
  id: string;
  label: string;
  /** Price difference in paise (0 = included, negative allowed later for swaps). */
  priceDeltaPaise: number;
  demo?: boolean;
}

export interface MenuOptionGroup {
  id: string;
  label: string;
  type: "single" | "multi";
  required: boolean;
  choices: MenuOptionChoice[];
  /** Sample option set authored for the concept build. */
  demo: boolean;
}

export interface MenuImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Dominant colour used as the pre-load surface — prevents layout shift. */
  tone: string;
}

export interface MenuItem {
  id: string;
  slug: string;
  name: string;
  /** One-line description used on cards. */
  summary: string;
  /** Longer copy used in the item dialog. */
  description: string;
  pricePaise: number;
  categoryId: string;
  image: MenuImage;
  dietary: DietaryMark[];
  spice?: SpiceLevel;
  availability: {
    available: boolean;
    /** Shown to customers when an item is temporarily unavailable. */
    reason?: string;
  };
  optionGroups: MenuOptionGroup[];
  /** Editorial highlight row — a curated sample selection, not a sales claim. */
  featured?: boolean;
  /** Authored placeholder content that Maitri must replace. */
  demo: boolean;
}

export interface MenuCategory {
  id: string;
  slug: string;
  name: string;
  /** Short line shown under the category name. */
  blurb: string;
  order: number;
}

export interface MenuSource {
  source: "sample" | "supabase";
  /** ISO timestamp of the data snapshot shown to customers. */
  updatedAt: string;
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface CartSelection {
  groupId: string;
  groupLabel: string;
  choiceIds: string[];
  choiceLabels: string[];
  priceDeltaPaise: number;
}

export interface CartLine {
  /** Stable identity: item + normalised option selection. */
  key: string;
  itemId: string;
  slug: string;
  name: string;
  imageSrc: string;
  basePricePaise: number;
  quantity: number;
  selections: CartSelection[];
  selectionsDeltaPaise: number;
  unitPricePaise: number;
  lineTotalPaise: number;
}
