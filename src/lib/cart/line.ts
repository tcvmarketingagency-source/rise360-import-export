import type { CartLine, CartSelection, MenuItem, MenuOptionGroup } from "@/lib/menu/types";

export const MAX_LINE_QUANTITY = 20;

export interface DraftSelection {
  [groupId: string]: string[];
}

/** Default selection for an item: first choice of every required group. */
export function defaultSelection(item: MenuItem): DraftSelection {
  const draft: DraftSelection = {};
  for (const group of item.optionGroups) {
    if (group.required && group.choices.length > 0) {
      const first = group.choices[0];
      if (first) draft[group.id] = [first.id];
    }
  }
  return draft;
}

/** Options that are still missing a choice, so the add-to-cart button can block. */
export function missingRequiredGroups(item: MenuItem, draft: DraftSelection): MenuOptionGroup[] {
  return item.optionGroups.filter((group) => {
    if (!group.required) return false;
    const picked = draft[group.id] ?? [];
    return picked.length === 0;
  });
}

function resolveSelections(item: MenuItem, draft: DraftSelection): CartSelection[] {
  const selections: CartSelection[] = [];
  for (const group of item.optionGroups) {
    const picked = (draft[group.id] ?? []).filter((id) =>
      group.choices.some((choice) => choice.id === id),
    );
    if (picked.length === 0) continue;
    const chosen = group.choices.filter((choice) => picked.includes(choice.id));
    selections.push({
      groupId: group.id,
      groupLabel: group.label,
      choiceIds: chosen.map((choice) => choice.id).sort(),
      choiceLabels: chosen.map((choice) => choice.label),
      priceDeltaPaise: chosen.reduce((sum, choice) => sum + choice.priceDeltaPaise, 0),
    });
  }
  return selections;
}

/** Stable line key so "Chicken Biryani · Full · Extra raita" merges in the cart. */
export function buildLineKey(item: MenuItem, selections: CartSelection[]): string {
  const signature = selections
    .map((selection) => `${selection.groupId}:${[...selection.choiceIds].sort().join("+")}`)
    .sort()
    .join("|");
  return signature.length > 0 ? `${item.id}__${signature}` : item.id;
}

export function buildCartLine(item: MenuItem, draft: DraftSelection, quantity: number): CartLine {
  const selections = resolveSelections(item, draft);
  const delta = selections.reduce((sum, selection) => sum + selection.priceDeltaPaise, 0);
  const unitPricePaise = item.pricePaise + delta;
  const safeQuantity = Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.trunc(quantity)));

  return {
    key: buildLineKey(item, selections),
    itemId: item.id,
    slug: item.slug,
    name: item.name,
    imageSrc: item.image.src,
    basePricePaise: item.pricePaise,
    quantity: safeQuantity,
    selections,
    selectionsDeltaPaise: delta,
    unitPricePaise,
    lineTotalPaise: unitPricePaise * safeQuantity,
  };
}

function reprice(line: CartLine, quantity: number): CartLine {
  const safeQuantity = Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.trunc(quantity)));
  return { ...line, quantity: safeQuantity, lineTotalPaise: line.unitPricePaise * safeQuantity };
}

export function addLine(lines: CartLine[], incoming: CartLine): CartLine[] {
  const existing = lines.find((line) => line.key === incoming.key);
  if (!existing) return [...lines, incoming];
  return lines.map((line) =>
    line.key === incoming.key
      ? reprice(line, line.quantity + incoming.quantity)
      : line,
  );
}

export function setLineQuantity(lines: CartLine[], key: string, quantity: number): CartLine[] {
  if (quantity <= 0) return lines.filter((line) => line.key !== key);
  return lines.map((line) => (line.key === key ? reprice(line, quantity) : line));
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((line) => line.key !== key);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);
}
