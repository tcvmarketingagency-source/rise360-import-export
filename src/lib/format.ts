/** Currency & display formatting. All money in this codebase is integer paise. */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** ₹ formatted with the Indian numbering system (₹1,23,456). */
export function formatMoney(paise: number): string {
  return inr.format(paise / 100);
}

/** Compact price for cards — drops trailing .00 so the grid stays calm. */
export function formatPrice(paise: number): string {
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? `₹${rupees}` : `₹${rupees.toFixed(2)}`;
}

export function formatDelta(paise: number): string {
  if (paise === 0) return "Included";
  return `${paise > 0 ? "+" : "−"}${formatPrice(Math.abs(paise))}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}
