"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MenuCard } from "./MenuCard";
import { ItemDialog } from "./ItemDialog";
import { MicroLabel, SampleBadge } from "@/components/ui/Bits";
import { useCart } from "@/components/cart/CartProvider";
import { filterMenuItems, getCategoryFacets, getMenuItems } from "@/lib/menu";
import { defaultSelection } from "@/lib/cart/line";
import { menuSectionCopy } from "@/lib/content/site";
import { bezier } from "@/lib/motion/tokens";
import type { DietaryKind, MenuItem } from "@/lib/menu/types";

const dietFilters: { id: DietaryKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "veg", label: "Veg" },
  { id: "non-veg", label: "Non-veg" },
];

export function MenuExplorer() {
  const items = useMemo(() => getMenuItems(), []);
  const facets = useMemo(() => getCategoryFacets(items), [items]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [dietary, setDietary] = useState<DietaryKind | "all">("all");
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const { addItem } = useCart();
  const searchRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => filterMenuItems(items, { search, categoryId, dietary }),
    [items, search, categoryId, dietary],
  );

  const quickAdd = (item: MenuItem) => {
    if (!item.availability.available) return;
    addItem(item, defaultSelection(item), 1);
  };

  const reset = () => {
    setSearch("");
    setCategoryId(null);
    setDietary("all");
    searchRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Filter bar: sticky under the header, never hiding the grid ────── */}
      <div
        className="sticky top-[71px] z-40 -mx-[clamp(1rem,4.5vw,4.5rem)] border-y border-ivory/10 bg-ink/88 px-[clamp(1rem,4.5vw,4.5rem)] py-3 backdrop-blur-md"
        data-testid="menu-filters"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label htmlFor="menu-search" className="sr-only">
                Search the menu
              </label>
              <input
                ref={searchRef}
                id="menu-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={menuSectionCopy.searchPlaceholder}
                className="h-12 w-full rounded-sm border border-ivory/15 bg-char/70 pl-11 pr-11 text-[0.92rem] text-ivory placeholder:text-ash/60 focus-visible:border-amber"
                data-testid="menu-search"
                autoComplete="off"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ash"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4.5 4.5" />
              </svg>
              {search.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ash transition-colors hover:text-amber"
                  aria-label="Clear search"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M5 5l14 14M19 5L5 19" />
                  </svg>
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2" role="group" aria-label="Dietary filter">
              {dietFilters.map((filter) => {
                const active = dietary === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setDietary(filter.id)}
                    aria-pressed={active}
                    className={`micro h-11 rounded-full border px-4 transition-colors ${
                      active
                        ? "border-amber/70 bg-amber/12 text-amber"
                        : "border-ivory/15 text-ivory/70 hover:border-ivory/35"
                    }`}
                    data-testid={`diet-filter-${filter.id}`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label="Menu categories">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              aria-pressed={categoryId === null}
              className={`micro h-10 shrink-0 rounded-full border px-4 transition-colors ${
                categoryId === null
                  ? "border-amber/70 bg-amber/12 text-amber"
                  : "border-ivory/15 text-ivory/70 hover:border-ivory/35"
              }`}
            >
              Everything · {items.length}
            </button>
            {facets.map((facet) => {
              const active = categoryId === facet.id;
              return (
                <button
                  key={facet.id}
                  type="button"
                  onClick={() => setCategoryId(active ? null : facet.id)}
                  aria-pressed={active}
                  className={`micro h-10 shrink-0 rounded-full border px-4 transition-colors ${
                    active
                      ? "border-amber/70 bg-amber/12 text-amber"
                      : "border-ivory/15 text-ivory/70 hover:border-ivory/35"
                  }`}
                  data-testid={`category-${facet.slug}`}
                >
                  {facet.name} · {facet.count}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="micro text-ash/80">
              <span className="tnum text-ivory/90">{results.length}</span> {menuSectionCopy.resultLabel}
              {search.trim().length > 0 ? ` · “${search.trim()}”` : ""}
            </p>
            <p className="micro flex items-center gap-2 text-ash/70">
              <SampleBadge />
              Dietary marks unverified
            </p>
          </div>
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {results.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: bezier.soft }}
            className="flex flex-col items-start gap-4 rounded-sm border border-ivory/12 bg-char/40 px-6 py-10"
            data-testid="menu-empty"
          >
            <MicroLabel tone="amber">No results</MicroLabel>
            <h3 className="text-[1.4rem] text-ivory">{menuSectionCopy.emptyTitle}</h3>
            <p className="max-w-md text-[0.9rem] text-ash">{menuSectionCopy.emptyBody}</p>
            <button
              type="button"
              onClick={reset}
              className="micro h-11 rounded-full border border-amber/50 px-5 text-amber transition-colors hover:bg-amber/10"
            >
              {menuSectionCopy.resetLabel}
            </button>
          </motion.div>
        ) : (
          <motion.ul
            key="grid"
            layout
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="menu-grid"
          >
            {results.map((item, index) => (
              <li key={item.id} className="h-full">
                <MenuCard
                  item={item}
                  index={index}
                  onOpen={setActiveItem}
                  onQuickAdd={quickAdd}
                  priority={index < 3}
                />
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <ItemDialog
        key={activeItem?.id ?? "empty"}
        item={activeItem}
        open={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
      />
    </div>
  );
}
